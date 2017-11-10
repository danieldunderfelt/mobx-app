import { action, extendObservable } from 'mobx'
import upperFirst from 'lodash/upperFirst'

export default (state, property, initial = null) => {

  const setValue = action(`Value ${property} - Set value`, (value = initial) => state[property] = value )
  const extendValue = action(`Value ${property} - Extend value`, (value = initial) => extendObservable(state[property], value))

  const methodSuffix = upperFirst(property)

  // Because why not yeah
  return {
    [`set${methodSuffix}`]: setValue,
    [`extend${methodSuffix}`]: extendValue,
  }
}
