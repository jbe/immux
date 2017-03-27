var slice = [].slice, hasProp = {}.hasOwnProperty;

export function global(fn) {
  fn._$$global = true;
  return fn;
};

export var Adapters = {
  SimpleImmutable: function(SimpleImmutable) {
    return {
      construct: function(rootValue) {
        return SimpleImmutable(rootValue);
      },
      getRootValueForViews: function(collection) {
        return collection.get();
      },
      updateAt: function(collection, path, func, funcThis, args) {
        return collection.at(path, function(v) {
          return func.call.apply(func, [funcThis, v].concat(slice.call(args)));
        });
      }
    };
  }
};

var produced = undefined;

export function produce(v) {
  return produced = v;
};

function bindReducer(scope, ssc, fn) {
  if (fn._$$global) {
    return function() {
      var oldProduced, result;
      oldProduced = produced;
      produced = void 0;
      ssc.mutate(fn, this, arguments);
      result = produced;
      produced = oldProduced;
      return result;
    };
  } else {
    return function() {
      var oldProduced, result;
      oldProduced = produced;
      produced = void 0;
      ssc.updateAt(scope, fn, this, arguments);
      result = produced;
      produced = oldProduced;
      return result;
    };
  }
};

function bindReducerTree(ssc, reducerTree, scope) {
  var k, newScope, r, v;
  if (scope == null) {
    scope = [];
  }


  switch (typeof reducerTree) {
    case "function":
      reducerTree._$$name = scope.join(".");
      return bindReducer(scope.slice(0, scope.length - 1), ssc, reducerTree);
    case "object":
      r = {};
      for (k in reducerTree) {
        if (!hasProp.call(reducerTree, k)) continue;
        v = reducerTree[k];
        if (k !== "initial") {
          newScope = scope.slice();
          newScope.push(k);
          r[k] = bindReducerTree(ssc, v, newScope);
        }
      }
      return r;
    default:
      console.log(reducerTree);
      throw new Error("Invalid reducer tree node");
  }
};

function extractInitialState(root, scope) {
  var k, newScope, r, v;
  if (scope == null) {
    scope = [];
  }
  switch (typeof root) {
    case "object":
      if (root.initial) {
        return root.initial;
      }
      r = {};
      for (k in root) {
        if (!hasProp.call(root, k)) continue;
        v = root[k];
        newScope = scope.slice();
        newScope.push(k);
        r[k] = extractInitialState(v, newScope);
      }
      return r;
    case "function":
      break;
    default:
      console.log("state." + scope.join(".") + " was", root);
      throw new Error("Invalid tree node.");
  }
};

function SimpleStateContainer(collection, adapter) {
  var listeners;
  collection = adapter.construct(collection);
  listeners = [];
  return {
    subscribe: function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return listeners.push.apply(listeners, args);
    },
    get: function() {
      return collection;
    },
    mutate: function(func, funcThis, args) {
      var fn, i, len;
      collection = func.call.apply(func, [funcThis, collection].concat(slice.call(args)));
      for (i = 0, len = listeners.length; i < len; i++) {
        fn = listeners[i];
        fn(adapter.getRootValueForViews(collection), func, args);
      }
      return void 0;
    },
    updateAt: function(path, func, funcThis, args) {
      var fn, i, len;
      collection = adapter.updateAt(collection, path, func, funcThis, args);
      for (i = 0, len = listeners.length; i < len; i++) {
        fn = listeners[i];
        fn(adapter.getRootValueForViews(collection), func, args);
      }
      return void 0;
    }
  };
};

export function consoleLogger($, _, fn, params) {
  if (params.length && params.length > 1) {
    params = [params[0], "(...)"];
  }
  console.groupCollapsed.apply(console, ["$." + fn._$$name].concat(slice.call(params)));
  console.log(fn);
  console.log(_);
  console.trace("Trace");
  return console.groupEnd();
};

export function createStore(reducerTree, adapter) {
  var $, initialState, ssc, subscribe;
  if (!reducerTree) {
    throw new Error("no reducer tree passed to crateStore");
  }
  if (!adapter) {
    throw new Error("adapter passed to crateStore");
  }
  initialState = extractInitialState(reducerTree);
  ssc = SimpleStateContainer(initialState, adapter);
  $ = bindReducerTree(ssc, reducerTree, []);
  subscribe = function() {
    var fns;
    fns = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return ssc.subscribe(function(_, fnName, params) {
      var fn, i, len, results;
      results = [];
      for (i = 0, len = fns.length; i < len; i++) {
        fn = fns[i];
        results.push(fn($, _, fnName, params));
      }
      return results;
    });
  };
  return {
    _: ssc.get().get(),
    $: $,
    subscribe: subscribe
  };
};
