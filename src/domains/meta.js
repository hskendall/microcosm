/**
 * Meta Domain
 * A domain for managing lifecycle methods and other default behavior
 * for other domains.
 */

import lifecycle from '../lifecycle'
import merge from '../merge'

export default {

  [lifecycle._willReset](_old, next) {
    return next
  },

  [lifecycle._willReplace](old, next) {
    return merge({}, old, next)
  }

}
