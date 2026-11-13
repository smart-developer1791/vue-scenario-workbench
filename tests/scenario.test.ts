import test from 'node:test'
import assert from 'node:assert/strict'
import { sample, parseScenario, reachable, layout } from '../src/domain/scenario.ts'
import { clone, stamp } from '../src/services/files.ts'
test('all sample branches terminate in reachable results', () => {
  const scenario = parseScenario(sample)
  assert.equal(reachable(scenario).size, scenario.steps.length)
  assert.equal(scenario.steps.filter((step) => step.kind === 'result').length, 3)
})
test('imports reject dangling links and cycles even in disconnected components', () => {
  const broken = clone(sample)
  broken.steps[0]!.choices[0]!.to = 'missing'
  assert.throws(() => parseScenario(broken), /Missing/)
  const cyclic = clone(sample)
  cyclic.steps[1]!.choices[0]!.to = 'start'
  assert.throws(() => parseScenario(cyclic), /cycle/)
  const disconnected = clone(sample)
  disconnected.steps.push({
    id: 'loop',
    kind: 'question',
    title: 'Loop',
    body: '',
    choices: [{ label: 'Again', to: 'loop' }],
  })
  assert.throws(() => parseScenario(disconnected), /cycle/)
})
test('malformed identities and impossible step kinds are rejected', () => {
  const unsafe = clone(sample)
  unsafe.steps[0]!.id = 'constructor'
  assert.throws(() => parseScenario(unsafe))
  const empty = clone(sample)
  empty.steps[0]!.choices = []
  assert.throws(() => parseScenario(empty))
  const result = clone(sample)
  result.steps[3]!.choices = [{ label: 'Continue', to: 'start' }]
  assert.throws(() => parseScenario(result))
})
test('layout reflects actual edges and gives each step its own position', () => {
  const nodes = layout(sample)
  assert.equal(new Set(nodes.map((node) => `${node.x},${node.y}`)).size, nodes.length)
  for (const node of nodes)
    for (const choice of node.choices)
      assert.ok(nodes.find((target) => target.id === choice.to)!.x > node.x)
  assert.equal(
    stamp('SW', parseScenario(sample)),
    stamp('SW', parseScenario({ ...sample, provenance: {} })),
  )
})
