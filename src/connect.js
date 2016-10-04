import { inject, observer } from 'mobx-react/native'
import _ from 'lodash'

export default (...keys) => inject(({ actions, state }) => {
  // If no keys were specified, just return the action and state
  if ( keys.length === 0 ) return { ...actions, state }
  if( keys[0] === 'state' ) return { state }

  return {
    ..._.pick(actions, keys),
    state
  }
})
