import { observable } from 'mobx'
import _ from 'lodash'

export default (stores = {}, initialData = {}) => {
  const state = observable({})
  const actions = {}

  _.forOwn(stores, (store, key) => {
    const storeActions = store(state, initialData, key)
    actions[ key ] = storeActions
  })

  return { state, actions }
}
