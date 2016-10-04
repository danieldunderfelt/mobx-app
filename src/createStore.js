import { observable, extendObservable, asReference } from 'mobx'
import _ from 'lodash'

export default (stores = {}, initialData = {}) => {
  const state = observable({})
  const actions = {}

  _.forOwn(stores, (store, key) => {
    const storeActions = store(state, initialData, actions)
    actions[ key ] = storeActions
  })

  return { state, actions }
}
