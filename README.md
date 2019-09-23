# @dougrich/graph-expand

<a href="https://www.npmjs.com/package/@dougrich/graph-expand" alt="NPM"><img src="https://img.shields.io/npm/v/@dougrich/graph-expand" /></a>

<a href="https://github.com/dougrich/graph-expand" alt="Github"><img src="https://img.shields.io/github/last-commit/dougrich/graph-expand" /></a>

This small library contains two functions: `replace`, which replaces a node in a graph with a subnetwork of nodes; and `flatten`, which takes a graph of replaced nodes and flattens it.

## `Graph`

Graph json objects look like this:

```json
{
  "nodes": [
    "start",
    "mid",
    "end"
  ],
  "connections": [
    {
      "start": 0,
      "end": 1,
      ...
    },
    {
      "start": 1,
      "end": 2,
      ...
    }
  ],
  "start": 0,
  "end": 1
}
```

`nodes` is a list of each node. The type of each node does not matter, so if you have structured node data throw that in there.

`connections` is a list of each connection. These must be objects containing at least `start` and `end` attributes - any other attributes are preserved. Both `start` and `end` should be indicies in the list of nodes

`start` is the index of the `start` node

`end` is the index of the `end` node

Any additional properties will be copied over

## `replace`

The `replace` function is intended to be run multiple times on a graph.

```js
/**
 * Replaces a node in a graph with a subgraph
 * @param {Graph} graph original graph
 * @param {number} index node to replace
 * @param {Graph} subGraph subgraph to insert at index
 * @returns {Graph} the graph with the subgraph inserted at index
 */
function replace(graph, index, subGraph) {
}
```

This will replace a node at the `index` with the `subGraph`. This is not a full replacement, but replaces the node at `index` with a known pointer structure and appends the `subGraph` to the `nodes` and `connections` of the top graph. Additionally, the `start` of the `subGraph` is where all connections that `end` in `index` should point. The `end` of the `subGraph` is where all connections that `start` at `index` should point.

This makes more sense with a practical example, suppose we have the following graph and sub graph:

```js
const graph = {
  nodes: [
    "A",
    "B",
    "C"
  ],
  connections: [
    { start: 0, end: 1 },
    { start: 0, end: 2 }
  ]
  start: 0,
  end: 2
}

const subGraph = {
  nodes: [
    "BA",
    "BB",
    "BC"
  ],
  connections: [
    { start: 0, end: 1 },
    { start: 0, end: 2 }
  ]
  start: 0,
  end: 2
}

replace(graph, 1, subGraph)
```

Okay, so let's reason this out. `SubGraph` starts at `BA` and ends at `BC`: so `A` should no longer point to `B`, but to `BA` and instead of `B` pointing to `C` we should have `BC` pointing to `C`. Ideally we have:

```
A -> BA -> BB -> BC -> C
```

We actually get the following JSON:

```json
{
  "nodes": [
    "A",
    {
      "type": "replaced",
      "start": 3,
      "end": 5
    },
    "C",
    "BA",
    "BB",
    "BC"
  ],
  "connections": [
    { "start": 0, "end": 1 },
    { "start": 1, "end": 2 },
    { "start": 3, "end": 4 },
    { "start": 4, "end": 5 },
  ],
  "start": 0,
  "end": 2
}
```

Note that:
- the `replaced` node is in `B`'s index
- the `connections` are not updated to point to the correct node
- the `subGraph` was appended to the end

## `flatten`

While the above represents all the data, following index redirects is a PITA. So calling `flatten` removes all redirects by walking the graph from start onwards.