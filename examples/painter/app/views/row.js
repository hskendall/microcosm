import React from 'react'
import withIntent from 'microcosm/addons/with-intent'

import {
  paint
} from '../actions/pixels'

function Cell ({ x, y, active, onClick }) {
  const color = active ? 'green' : 'white'

  return (
    <rect x={x} y={y} onClick={onClick} fill={color} width="1" height="1"/>
  )
}

export default withIntent(function Row ({ cells, y, send }) {
  return (
    <g key={y}>
      { cells.map((active, x) => <Cell key={x} x={x} y={y} active={active} onClick={() => send(paint, {x, y})} />)}
    </g>
  )
})
