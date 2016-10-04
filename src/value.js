import { action, extendObservable } from 'mobx'
import _ from 'lodash'

export default (state, property, initial = null) => {

  const setValue = action((value = initial) => state[property] = value )
  const extendValue = action((value = initial) => extendObservable(state[property], value))

  const methodSuffix = _.capitalize(property)

  // Because why not yeah
  return {
    [`set${methodSuffix}`]: setValue,
    [`extend${methodSuffix}`]: extendValue,
  }
}
