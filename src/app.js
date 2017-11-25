import pick from 'lodash/pick'

export default (...keys) => ({ actions, state }) => {
  // If no keys were specified, just return the action and state
  if ( keys.length === 0 ) return { ...actions, state }
  if( keys[0] === 'state' ) return { state }

  return {
    ...pick(actions, keys),
    state
  }
}
