import { Microcosm, Subject, scheduler } from 'microcosm'
import { asTree } from '../../helpers'

describe('History::remove', function() {
  it('retains the last node', function() {
    let repo = new Microcosm({ debug: true })

    let action = repo.push('action')

    expect(repo.history.size).toBe(1)

    repo.history.remove(action)

    expect(repo.history.size).toEqual(1)
  })

  it('does not remove the root when given a node outside the tree', function() {
    let repo = new Microcosm({ debug: true })

    repo.push('test')

    repo.history.remove(new Subject())

    expect(repo.history.size).toEqual(1)
  })

  describe('reconciliation', function() {
    it('does not call reconciliation when removing a disabled child', async () => {
      let repo = new Microcosm({ debug: true })

      await repo.push('one')

      let action = repo.push('two')
      let handler = jest.fn()

      repo.history.subscribe(handler)

      await scheduler()

      // Initial subscription fires to provide the current action
      expect(handler).toHaveBeenCalledTimes(1)

      repo.history.toggle(action)

      await scheduler()

      // Fires to reconcile the disabled action
      expect(handler).toHaveBeenCalledTimes(2)

      repo.history.remove(action)

      await scheduler()

      // Disabled actions do not reconcile
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('removing the head', function() {
    it('adjusts the head to the prior node', function() {
      let repo = new Microcosm({ debug: true })
      let one = repo.push('one')
      let two = repo.push('two')

      repo.history.remove(two)

      expect(repo.history.head).toBe(one)
    })

    it('removes the node from the active branch', function() {
      let repo = new Microcosm({ debug: true })

      repo.push('one')
      repo.push('two')
      let three = repo.push('three')

      repo.history.remove(three)

      expect(`${Array.from(repo.history)}`).toEqual('one,two')
    })

    it('removing the head node eliminates the reference to "next"', function() {
      let repo = new Microcosm({ debug: true })

      let one = repo.push('one')
      let two = repo.push('two')
      let three = repo.push('three')

      repo.history.remove(three)

      expect(repo.history.after(one)).toBe(two)
      expect(repo.history.after(two)).toBe(null)
      expect(repo.history.after(three)).toBe(null)
    })
  })

  describe('removing the root', function() {
    it('adjusts the root to the next node', function() {
      let repo = new Microcosm({ debug: true })

      repo.push('one')
      repo.push('two')
      repo.push('three')

      let root = repo.history.root
      let next = repo.history.after(root)

      repo.history.remove(root)

      expect(repo.history.root).toBe(next)
    })

    it('updates the active branch', function() {
      let repo = new Microcosm({ debug: true })
      let history = repo.history

      repo.push('one')
      repo.push('two')
      repo.push('three')

      history.remove(history.root)

      expect(Array.from(history).toString()).toEqual('two,three')
    })
  })

  describe('removing an intermediary node', function() {
    it('joins the parent and child', function() {
      let repo = new Microcosm({ debug: true })

      repo.push('one')
      let two = repo.push('two')
      repo.push('three')

      repo.history.remove(two)

      expect(Array.from(repo.history).toString()).toEqual('one,three')
    })

    it('will not "jump" to the nearest action if the head is removed', function() {
      let repo = new Microcosm({ debug: true })

      repo.push('one')
      let two = repo.push('two')
      repo.push('three')

      repo.history.checkout(two)
      repo.history.remove(two)

      expect(Array.from(repo.history).toString()).toEqual('one')
    })

    it('reconciles at the next action', async () => {
      let repo = new Microcosm({ debug: true })
      let next = jest.fn()

      repo.push('one')
      let two = repo.push('two')
      let three = repo.push('three')

      repo.history.subscribe(next)
      repo.history.remove(two)

      await scheduler()

      expect(next).toHaveBeenCalledWith(three)
    })

    it('reconciles at the parent if the action is head of an active branch', async () => {
      let repo = new Microcosm({ debug: true })
      let next = jest.fn()

      await repo.push('one')

      let two = repo.push('two')
      let three = repo.push('three')

      repo.history.checkout(two)
      repo.history.subscribe(next)
      repo.history.remove(two)

      await scheduler()

      expect(next).toHaveBeenCalledWith(three)
    })

    it('does not reconcile if the action is not in active branch', async () => {
      let repo = new Microcosm({ debug: true })
      let next = jest.fn()

      await repo.push('one')

      let two = repo.push('two')
      let three = repo.push('three')

      repo.history.checkout(two)
      repo.history.subscribe(next)

      await scheduler()

      // Initial subscription
      expect(next).toHaveBeenCalledTimes(1)

      repo.history.remove(three)

      await scheduler()

      // Removing outside of the active branch does not reconcile
      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  describe('removing an unfocused branch terminator', function() {
    it('leaves the head reference alone', async () => {
      let repo = new Microcosm({ debug: true })
      let one = repo.push('one')
      let two = repo.push('two')

      repo.history.checkout(one)

      await repo.push('three')

      // History tree now looks like this:
      //                |- [two]
      // [root] - [one] +
      //                |- [*three]

      expect(Array.from(repo.history).toString()).toBe('one,three')
      repo.history.remove(two)
      expect(Array.from(repo.history).toString()).toBe('one,three')
    })
  })

  describe('children', function() {
    it('eliminates references to removed on the left', function() {
      let repo = new Microcosm({ debug: true })
      let history = repo.history

      let one = repo.push('one')
      let two = repo.push('two')

      repo.history.checkout(one)

      repo.push('three')

      history.remove(two)

      expect(asTree(history)).toMatchSnapshot()
    })

    it('maintains children on the left when the next action is removed', function() {
      let repo = new Microcosm({ debug: true })
      let history = repo.history

      let one = repo.push('one')
      repo.push('two')

      repo.history.checkout(one)

      let three = repo.push('three')

      history.remove(three)

      expect(asTree(history)).toMatchSnapshot()
    })

    it('allows having children, but no next value', function() {
      let repo = new Microcosm({ debug: true })
      let one = repo.push('one')
      repo.push('two')

      repo.history.checkout(one)

      let three = repo.push('three')

      repo.history.remove(three)

      expect(asTree(repo.history)).toMatchSnapshot()
    })
  })
})
