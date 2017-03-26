
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
import { createStore, consoleLogger, Adapters } from "immux";
import { createRefresh } from "kjappas";
import SimpleImmutable from "simple-immutable";

import root from "./model/root.coffee";
import setGlobalListeners from  "./setGlobalListeners.coffee";
import {App} from "./view/layouts.coffee";

const adapter = Adapters.SimpleImmutable(SimpleImmutable);
const {$, _, subscribe} = createStore(root, adapter);

document.addEventListener("DOMContentLoaded", function() {

  const refresh = createRefresh(
    App,
    document.getElementById("app-placeholder"));

  subscribe(consoleLogger, refresh);

  refresh($, _);
  setGlobalListeners($);
});

```

## API

*TODO*

#### global(reducerFunc)
#### produce(value)
#### createStore(reducerTree, adapter)
#### consoleLogger(tree, state, func, args)

#### Adapters.SimpleImmutable(SimpleImmutable)
