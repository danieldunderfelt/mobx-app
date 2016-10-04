import _ from 'lodash'
import { action, extendObservable } from 'mobx'

export default (collection, itemFactory = _.identity) => {

  // Replaces current items with new items
  const setItems = action((items = []) => collection.replace(items.map(itemFactory)))

  // Gets an item from the collection
  const getItem = (identifier, key = 'id') => {
    const id = _.get(identifier, key, identifier)
    const item = collection.find(item => item[ key ] === identifier)

    return typeof item !== 'undefined' ? item : null
  }

  // Gets the index of an item in the collection
  const getIndex = (item, key = 'id') => {
    const id = _.get(item, key, item)
    return collection.findIndex(el => el[ key ] === id)
  }

  // Adds items to the collection
  const addItems = action((items = [], unique = 'id', processAll = _.identity) => {
    if( items.length === 0 ) return collection // Bail early if no items

    const itemsArray = _.flatten([ items ]) // Put in one-element array if only passed single item

    // Get items not already in the collection by unique key (assumes array items are objects)
    const itemsToAdd = unique === false ? itemsArray : _.differenceBy(itemsArray, collection.slice(), unique)

    // If all "new" items already exist, bail.
    if( itemsToAdd.length === 0 ) return collection

    // Concatenate the new items, processed through itemFactory, to the existing collection.
    const allItems = collection.concat(itemsToAdd.map(itemFactory))

    // Run items through an optional processor (a good opporunity to apply ordering)
    // and replace the current collection with the new one.
    return collection.replace(processAll(allItems))
  })

  // Adds a single item to the collection, optionally checking for uniqueness
  const addItem = action((item, unique = 'id', replace = false, first = false) => {
    // Uniqueness check
    const existingIdx = unique === false ? -1 : getIndex(item, unique)
    if( existingIdx > -1 && !replace ) return collection[ existingIdx ] // Bail if it exists in the collection

    const preparedItem = itemFactory(item) // Construct item

    // Get arguments for splice. We can't feed it existingIdx
    // blindly, as -1 would mean one from the end.
    const spliceIndex = existingIdx > -1 ? existingIdx : 0
    const spliceRemove = existingIdx > -1 ? 1 : 0

    // Use splice to put the item first, push otherwise
    first ? collection.splice(spliceIndex, spliceRemove, preparedItem) : collection.push(preparedItem)
    return preparedItem
  })

  // Updates an item in the colelction with new data
  const updateItem = action((item = false, idProp = 'id') => {
    if(!item) return false
    const existingIdx = getIndex(item, idProp)

    if( existingIdx === -1 ) {
      console.warn(`Item to update did not exist in the collection. Use addItem instead.`)
      return item // Bail if it doesn't exist
    }

    // Extend the new data onto the existing item.
    return extendObservable(collection[ idx ], item)
  })

  // Updates (if exists) or adds an item to the collection
  const updateOrAdd = action((item, idProp = 'id', first = false) => {
    const existingIdx = getIndex(item, idProp)

    if( existingIdx > -1 ) return updateItem(item, idProp)
    else return addItem(item, false, false, first)
  })

  // Removes an item from the collection
  const removeItem = action((itemOrIdOrIndex = false, idProp = 'id') => {
    if( !itemOrIdOrIndex ) return false // Bail early if falsy

    const type = typeof itemOrIdOrIndex
    let removeIdx = -1 // Start off carefully...

    switch( type ) {
      case 'number': // Assume index if type is number
        removeIdx = itemOrIdOrIndex
        break
      case 'string': // Assume id if type is string
        removeIdx = collection.findIndex(el => el[ idProp ] === itemOrIdOrIndex)
        break
      default: // Assume object otherwise, and set idx to -1 if idProp is not a thing
        removeIdx = typeof itemOrIdOrIndex[ idProp ] !== 'undefined' ? getIndex(itemOrIdOrIndex, idProp) :
          collection.indexOf(itemOrIdOrIndex)
    }

    console.log('Removing item index ', removeIdx, itemOrIdOrIndex)

    // Only do anything if idx is sane. Return the removed item.
    if( removeIdx > -1 ) return collection.splice(removeIdx, 1)[ 0 ]

    // We've acomplished nothing.
    return false
  })

  const clearAll = action(() => collection.clear())

  return {
    setItems,
    getItem,
    getIndex,
    removeItem,
    addItem,
    addItems,
    updateItem,
    updateOrAdd,
    clearAll
  }
}
