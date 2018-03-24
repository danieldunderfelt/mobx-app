mobx-app
========

This is my preferred state structure for [mobx](http://mobxjs.github.io/mobx/index.html) projects.
mobx-app provides a very light (VERY LIGHT!) functional structure over mobx without hiding mobx in any way.

mobx-app was inspired by functional programming and does not use classes or inheritance. Composition all the way!

mobx-app itself is not really a library, it is a theory of how to structure applications that use mobx as their
state manager. Mobx does not, as opposed to Redux, provide any structure for your state. In using mobx in React apps,
I found myself re-creating a simple class-based structure (gotta love them decorators!) for each project. Juggling
instances got old quick, so I sought inspiration from functional programming on how to untangle
the mess. mobx-app is the (still work-in-progress!) result.

Install
-------

With npm:

`npm install --save mobx-app`

mobx-app also relies on some peer dependencies that you probably already have in your project:

`npm install --save lodash mobx`

Overview
--------

The core concepts of mobx-app:

- The state is a single observable object (hello Redux!)
- The various facets of the state is expressed in `stores`
- Stores are functions that receive the state object and optionally initial data
- Store functions return actions
- Store functions extend the state they receive with their own state.
- Initial data (server-side rendering, localstorage) is a first-class citizen
- Use `computed` as much as possible
- Actions (and ONLY actions) mutate state directly

#### Stores
Stores are simple functions with the following signature:

```
(state, initialData) => actions
```

They exist to bootstrap a slice of your state and add reactions or other subscriptions. Most importantly, they
return actions. I recommend putting actions in a separate file so that they can be reused in other places.

An example of a store factory:

```javascript
import { extendObservable } from 'mobx'

const Store = (state, initialData) => {

    extendObservable(state, {
        some: 'data',
        items: []
    })
    
    // Initialize actions with the state
    const actions = storeActions(state)
    
    // Run initial setup
    actions.setItems(initialData.items)

    return actions
}
```

Here we are using the standard `extendObservable` function from mobx to extend new state properties onto the
global state. When we compose actions, we can feed the whole state object to the action factory. Actions do not
need to be tied to a store, but any store can import any action factory and use it. The actions are then
returned from the store in order to be available under the store name on the global actions object.

If you need namespaces in the state, just add your store properties under a namespace. It's that simple.
No special mechanisms.

Any store setup should be performed after the state has been extended and the actions created. The initial
setup procedures can then freely use any actions and state that the store makes available. This is a good
opporunity to add `reaction`s, any socket subscriptions or things like that.

The store setup is also where you can use the store actions to apply any initial data the store might receive.
Of course, if the data can be imported into the store without going through actions, feel free to assign it
when you extend the global state. I do however recommend that ANY data that goes into the state goes through your
actions.

#### Actions
Actions are simple functions that (usually) mutate the state. Mutator actions are wrapped in mobx `action`s.
As already discussed, actions are most conveniently created from a factory that receives the state. Use
composition to efficiently create specific actions that build on more general ones! In fact, mobx-app ships
with a handful of actions for setting values and working with collections. You know, the things you usually
do in an app.

"Actions" can also be functions that do not directly mutate the state, for example fetcher functions for your api.
I include these in the umbrella term `actions` and even define them in the same factory as other actions.
They are, after all, actions that your app can perform.

An example of an action factory:

```javascript
import { action } from 'mobx'

const storeActions = state => {

    const replaceItems = action((items) => {
        state.items.replace(items)
    })
    
    const addItem = action((item) => {
      state.items.push(item)
    })
    
    async function fetchItems(params) {
        const newItemsReq = await fetch('https://example.com/api/items')
        const newItems = await newItemsReq.json()
        replaceItems(newItems)
    }
    
    return {
        fetchItems,
        replaceItems,
        addItem
    }
}
```

In its simplest form, the actions tap into the state and perform mutations on it. You may want to pass in the
name of the state property that these actions should concern, but I like to keep it simple.

#### createStore
You might have noticed that we haven't used a single thing you just installed with npm yet. That's the point;
mobx-app is more of a concept than a library. The library `mobx-app` is simply a few helpers for implementing
this state structure.

At the heart of mobx-app is the `createStore` function that creates your single state and actions. It should
receive a map of store functions, loop through it, calling each function with the state and initial data as
it goes. Anything returned from the store function gets assigned to an `actions` object under the key from
the initial store map. The result is a map of actions, bearing the same keys as the initial map of stores,
as well as the single state object.

An example:

```javascript
import { createStore } from 'mobx-app'

const stores = {
  Store
}

const { state, actions } = createStore(stores, initialData)
```

Since mobx-app is unabashedly React-focused, the next step is to use `Provider` from `mobx-react` to add your
`state` and `actions` to the context of your components:

```javascript
import { Provider } from 'mobx-react'

const app = (
  <Provider actions={ actions } state={ state }>
    <YourApp />
  </Provider>
)
```

Access these with `@inject` from `mobx-react` using the `app` helper as a selector function. `app` returns a
function that instructs `@inject` which props to pass the component. `app` can take a list of store
names as arguments, that will result in the corresponding actions to be injected as props under the name.

Remember to still use `observer`!

```javascript
import { observer } from 'mobx-react'
import { app } from 'mobx-app'

@inject(app('Store'))
@observer
class MyComponent extends Component {
  
  render() {
    const { Store, state } = this.props
    
    return (
      <div>
        { state.some } // prints 'data'
        <button onClick={ () => Store.addItem({ name: 'new item' }) } />
      </div>
    )
  }
}
```

#### Included actions
mobx-app ships with actions for working with collections (arrays of objects) and values.

The value actions exist so that you do not have to wrap all your actions in `action`, you can just create
new actions for a specific value and call those actions from your higher-order action.

The collection actions wrap an array of objects and enable you to easily add, get, update and remove objects.
The add actions can either simply replace all items, or add new items while checking for uniqueness. You can
also specify a factory function that all new items go through automatically. Please see the api section below
for more specific information, but here's an example:

```javascript
import { collection, value } from 'mobx-app'

const itemFactory = itemData => { ... } // Do something with each item before adding it.

const yourActions = state => {
  const itemActions = collection(state.items, itemFactory)
  const someActions = value(state, 'some') // Remember the `some` property from the store above ;)
  
  function addItems(stuff) {
    return itemActions.addItems(stuff)
    // state.items will now contain everything from `stuff` that didn't exist before
  }
  
  function setSome(newValue) {
    return someActions.setItem(newValue)
    // Also includes `extendItem` for object values what you want to extend.
  }
  
  return {
    ...itemActions,
    setSome,
    addItems // The new addItems action will override the addItem action from `ìtemActions` for each consumer of these actions. 
  }
}
```

API
---

### `createStore()`

Receives 1. a map of stores:

```javascript
const stores = {
  ItemStore: itemStore,
  OtherStore: otherStore
}
```

and 2. an object representing initial data. createStore returns an object with the keys `state`, which is a mobx-observable
object, and `actions` which is a plain object with the same keys as above, but containing the actions returned
from the respective stores. The state is not partitioned according to the keys by default.

The store factories passed through `createStore` will be called with the following arguments:

`store(state, initialData, name)`

State is the global state, initialData is the initial data and name is the key that the store was registered under
in the initial store map that you passed to `createStore`. Use the name for namespacing the state if you need to.

---

### `@app()`

Selector function factory for mobx-react's `inject`.

Receives an argument list of arbitrary length of action names to add to the `props` of React components.
It will also in all cases add the state as a prop of the component. If called with no arguments, all
action names will be added to the props. If called with the special argument `'state'`, only the state
will be added to the props.

```javascript
// Props added to the component:
// { state, ItemStore }
@inject(app('ItemStore'))

// Props added to the component:
// { state, ItemStore, OtherStore }
@inject(app())

// Props added to the component:
// { state }
@inject(app('state'))
```

So yeah, it might be a bad idea to call your store `state`. The special case was added because the main job of
React components is to render the current state as UI. To mutate the state is secondary and I want to give you
a way to prevent littering your component props.

Also, I highly recommend to capitalize the name of the stores. When developing, you may want to pass in props of the
same name as some of your stores. Normal `inject` rules apply, and your prop will overwrite what `app` wanted to
inject.

---

### `collection()`

The collection action factory eases your interactions with observable collections. The factory takes an
observable array as its only argument and returns all collection actions.

A collection is usually an array of objects, but `collection` will also, in most cases, support arrays
of simple values.

`const itemActions = collection(itemCollection)`

##### `itemActions.setItems(items) => itemCollection`
setItems replaces the array with new items.

##### `itemActions.addItems(items, unique = 'id', processAll) => [added items]`
addItems adds new items into the collection. Give a property name as a string as the `unique` argument to
make that property value unique among all items in the collection. Pass `false` as the unique argument
to disable the uniqueness check. The uniqueness check is on by default for the property `id`.

addItems also takes a `processAll` argument. This is a function that will be called with the whole
collection, new items added, right before the old collection is replaced with it. This is an opportunity
to sort the collection among other things.

##### `itemActions.addItem(item, unique = 'id', replace = false, first = false) => item`
addItem adds a single item to the collection. Unique checking is on by default for the `id` property.

The `replace` argument determines how the action behaves if an existing item is found in the collection
with the same property value unique checked for. Normally this will cause addItem to return without adding
anything, but by setting this to  `true`, addItem will isntead replace the exisitng item with the new one.

The `first` argument decides if the new item should be added as the first element in the collection (using
splice) or, the default, as the last element in the collection (using push).

##### `itemActions.updateItem(item, idProp = 'id') => item`
updateItem will use `extendObservable` with the new data on an existing item if found in the collection.
Use the idProp argument to define how an existing item is matched.

##### `itemActions.updateOrAdd(item, idProp = 'id', first = false) => item`
This action will first determine if the item exists in the collection. If it does, `updateItem` will be
invoked. If it doesn't, `addItem` will be invoked.

##### `itemActions.removeItem(itemOrIndexOrId, idProp = 'id') => false || the removed item`
removeItem will cook dinner and play the ukulele for you.

No but seriously, it removes an item from the collection. It can take either an item, an index or an id.
If the first argument is a number, the item at that index will be removed. If it is a string, the item with
the idProp of the same value will be removed. If it is an object, the item will be found from the collection
by the idProp and removed.

Please use a higher-order function to customize this behaviour if needed.

##### `itemActions.clear(matcherFunction = false)`
Clears the collection completely if a matcher function is not passed. If a matcher is passed, each item the
matcher returns true for will be removed from the collection.

---

### `value()`

The value actions contain a few shortcuts for setting values, mainly so that you don't need to wrap your own
actions with `action`. They are also quite convenient! To create value actions, pass in the state object AND
the name of the value these actions should concern as a string. You may also pass an initial value, that will
be assigned if you invoke the actions without arguments.

`const valueActions = value(state, 'value', null)`

The property name will be used as a suffix for each action returned from the factory.

An example of computed action names:

```javascript
const valueActions = value(state, 'derp') => { setDerp, extendDerp }
const valueActions = value(state, 'item') => { setItem, extendItem }
```

This way you can make setter actions for many items in one store or action factory without them interfering
with each other.

##### `valueActions.setValue(newValue = initial) => newValue`
Assigns the new value to the property.

##### `valueActions.extendValue(newValue = initial) => extendObservable(state.value, newValue)`
Extends the new value onto a property of type object.

---

Roadmap
-------

This is an initial release that only serves to get this idea out, because I think it is important.
For each new project I recreated a clunky state structure with classes until a lightbulb went off
and I got excited for the idea of composition over inheritance and this state structure was born.

I also think the lack of structure is a silent issue with mobx for new developers, This is unfair,
but comparisons to Redux are inevitably made. New developers are lost on how to structure their state,
and seasoned mobx developers all have a different structure. There are many libraries on npm that bring
strcuture to mobx, but most are unmaintained. That is why mobx-app is more of a theory than a library.
You could easily implement it completely without even installing mobx-app! I just wanted a single source of
truth to the various helpers that I have deviced in various projects.

### Next up:
- Add tests (hey, this is only a quick and dirty braindump so far!)
- Include more actions (mobx maps up next!)
- Listen to feedback and evolve mobx-app!
