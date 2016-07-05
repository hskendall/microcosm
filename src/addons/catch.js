/**
 * Catch is a test helper for use with forms.
 */

import React from 'react'

export default React.createClass({

  getChildContext() {
    return { send : this.props.send }
  },

  childContextTypes: {
    send : React.PropTypes.func.isRequired
  },

  render() {
    return this.props.children
  }

})