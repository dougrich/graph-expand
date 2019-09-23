const { replace, flatten } = require('./')
const { expect } = require('chai')

describe('replace', () => {

  describe('scenarios', () => {
    const scenarios = [
      [
        'Simple',
        [
          {
            nodes: ['mid'],
            connections: [],
            start: 0,
            end: 0
          },
          0,
          {
            nodes: ['final'],
            connections: [],
            start: 0,
            end: 0
          }
        ],
        {
          nodes: [
            {
              type: 'replaced',
              start: 1,
              end: 1
            },
            'final'
          ],
          connections: [],
          start: 0,
          end: 0
        }
      ],
      [
        'Connected Sub Graph',
        [
          {
            nodes: ['start', 'mid', 'end'],
            connections: [
              { start: 0, end: 1 },
              { start: 1, end: 2 }
            ],
            start: 0,
            end: 2
          },
          1,
          {
            nodes: ['expand-start', 'expand-mid', 'expand-end'],
            connections: [
              { start: 0, end: 1 },
              { start: 0, end: 2 },
              { start: 1, end: 2 }
            ],
            start: 0,
            end: 2
          }
        ],
        {
          nodes: ['start', { type: 'replaced', start: 3, end: 5 }, 'end', 'expand-start', 'expand-mid', 'expand-end'],
          connections: [
            { start: 0, end: 1 },
            { start: 1, end: 2 },
            { start: 3, end: 4 },
            { start: 3, end: 5 },
            { start: 4, end: 5 }
          ],
          start: 0,
          end: 2
        }
      ]
    ]

    for (const [name, [graph, index, subgraph], expectedResult] of scenarios) {
      it(name, () => {
        const result = replace(graph, index, subgraph)
        expect(result).to.deep.equal(expectedResult)
      })
    }
  })

  describe('side effects', () => {
    it('clones the sub graph and does not link the sub graph', () => {
      /**
       * This is important so that the sub graph can be re-used in other graphs
       */
      const graph = {
        nodes: ['start', 'end'],
        connections: [
          {
            start: 0,
            end: 1
          }
        ],
        start: 0,
        end: 1
      }

      const subgraph = {
        nodes: [{ type: 'expanded' }, { type: 'expanded' }],
        connections: [
          {
            start: 0,
            end: 1
          }
        ],
        start: 0,
        end: 1
      }
      const originalNode = subgraph.nodes[0]
      const originalConnection = subgraph.connections[0]

      const result = replace(graph, 0, subgraph)

      result.nodes[1].tick = true
      result.connections[1].tick = true

      expect(originalNode.tick).not.to.equal(true)
      expect(originalConnection.tick).not.to.equal(true)
    })
  })
})

describe('flatten', () => {
  describe('scenarios', () => {
    const scenarios = [
      [
        'Start',
        {
          nodes: [
            {
              type: 'replaced',
              start: 1,
              end: 1
            },
            'mid',
            'final'
          ],
          connections: [
            { start: 0, end: 2 }
          ],
          start: 0,
          end: 2
        },
        {
          nodes: [
            'mid',
            'final'
          ],
          connections: [
            { start: 0, end: 1 }
          ],
          start: 0,
          end: 1
        }
      ],
      [
        'Mid',
        {
          nodes: [
            'start',
            {
              type: 'replaced',
              start: 3,
              end: 3
            },
            'final',
            'mid'
          ],
          connections: [
            { start: 0, end: 1 },
            { start: 1, end: 2 }
          ],
          start: 0,
          end: 2
        },
        {
          nodes: [
            'start',
            'mid',
            'final'
          ],
          connections: [
            { start: 0, end: 1 },
            { start: 1, end: 2 }
          ],
          start: 0,
          end: 2
        }
      ],
      [
        'End',
        {
          nodes: [
            'mid',
            'final',
            {
              type: 'replaced',
              start: 0,
              end: 0
            }
          ],
          connections: [
            { start: 2, end: 1 }
          ],
          start: 2,
          end: 1
        },
        {
          nodes: [
            'mid',
            'final'
          ],
          connections: [
            { start: 0, end: 1 }
          ],
          start: 0,
          end: 1
        }
      ],
      [
        'Metadata preserved',
        {
          nodes: [
            'start',
            {
              type: 'replaced',
              start: 3,
              end: 3
            },
            'final',
            'mid'
          ],
          connections: [
            { start: 0, end: 1, preserved: true  },
            { start: 1, end: 2 }
          ],
          start: 0,
          end: 2
        },
        {
          nodes: [
            'start',
            'mid',
            'final'
          ],
          connections: [
            { start: 0, end: 1, preserved: true  },
            { start: 1, end: 2 }
          ],
          start: 0,
          end: 2
        }
      ]
    ]

    for (const [name, graph, expectedResult] of scenarios) {
      it(name, () => {
        const result = flatten(graph)
        expect(result).to.deep.equal(expectedResult)
      })
    }
  })
})