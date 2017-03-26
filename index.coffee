
# EXPORTED (experimental)
# Mark a reducer function as global. This will cause it to work on
# the root state instead of state in its local namespace.
global = (fn) ->
  fn._$$global = true
  fn

# EXPORTED
Adapters = {
  SimpleImmutable: (SimpleImmutable) -> {
    construct: (rootValue) -> SimpleImmutable rootValue
    getRootValueForViews: (collection) -> collection.get()
    updateAt: (collection, path, func, funcThis, args) ->
      collection.at path, (v) -> func.call(funcThis, v, args...)
  }
}

produced = undefined

# EXPORTED (experimental)
# Used to make reducers that return a value besides mutating the state.
produce = (v) -> produced = v

# binds a reducer (a pure function from state to state) to the state container
# so that it can cause changes
bindReducer = (scope, ssc, fn) ->
  if fn._$$global
    ->
      oldProduced = produced
      produced = undefined
      ssc.mutate fn, this, arguments
      result = produced
      produced = oldProduced
      result
  else
    ->
      oldProduced = produced
      produced = undefined
      ssc.updateAt(scope, fn, this, arguments)
      result = produced
      produced = oldProduced
      result

    # updateAt: (path, func, funcThis, args) ->

# Helper for createStore that produces a tree of bound reducers,
# given a SimpleStateContainer and a tree of reducer definitions.
# Kind of the heart of everything.
bindReducerTree = (ssc, reducerTree, scope=[]) ->
  switch typeof reducerTree
    when "function"
      reducerTree._$$name = scope.join(".")
      bindReducer scope.slice(0, scope.length - 1), ssc, reducerTree
    when "object"
      r = {}
      for own k, v of reducerTree
        unless k == "initial"
          newScope = scope.slice()
          newScope.push k
          r[k] = bindReducerTree ssc, v, newScope
      r
    else
      console.log reducerTree
      throw new Error "Invalid reducer tree node"

# Given a tree of reducer definitions, return its initial root state
# as plain js.
extractInitialState = (root, scope=[]) ->
  switch typeof root
    when "object"
      return root.initial if root.initial
      r = {}
      for own k, v of root
        newScope = scope.slice()
        newScope.push k
        r[k] = extractInitialState v, newScope
      r
    when "function"
    else
      console.log "state." + scope.join(".") + " was", root
      throw new Error "Invalid tree node."


# a simpler state container which the rest of immux builds upon.
# connects a collection adapter and subscribers to mutative actions.
SimpleStateContainer = (collection, adapter) ->
  collection = adapter.construct(collection)
  listeners = []
  {
    subscribe: (args...) -> listeners.push args...
    get: -> collection
    mutate: (func, funcThis, args) ->
      collection = func.call(funcThis, collection, args...)
      fn(adapter.getRootValueForViews(collection), func, args) for fn in listeners
      undefined
    updateAt: (path, func, funcThis, args) ->
      collection = adapter.updateAt(collection, path, func, funcThis, args)
      fn(adapter.getRootValueForViews(collection), func, args) for fn in listeners
      undefined
  }

# EXPORTED
# a simple console logger function that can be subscribed to log state changes
consoleLogger = (tree, state, fn, params) ->
  if params.length && params.length > 1
    params = [params[0], "(...)"]

  console.groupCollapsed "$." + fn._$$name, params...
  console.log fn
  console.log state
  console.trace "Trace"
  console.groupEnd()

# EXPORTED
# Given a tree of reducer functions conforming to the spec, and
# a collection adapter, return an object on this form:
# {
#   _:         the initial state
#   $:         a corresponding tree of bound reducer functions that can be used to mutate state.
#   subscribe: takes any numer of functions as parameters, subscribing them to stage changes.
# }
createStore = (reducerTree, adapter) ->
  if (!reducerTree) throw new Error "no reducer tree passed to crateStore"
  if (!reducerTree) throw new Error "adapter passed to crateStore"

  initialState = extractInitialState reducerTree
  ssc = SimpleStateContainer initialState, adapter

  $ = bindReducerTree ssc, reducerTree, []

  subscribe = (fns...) ->
    ssc.subscribe (_, fnName, params) ->
      fn($, _, fnName, params) for fn in fns
  {
    _: ssc.get().get()
    $
    subscribe
  }

module.exports = {
  global
  produce
  createStore
  consoleLogger
  Adapters
}
