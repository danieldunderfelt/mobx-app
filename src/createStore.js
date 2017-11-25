import { observable } from 'mobx'
import forOwn from 'lodash/forOwn'

export default (stores = {}, initialData = {}) => {
  const state = observable({})
  const actions = {}

  forOwn(stores, (store, key) => {
    const storeActions = store(state, initialData, key)
    actions[ key ] = storeActions
  })

  return { state, actions }
}
