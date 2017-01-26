import { extendObservable, observable } from 'mobx'
import collection from '../src/collection'
import _ from 'lodash'

const testData = [
  { id: "1", name: "first" },
  { id: "2", name: "second" },
  { id: "3", name: "third" },
]

describe('Collections - init', () => {

  it('can be assigned a factory function', () => {
    const testCollection = collection([], () => 'factory')
    expect(testCollection.$collection.factory()).toBe('factory')
  })

  it('will use lodash identity as factory by default', () => {
    const testCollection = collection([])
    expect(testCollection.$collection.factory).toBe(_.identity)
  })

  it('can be assigned a name in the same argument place as factories', () => {
    const testCollection = collection([], 'TestCollection')

    expect(testCollection.$collection.factory).toBe(_.identity)
    expect(testCollection.$collection.name).toBe('TestCollection')
  })

  it('is named `Collection` by default', () => {
    const testCollection = collection([])

    expect(testCollection.$collection.factory).toBe(_.identity)
    expect(testCollection.$collection.name).toBe('Collection')
  })
})

describe('Collections - setItems', () => {
  let testCollection, collectionActions

  beforeEach(() => {
    testCollection = observable(testData)
    collectionActions = collection(testCollection)
  })

  it('replaces collection with new items', () => {
    const newData = [{ id: "4", name: "fourth" }]
    collectionActions.setItems(newData)

    expect(testCollection.length).toBe(1)
    expect(testCollection[0].name).toBe('fourth')
  })

  it('can replace with other types than array', () => {
    collectionActions.setItems({ id: "4", name: "fourth" })

    expect(testCollection.length).toBe(1)
    expect(testCollection[0].name).toBe('fourth')

    collectionActions.setItems('newItem')
    expect(testCollection[0]).toBe('newItem')

    collectionActions.setItems(_.identity)
    expect(testCollection[0]('haha')).toBe('haha')

    expect(testCollection.length).toBe(1) // yup still 1 length
  })
})

describe('Collections - addItems', () => {
  let testCollection, collectionActions

  beforeEach(() => {
    testCollection = observable([])
    collectionActions = collection(testCollection)
  })

  it(`doesn't freak out from an empty array`, () => {
    const addedItems = collectionActions.addItems([])

    expect(testCollection.length).toBe(0)
    expect(addedItems.length).toBe(0)
  })

  it(`adds the passed items to the collection`, () => {
    const addedItems = collectionActions.addItems(testData)

    expect(testCollection.length).toBe(addedItems.length)
    expect(testCollection[0].id).toBe("1")
    expect(testCollection[1].id).toBe("2")
    expect(testCollection[2].id).toBe("3")
  })

  it(`adds a single item to the collection`, () => {
    const addedItems = collectionActions.addItems(testData[0])

    expect(testCollection.length).toBe(1)
    expect(Array.isArray(addedItems)).toBeTruthy()
    expect(testCollection[0].id).toBe("1")
  })

  it(`adds only unique items`, () => {
    collectionActions.setItems(testData)
    const addedItems = collectionActions.addItems(testData)

    expect(addedItems.length).toBe(0)
    expect(testCollection.length).toBe(3)
  })
})

describe(`Collections - addItem`, () => {
  let testCollection, collectionActions

  beforeEach(() => {
    testCollection = observable([])
    collectionActions = collection(testCollection)
  })

  it(`Doesn't add nonexistent things`, () => {
    const added = collectionActions.addItem()
    expect(typeof added).toBe('undefined')
    expect(testCollection.length).toBe(0)
  })

  it(`adds a single item to the collection and returns what it added`, () => {
    expect(testCollection.length).toBe(0)
    const added = collectionActions.addItem(testData[0])

    expect(added.id).toBe("1")
    expect(testCollection.length).toBe(1)
  })

  it(`uses the value from itemFactory(item) when adding to the collection`, () => {
    collectionActions = collection(testCollection, (item) => 'derp') // Always add derp
    const added = collectionActions.addItem(testData[0])

    expect(added).toBe("derp")
    expect(testCollection.length).toBe(1)
    expect(testCollection[0]).toBe("derp")
  })
})
