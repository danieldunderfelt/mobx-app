import { extendObservable, observable } from 'mobx'
import collection from '../src/collection'
import _ from 'lodash'

const testData = [
  { id: "1", name: "first" },
  { id: "2", name: "second" },
  { id: "3", name: "third" },
]

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
