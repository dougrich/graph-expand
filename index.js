/**
 * Replaces a node in a graph with a subgraph
 * @param {Graph} graph original graph
 * @param {number} index node to replace
 * @param {Graph} subGraph subgraph to insert at index
 * @returns {Graph} the graph with the subgraph inserted at index
 */
function replace(graph, index, subGraph) {
  graph = this.fork(graph)
  const base = graph.nodes.length
  const { nodes, connections } = this.clone(subGraph)
  graph.nodes = this.append(graph.nodes, nodes)
  graph.connections = this.append(graph.connections, connections.map(({
    start,
    end,
    ...rest
  }) => ({
    start: start + base,
    end: end + base,
    ...rest
  })))
  graph.nodes[index] = {
    type: 'replaced',
    start: subGraph.start + base,
    end: subGraph.end + base
  }
  return graph
}

/**
 * Resolves the final index for a node, following replaced nodes
 * @param {Graph} graph that contains all nodes
 * @param {number} index of node to resolve
 * @param {'end'|'start'} type of connection to be expanding
 * @returns {number} index of the final node
 */
function resolve(graph, index, type) {
  while (graph.nodes[index].type === 'replaced') {
    index = graph.nodes[index][type]
  }
  return index
}

/**
 * Resolves the final index for a node, following replaced nodes
 * @param {Graph} graph that contains all nodes
 * @param {number} index of node to resolve
 * @param {'end'|'start'} type of connection to be expanding
 * @returns {number} index of the final node
 */
function resolve(graph, index, type) {
  while (graph.nodes[index].type === 'replaced') {
    index = graph.nodes[index][type]
  }
  return index
}

/**
 * Flattens a graph, removing 'replaced' nodes and re-connecting
 * @param {Graph} graph original graph
 * @returns {Graph} the graph flattened
 */
function flatten(graph) {
  const nodes = []

  const next = [graph.start]

  const remapped = {}

  const conns = graph.connections.map(({ start, end, ...rest }) => ({
    start: resolve(graph, start, 'end'),
    end: resolve(graph, end, 'start'),
    ...rest
  }))

  while (next.length > 0) {
    const nextIndex = next.pop()

    // this means we've visited this node before - no need to remap
    if (remapped[nextIndex] != null) continue
    const resolvedIndex = resolve(graph, nextIndex, 'start')
     

    // update the mapping with the node's new home
    remapped[nextIndex] = nodes.length
    remapped[resolvedIndex] = nodes.length
    nodes.push(graph.nodes[resolvedIndex])

    // follow any connections this node had
    for (let i = 0; i < conns.length; i++) {
      const c = conns[i]
      if (c.start === resolvedIndex && remapped[c.end] == null) {
        next.push(c.end)
      } else if (c.end === resolvedIndex && remapped[c.start] == null) {
        next.push(c.start)
      }
    }
  }
  const connections = conns
    // filter out any connections that do not have relevance
    .filter(({ start, end }) => {
      return remapped[start] != null && remapped[end] != null
    })
    // return the remapped version of the connection, preserving metadata
    .map(({ start, end, ...rest }) => {
      return {
        start: remapped[start],
        end: remapped[end],
        ...rest
      }
    })

  return {
    nodes,
    connections,
    start: remapped[graph.start],
    end: remapped[graph.end]
  }
}

/**
 * Clones an object
 * @param {any} obj original
 * @returns {any} clone of the original with no links
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function GraphContext({ fork, append, clone }) {
  const that = {}
  that.fork = fork
  that.clone = clone
  that.append = append
  that.flatten = flatten.bind(that)
  that.replace = replace.bind(that)
  return that
}

GraphContext.Immutable = {
  fork: clone,
  append: (arr, e) => [...arr, ...e],
  clone: clone
}

GraphContext.Mutable = {
  fork: a => { return a },
  append: (arr, e) => {
    arr.push(...e)
    return arr
  },
  clone: clone
}

GraphContext.flatten = flatten.bind(GraphContext.Immutable)
GraphContext.replace = replace.bind(GraphContext.Immutable)

module.exports = GraphContext