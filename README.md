
# Immux

**JavaScript state container**

---

TODO: description

Relatives: [globus](https://github.com/jbe/globus) | [SimpleImmutable](https://github.com/jbe/simple-immutable) | [kjappas](https://github.com/jbe/kjappas)

*This project is in development, and may contain some bugs. It doesn't have any tests yet.*

## Installation

`npm install --save immux`

## Code sample

```javascript
import { createStore, Adapters } from "immux";
import { createRefresh, infest } from "kjappas";
import SimpleImmutable from "simple-immutable";

infest(window);

const reducers = {
  counter: {
    initial: {value: 0},

    increment: (state) => state.set("value", state.get("value") + 1)
  }
};

function CounterView($, _) {
  return div(".hello",
    h1("The amazing counter app"),
    button(
      {
        $click: () => $.counter.increment(1)
      },
      "Value: " + _.counter.value)
  );
}

const
    adapter = Adapters.SimpleImmutable(SimpleImmutable),
    store   = createStore(reducers, adapter);

document.addEventListener("DOMContentLoaded", function() {

  const refresh = createRefresh(
    CounterView,
    document.getElementById("app-placeholder"));

  store.subscribe(refresh);
  refresh(store.$, store._);
});
```

## API

*TODO*

#### global(reducerFunc)
#### produce(value)
#### createStore(reducerTree, adapter)
#### consoleLogger(tree, state, func, args)

#### Adapters.SimpleImmutable(SimpleImmutable)
