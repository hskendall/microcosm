/**
 * Tree Performance Benchmark
 */

var Tree  = require('../../dist/index').Tree
var time  = require('microtime')
var SIZES = [
  1000,
  10000,
  50000,
  100000,
  200000,
  400000
]

console.log('\nConducting tree benchmark...\n')

var results = SIZES.map(function (SIZE) {
  /**
   * Force garbage collection. This is exposed by invoking
   * node with --expose-gc. This allows us to record heap usage
   * before and after the test to check for memory leakage
   */
  global.gc()

  var action = () => {}
  var stats  = { build: 0, root: 0, merge: 0, size: 0, prune: 0, memory: 0 }
  var tree   = new Tree()

  var memoryBefore = process.memoryUsage().heapUsed

  /**
   * Measure the average append time.
   */
  var now = time.now()
  for (var k = SIZE; k >= 0; k--) {
    tree.append(action)
  }
  stats.build = ((time.now() - now) / 1000) / SIZE

  /**
   * Measure the time it takes to bubble up to the root
   * of the tree from the current focal point.
   */
  now = time.now()
  tree.root
  stats.root = (time.now() - now) / 1000


  /**
   * Measure the time it takes to determine the size of
   * the current branch. This should loosely be in line with
   * ::root()
   */
  now = time.now()
  tree.size()
  stats.size = (time.now() - now) / 1000

  /**
   * Measure time to merge together all nodes. This is a useful
   * gut check of the potential fastest possible merger of objects
   * within Microcosm's dispatch process.
   */
  now = time.now()
  tree.reduce(function(a, b) {
    if (b.payload != null) {
      for (var key in b.payload) {
        a[key] = b.payload[key]
      }
    }

    return a
  }, {})
  stats.merge = (time.now() - now) / 1000


  /**
   * Measure time to dispose all nodes in the tree. This also has
   * the side effect of helping to test memory leakage later.
   */
  now = time.now()
  tree.prune(function() {
    return true
  })
  stats.prune = (time.now() - now) / 1000


  /**
   * Now that the tree has been pruned, force garbage collection
   * and record the increase in heap usage.
   */
  global.gc()

  var memoryAfter = process.memoryUsage().heapUsed
  stats.memory = ((memoryAfter - memoryBefore) / memoryBefore) * 100

  return {
    'Nodes': SIZE.toLocaleString(),
    '::append()': stats.build.toFixed(4) + 'ms',
    '::root()': stats.root.toFixed(4) + 'ms',
    '::reduce(merge)': stats.merge.toFixed(2) + 'ms',
    '::size()': stats.size.toFixed(2) + 'ms',
    '::prune()': stats.prune.toFixed(2) + 'ms',
    'Memory Growth': stats.memory.toFixed(3) + '%'
  }
})

/**
 * Finally, report our findings.
 */

require('console.table')

console.table(results)