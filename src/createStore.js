import { observable } from 'mobx'
import forOwn from 'lodash/forOwn'
import mux from '@expo/mux'

export default (stores = {}, initialData = {}) => {
  const state = observable({})
  const actions = {}
  let hasPromises = false

  forOwn(stores, (store, key) => {
    const storeActions = store(state, initialData, key)
    
    if(storeActions && typeof storeActions.then === 'function') {
      hasPromises = true
    }
    
    actions[ key ] = storeActions
  })
  
  if(hasPromises) {
    return mux(actions)
      .then(resolvedActions => ({ state, actions: resolvedActions }))
  }

  return { state, actions }
}
