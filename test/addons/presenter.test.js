import React from 'react'
import Microcosm from '../../src/microcosm'
import Presenter from '../../src/addons/presenter'
import {mount} from 'enzyme'

const View = React.createClass({
  contextTypes: {
    send: React.PropTypes.func.isRequired
  },
  render() {
    return <button id="button" onClick={() => this.context.send('test', true)} />
  }
})

test('the default render implementation passes children', function () {
  let wrapper = mount(<Presenter><p>Test</p></Presenter>)

  expect(wrapper.text()).toEqual('Test')
})

test('allows extending render', function () {
  class Test extends Presenter {
    render() {
      return <p>Test</p>
    }
  }

  let wrapper = mount(<Test />)

  expect(wrapper.text()).toEqual('Test')
})

test('preserves context if render is extended', function () {
  class Parent extends Presenter {
    setup (repo) {
      repo.addDomain('test', {
        getInitialState() {
          return true
        }
      })
    }
    render() {
      return <div>{this.props.children}</div>
    }
  }

  class Child extends Presenter {
    setup(repo) {
      this.test = repo.state.test
    }
    render() {
      return <div>{this.test.toString()}</div>
    }
  }

  let wrapper = mount(<Parent><Child /></Parent>)

  expect(wrapper.text()).toEqual('true')
})

test('receives intent events', function () {
  const test = jest.fn()

  class MyPresenter extends Presenter {
    register() {
      return { test }
    }

    view() {
      return <View />
    }
  }

  mount(<MyPresenter repo={ new Microcosm() } />).find(View).simulate('click')

  expect(test.mock.calls[0][1]).toEqual(true)
})

test('forwards intents to the repo as actions', function () {
  class MyPresenter extends Presenter {
    view() {
      return <View />
    }
  }

  const repo = new Microcosm({ maxHistory: 1 })

  mount(<MyPresenter repo={repo} />).find(View).simulate('click')

  expect(repo.history.head.type).toEqual('test')
})

test('builds the view model into state', function () {
  class MyPresenter extends Presenter {
    viewModel() {
      return {
        color: state => state.color
      }
    }
    view({ color }) {
      return <div>{color}</div>
    }
  }

  const repo = new Microcosm()
  const presenter = mount(<MyPresenter repo={repo} />)

  repo.patch({ color: 'red' })

  const text = presenter.text()

  expect(text).toEqual('red')
})

test('handles non-function view model bindings', function () {
  class MyPresenter extends Presenter {
    viewModel({ name }) {
      return {
        upper: name.toUpperCase()
      }
    }
    view({ upper }) {
      return <p>{upper}</p>
    }
  }

  var presenter = mount(<MyPresenter name="phil" repo={new Microcosm()} />)

  expect(presenter.text()).toEqual('PHIL')
})

test('send bubbles up to parent presenters', function () {
  const test = jest.fn()

  class Child extends Presenter {
    view() {
      return <View />
    }
  }

  class Parent extends Presenter {
    register() {
      return { test: (repo, props) => test(props) }
    }
    view () {
      return <Child />
    }
  }

  mount(<Parent repo={ new Microcosm() } />).find(View).simulate('click')

  expect(test).toHaveBeenCalledWith(true)
})

test('runs a setup function when created', function () {
  const test = jest.fn()

  class MyPresenter extends Presenter {
    get setup () {
      return test
    }

    view () {
      return <View />
    }
  }

  mount(<MyPresenter repo={ new Microcosm() } />)

  expect(test).toHaveBeenCalled()
})

test('runs an update function when it gets new props', function () {
  const test = jest.fn()

  class MyPresenter extends Presenter {
    update (repo, props) {
      test(props.test)
    }
    view () {
      return <View />
    }
  }

  let wrapper = mount(<MyPresenter repo={ new Microcosm() } test="foo" />)

  wrapper.setProps({ test: "bar" })

  expect(test).toHaveBeenCalledWith('bar')
})

test('does not run an update function when it is pure and no props change', function () {
  class MyPresenter extends Presenter {
    update(repo, props) {
      throw new Error('Presenter update method should not have been called')
    }

    view() {
      return <View />
    }
  }

  let wrapper = mount(<MyPresenter repo={ new Microcosm() } test="foo" />)

  wrapper.setProps({ test: "foo" })
})

test('always runs update when impure', function () {
  const spy = jest.fn()

  class MyPresenter extends Presenter {
    get update() {
      return spy
    }

    view() {
      return <View />
    }
  }

  let wrapper = mount(<MyPresenter repo={ new Microcosm() } test="foo" pure={false} />)

  wrapper.setProps({ test: "foo" })

  expect(spy).toHaveBeenCalled()
})

test('inherits purity from repo', function () {
  const spy = jest.fn()

  class MyPresenter extends Presenter {
    get update() {
      return spy
    }
    view() {
      return <View />
    }
  }

  let wrapper = mount(<MyPresenter repo={ new Microcosm({ pure: false }) } test="foo" />)

  wrapper.setProps({ test: "foo" })

  expect(spy).toHaveBeenCalled()
})

test('ignores an repo when it unmounts', function () {
  const spy = jest.fn()

  class Test extends Presenter {
    setup (repo) {
      repo.teardown = spy
    }
  }

  mount(<Test />).unmount()

  expect(spy).toHaveBeenCalled()
})

test('does not update the view model when umounted', function () {
  const spy = jest.fn(n => {})

  class MyPresenter extends Presenter {
    // This should only run once
    get viewModel() {
      return spy
    }
  }

  let repo = new Microcosm({ pure: false })
  let wrapper = mount(<MyPresenter repo={repo} />)

  wrapper.unmount()

  repo.patch({ foo: 'bar' })

  expect(spy.mock.calls.length).toEqual(1)
})

test('calling setState in setup does not raise a warning', function () {
  class MyPresenter extends Presenter {
    setup() {
      this.setState({ foo: 'bar' })
    }
  }

  mount(<MyPresenter repo={ new Microcosm() } />)
})

test('allows functions to return from viewModel', function () {
  class MyPresenter extends Presenter {
    viewModel() {
      return state => state
    }

    view ({ color }) {
      return <p>{color}</p>
    }
  }

  const repo = new Microcosm()
  const el = mount(<MyPresenter repo={repo} />)

  repo.patch({ color: 'red' })

  expect(el.text()).toEqual('red')
})

test('does not cause a re-render when shallowly equal and pure', function () {
  const repo = new Microcosm({ pure: true })
  const renders = jest.fn(() => <p>Test</p>)

  repo.patch({ name: 'Kurtz' })

  class Namer extends Presenter {
    model() {
      return { name: state => state.name }
    }

    get view () {
      return renders
    }
  }

  mount(<Namer repo={ repo } />)

  repo.patch({ name: 'Kurtz', unrelated: true })

  expect(renders.mock.calls.length).toEqual(1)
})

test('always re-renders impure repos', function () {
  const repo = new Microcosm({ pure: false })
  const renders = jest.fn(() => <p>Test</p>)

  repo.patch({ name: 'Kurtz' })

  class Namer extends Presenter {
    model() {
      return { name: state => state.name }
    }

    get view () {
      return renders
    }
  }

  mount(<Namer repo={ repo } />)

  repo.patch({ name: 'Kurtz', unrelated: true })

  expect(renders.mock.calls.length).toEqual(2)
})

test('recalculates the view model if the props are different', function () {
  const repo = new Microcosm()

  repo.patch({ name: 'Kurtz' })

  class Namer extends Presenter {
    model (props) {
      return {
        name: state => props.prefix + ' ' + state.name
      }
    }
    view ({ name }) {
      return (<p>{ name }</p>)
    }
  }

  const wrapper = mount(<Namer prefix="Colonel" repo={repo} />)

  wrapper.setProps({ prefix: 'Captain' })

  expect(wrapper.text()).toEqual('Captain Kurtz')
})

test('does not recalculate the view model if the props are the same', function () {
  const repo = new Microcosm()
  const spy = jest.fn()

  class Namer extends Presenter {
    get viewModel () {
      return spy
    }
  }

  const wrapper = mount(<Namer prefix="Colonel" repo={repo} />)

  wrapper.setProps({ prefix: 'Colonel' })

  expect(spy.mock.calls.length).toEqual(1)
})

test('does not waste rendering on nested children', function () {
  const repo = new Microcosm()
  const spy = jest.fn(function({ name }) {
    return <p>{ name }</p>
  })

  class Child extends Presenter {
    viewModel () {
      return { name: state => state.name }
    }

    get view () {
      return spy
    }
  }

  class Parent extends Presenter {
    viewModel () {
      return { name: state => state.name }
    }
    view () {
      return <Child />
    }
  }

  mount(<Parent repo={ repo } />)

  repo.patch({ name: 'Billy Booster' })

  expect(spy.mock.calls.length).toEqual(2)
})

test('model is an alias for viewModel', function () {
  class Hello extends Presenter {
    model ({ place }) {
      return {
        greeting: "Hello, " + place + "!"
      }
    }

    view ({ greeting }) {
      return <p>{ greeting }</p>
    }
  }

  let wrapper = mount(<Hello place="world" />)

  expect(wrapper.text()).toEqual('Hello, world!')
})

test('teardown gets the last props', function () {
  const spy = jest.fn()

  class Test extends Presenter {
    get teardown () {
      return spy
    }
  }

  const wrapper = mount(<Test test="foo" />)

  wrapper.setProps({ test: 'bar' })

  wrapper.unmount()

  expect(spy.mock.calls[0][1].test).toEqual('bar')
})

test('intents are tagged', function () {
  const spy = jest.fn()

  const a = function a () {}
  const b = function a () {}

  const TestView = React.createClass({
    contextTypes: {
      send: React.PropTypes.func.isRequired
    },
    render() {
      return <button id="button" onClick={() => this.context.send(b, true)} />
    }
  })

  class Test extends Presenter {
    register() {
      return { [a]: spy }
    }
    view() {
      return <TestView />
    }
  }

  mount(<Test />).find(TestView).simulate('click')

  expect(spy).not.toHaveBeenCalled()
})
