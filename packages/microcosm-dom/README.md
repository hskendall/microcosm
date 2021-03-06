# microcosm-dom

[Microcosm](https://github.com/vigetlabs/microcosm) bindings for:

- [React](https://github.com/facebook/react)
- [Preact](https://preactjs.com/).

```text
status: unpublished
```

## Stats

```text
1.84 kB: microcosm-dom/react
1.92 kB: microcosm-dom/preact
```

## Requirements

This package replaces `microcosm/addons'`. This was done in Microcosm 13.0.0. For older versions of Microcosm, use this namespace (and do not use this package).

## Usage/Documentation

```javascript
import { Presenter, ActionForm, ActionButton, withSend } from 'microcosm-dom'

// Uses react by default, also consider:
import { Presenter, ActionForm, ActionButton, withSend } from 'microcosm-dom/react'
import { Presenter, ActionForm, ActionButton, withSend } from 'microcosm-dom/preact'
```

[Beyond that, checkout the docs!](http://code.viget.com/microcosm/api/#addons).
