
# Immux

**JavaScript state container**

---

`npm install --save immux`

*This project is in development, and may contain some bugs. It doesn't have any tests yet.*

Immux is a JavaScript state container, similar to [Redux](https://github.com/reactjs/redux#readme), but with some differences:

- Actions are functions, not cases in a switch statement
- There are no action creators (they're sort of the same as the reducer)
- You bind your entire reducer hierarchy once, not in each component

Rather than trying to explain, lets first see the mandatory counter app example code:


## Code sample

```javascript
import { createStore, Adapters } from "immux";

// we use kjappas to define view templaes
import { createRefresh, infest } from "kjappas";

// we use SimpleImmutable as our data format
import SimpleImmutable from "simple-immutable";

// define the kjappas HTML tag helpers globally
infest(window);

// The reducer definition tree that we will bind to our immux store.
// The nesting structure accomplishes the same as combineReducers  in Redux.
const reducers = {
  counter: {
    // initial counter state
    initial: {value: 0},

    increment: (state, addend) =>
      state.set("value", state.get("value") + addend || 1)
  }
};

// Our root view template; a pure function from root state and dispatchable actions, to a virtual that will be rendered on every update.
// $ is a bound version of the reducer tree which can be used to dispatch state changes.
// _ is the root state (as plain JavaScript, because this is the default for the SimpleImmutable adapter that we use here).

function CounterView($, _) {
  return div(".hello",
    h1("The amazing counter app"),
    button(
      {
        // Dispatch counter increment action on click
        $click: () => $.counter.increment(1)
      },
      // Show the current value of the counter
      "Value: " + _.counter.value)
  );
}

// Create an adapter for our data format (SimpleImmutable),
// and a store, which binds the reducer definition tree.
const
    adapter = Adapters.SimpleImmutable(SimpleImmutable),
    store   = createStore(reducers, adapter);

document.addEventListener("DOMContentLoaded", function() {

  // Create the refresh function, which can be used to draw the template
  // to the dom.
  const refresh = createRefresh(
    CounterView,
    document.getElementById("app-placeholder"));

  // Subscribe the refresh function to state changes
  store.subscribe(refresh);
  // Do the initial refresh, passing the bound reducer tree and the
  // initial state from the store.
  refresh(store.$, store._);
});
```

Relatives: [globus](https://github.com/jbe/globus) | [SimpleImmutable](https://github.com/jbe/simple-immutable) | [kjappas](https://github.com/jbe/kjappas)



## API

#### createStore(reducerTree, adapter)

Given a tree of reducer definitions, and the data type adapter for the data type used by the reducers and initial values of the tree, return an immux store object with the fields `{$, _, subscribe}`.

The returned field `$` will be a tree of bound reducer functions than can be called to cause state changes. This is the immux equivalent to `store.dispatch` in Redux. The tree of bound reducers is a one-to-one mapping of the tree of reducer function definitions.

The returned field `_` will contain the inital state that was produced from the tree of reducer definitions. This can be used however you like, but most typically to do the initial draw call, before any changes have had the chance to trigger any subscriptions.

The returned field `subscribe` is a function taking any number of arguments, each one being a listener function of four parameters: `$, _, func, params`

- `$` is the same object as the `$ ` described earlier.
- `_` is the current state, which may change between invocations; unlike `$`.
- `func` is the reducer function that caused the state change.
- `params` are the parameters to the call to the reducer function which caused the state change.

*Reducer defintion* functions always take state as their first parameter, and must return the state they wish to cause.

*Bound reducer* functions no longer take the state as their first parameter, and no longer return the updated state. However, when they are called, they will inflict this state change on the store that they are bound to.

Reducer state is local by default. A reducer residing at `root.users.add`, will have its state implicitly nested under the `users` path, unless it is explicitly marked as global.

TODO: examples

#### consoleLogger(tree, state, func, args)

As convenience, immux includes a simple console logger that can be subscribed on a store to print all dispatched state changes to the console.

TODO: example

#### global(reducerFunc)

Marks a reducer function definition as global. Global reducers work on the root state rather than the local state.

TODO: example

#### produce(value)

Used to define reducers that return values. Reducers cause state changes by returning the updated state. However, some times, you might want to be able to return some other value from the reducer, which will be of use at the call site of the bound reducer function. Since the return value is already being used to magically update state, we have to use another mechanism. Calling `produce(value)` inside a reducer function definition, will cause the bund reducer to return that value when called.

TODO: example

## Adapters

#### Adapters.SimpleImmutable(SimpleImmutable)

SimpleImmutable is an immutable data type that was designed specifically for immux. It provides O(1) conversion to plain JS, which allows us to pass the state to the view as plain js.

One of my main goals with immux was to let the view be a 100% pure function of the state (with the slight exception of dispatching, of course). SimpleImmutable makes this very clean, because the only thing the views every deal with are plain, frozen JavaScript values.

For a usage example, just se the example code near the top of this README.
