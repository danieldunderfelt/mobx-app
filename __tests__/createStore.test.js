import createStore from '../src/createStore'
import { isObservableObject, extendObservable, toJS } from 'mobx'

describe('createStore', () => {
  
  it('Creates an object containing actions and state', () => {
    const { state, actions } = createStore({ test: () => 'testValue' })
    
    expect(actions.test).toBe('testValue')
    expect(isObservableObject(state)).toBe(true)
  })
  
  it('Calls all store factories', () => {
    const testStore1 = jest.fn()
    const testStore2 = jest.fn()
    
    testStore1.mockReturnValueOnce('testValue1')
    testStore2.mockReturnValueOnce('testValue2')
    
    const { actions } = createStore({
      test1: testStore1,
      test2: testStore2
    })
    
    expect(testStore1).toHaveBeenCalledTimes(1)
    expect(testStore2).toHaveBeenCalledTimes(1)
    expect(actions.test1).toBe('testValue1')
    expect(actions.test2).toBe('testValue2')
  })
  
  it('Calls the store factory with the complete state', () => {
    const testStore1 = jest.fn(state => {
      expect(isObservableObject(state)).toBe(true)
      expect(Object.keys(toJS(state)).length).toBe(0)
      
      extendObservable(state, {
        testProp1: 'testValue1'
      })
    })
  
    const testStore2 = jest.fn(state => {
      expect(isObservableObject(state)).toBe(true)
      expect(state.testProp1).toBe('testValue1')
      
      extendObservable(state, {
        testProp2: 'testValue2'
      })
    })
    
    const { state } = createStore({
      test1: testStore1,
      test2: testStore2
    })
    
    expect(state.testProp2).toBe('testValue2')
    
    // Sanity check
    expect(testStore1).toHaveBeenCalledTimes(1)
    expect(testStore2).toHaveBeenCalledTimes(1)
  })
  
  it('Resolves promises returned from store factories', async () => {
    const testStore1 = jest.fn(async () => 'testValue' ) // returns a promise
    const testStore2 = jest.fn(() => 'testValue2' ) // does not return a promise :)
    
    const { actions } = await createStore({
      test1: testStore1,
      test2: testStore2
    })
    
    expect(actions.test1).toBe('testValue')
    expect(actions.test2).toBe('testValue2')
  })
})