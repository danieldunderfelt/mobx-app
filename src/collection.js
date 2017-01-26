import _ from 'lodash'
import invariant from 'invariant'
import { action, extendObservable, isObservable } from 'mobx'

export default (collection, factoryOrName = _.identity, optName = 'Collection') => {

  const itemFactory = typeof factoryOrName === 'function' ? factoryOrName : _.identity
  const name = typeof factoryOrName === 'string' ? factoryOrName : optName

  function getActionName(description) {
    return `${name} - ${description}`
  }

  // Checks prop on item, or if prop is undefined item directly, against checkValue.
  function equalCheck(item, prop, checkValue) {
    const checkAgainst = typeof item !== 'object' ? item : _.get(item, prop, item)
    return checkAgainst === checkValue
  }

  // Used in array difference checks
  const differenceCheck = key => (value) => {
    return typeof value !== 'object' ? value : _.get(value, key, value)
  }

  // Replaces current items with new items
  const setItems = action(getActionName('Set items'), (items = []) => {
    const arrItems = _.flatten([ items ])
    collection.replace(arrItems.map(itemFactory))
  })

  // Gets an item from the collection (not an action per se)
  const getItem = (identifier, key = 'id') => {
    const id = _.get(identifier, key, identifier)
    const item = collection.find(item => equalCheck(item, key, identifier))

    return typeof item !== 'undefined' ? item : null
  }

  const getByIndex = (index) => {
    return collection[ index ]
  }

  const getIndex = (item, key = 'id') => {
    const id = _.get(item, key, item)
    return collection.findIndex(el => equalCheck(el, key, id))
  }

  // Adds items to the collection. Returns unprocessed array of added items.
  const addItems = action(getActionName('Add items'), (items = [], unique = 'id', processAll = _.identity) => {
    const itemsArray = _.flatten([ items ]) // Put in one-element array if only passed single item
    if ( itemsArray.length === 0 ) return [] // Bail early if no items

    // Get items not already in the collection by unique key (assumes array items are objects)
    const itemsToAdd = unique === false ? itemsArray : _.differenceBy(itemsArray, collection.slice(), differenceCheck(unique))

    // If all "new" items already exist, bail.
    if ( itemsToAdd.length === 0 ) return []

    // Run items through the factory
    const preparedItems = itemsToAdd.map(itemFactory)

    // Concatenate the new items, processed through itemFactory, to the existing collection.
    const allItems = collection.concat(preparedItems)

    // Run items through an optional processor (a good opporunity to apply ordering)
    // and replace the current collection with the new one.
    collection.replace(processAll(allItems))

    return preparedItems
  })

  // Adds a single item to the collection, optionally checking for uniqueness.
  // Returns the (unprocessed) added item.
  const addItem = action(getActionName('Add item'), (item, unique = 'id', replace = false, first = false) => {
    if(typeof item === 'undefined') return

    if ( _.isArrayLike(item) ) {
      return addItems(item, unique)
    }

    // Uniqueness check
    const existingIdx = unique === false ? -1 : getIndex(item, unique)
    if ( existingIdx > -1 && !replace ) return collection[ existingIdx ] // Bail if it exists in the collection

    const preparedItem = itemFactory(item) // Construct item

    // Get arguments for splice. We can't feed it existingIdx
    // blindly, as -1 would mean one from the end.
    const spliceIndex = existingIdx > -1 ? existingIdx : 0
    const spliceRemove = existingIdx > -1 ? 1 : 0

    if(existingIdx > -1 && replace) collection.splice(spliceIndex, spliceRemove, preparedItem)
    else {
      first ? collection.unshift(preparedItem) : collection.push(preparedItem)
    }

    return preparedItem
  })

  // Updates an item in the collection with new data.
  // Returns the added item.
  const updateItem = action(getActionName('Update item'), (item = false, idProp = 'id') => {
    if ( !item ) return false
    const existingIdx = getIndex(item, idProp)

    if ( existingIdx === -1 ) {
      return item // Bail if it doesn't exist
    }

    if( isObservable(collection[ existingIdx ]) ) {
      // Extend the new data onto the existing item.
      return extendObservable(collection[ existingIdx ], item)
    } else {
      // If this code runs, the item to add is probably a string or similar simple type.
      // Can't really use extend, so just replace it in the collection.
      const itemToAdd = itemFactory(item)
      collection.splice(existingIdx, 1, itemToAdd)

      return itemToAdd
    }
  })

  // Updates (if exists) or adds an item to the collection.
  // Returns the unprocessed added or updated item.
  const updateOrAdd = action(getActionName('Update or add'), (item, idProp = 'id', first = false) => {
    const existingIdx = getIndex(item, idProp)

    if ( existingIdx > -1 ) return updateItem(item, idProp)
    else return addItem(item, false, false, first)
  })

  // Removes an item from the collection
  const removeItem = action(getActionName('Remove item'), (itemOrIdOrIndex = false, idProp = 'id') => {
    if ( itemOrIdOrIndex === false ) return false // Bail early if falsy

    const type = typeof itemOrIdOrIndex
    let removeIdx = -1 // Start off carefully...

    switch ( type ) {
      case 'number': // Assume index if type is number
        removeIdx = itemOrIdOrIndex
        break
      case 'string': // Assume id if type is string
        removeIdx = collection.findIndex(el => equalCheck(el, prop, itemOrIdOrIndex))
        break
      default: // Assume object otherwise, and set idx to -1 if idProp is not a thing
        removeIdx = typeof itemOrIdOrIndex[ idProp ] !== 'undefined' ? getIndex(itemOrIdOrIndex, idProp) :
                    collection.indexOf(itemOrIdOrIndex)
    }

    // Only do anything if idx is sane. Return the removed item.
    if ( removeIdx > -1 ) return collection.splice(removeIdx, 1)[ 0 ]

    // We've acomplished nothing.
    return false
  })

  const clear = action(getActionName('Clear'), (filterFunction = false) => {
    if(!filterFunction) return collection.clear()

    collection.forEach((item, idx) => {
      if(filterFunction(item) === true) collection.splice(idx, 1)
    })

    return collection
  })

  return {
    $collection: {
      name, factory: itemFactory
    },
    setItems,
    getItem,
    getIndex,
    getByIndex,
    removeItem,
    addItem,
    addItems,
    updateItem,
    updateOrAdd,
    clear
  }
}
