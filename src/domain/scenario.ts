export interface Choice {
  label: string
  to: string
}
export interface Step {
  id: string
  kind: 'question' | 'result'
  title: string
  body: string
  choices: Choice[]
}
export interface Scenario {
  format: 'SW/1'
  title: string
  description: string
  entry: string
  steps: Step[]
}
export const sample: Scenario = {
  format: 'SW/1',
  title: 'Find your next good move',
  description: 'A friendly starting point for your next creative project.',
  entry: 'start',
  steps: [
    {
      id: 'start',
      kind: 'question',
      title: 'Where are you starting?',
      body: 'Every good project begins with a little clarity. What does yours look like?',
      choices: [
        { label: 'A brand new idea', to: 'new' },
        { label: 'Something already exists', to: 'existing' },
      ],
    },
    {
      id: 'new',
      kind: 'question',
      title: 'What needs a little shape?',
      body: 'Think about the first thing that will help your idea feel real.',
      choices: [
        { label: 'The look and the story', to: 'identity' },
        { label: 'The digital experience', to: 'website' },
      ],
    },
    {
      id: 'existing',
      kind: 'question',
      title: 'What would make it better?',
      body: 'A small, thoughtful change can make a surprisingly big difference.',
      choices: [
        { label: 'A clearer visual direction', to: 'identity' },
        { label: 'A smoother experience', to: 'review' },
      ],
    },
    {
      id: 'identity',
      kind: 'result',
      title: 'Start with a little identity.',
      body: 'Collect three references you love. Write down what your project should feel like. Then explore a small set of colors, words, and shapes.',
      choices: [],
    },
    {
      id: 'website',
      kind: 'result',
      title: 'Make one useful page.',
      body: 'Choose one thing your visitor should be able to do. Sketch the shortest path to it, and turn that sketch into a small working prototype.',
      choices: [],
    },
    {
      id: 'review',
      kind: 'result',
      title: 'Listen, then simplify.',
      body: 'Watch someone use the current experience. Find one point of friction. Improve it, try again, and keep what makes the journey clearer.',
      choices: [],
    },
  ],
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
function text(v: unknown, length: number) {
  if (typeof v !== 'string' || v.length > length) throw new Error('Invalid or oversized text.')
  return v
}
export function parseScenario(v: unknown): Scenario {
  if (
    !object(v) ||
    v.format !== 'SW/1' ||
    !Array.isArray(v.steps) ||
    !v.steps.length ||
    v.steps.length > 20
  )
    throw new Error('Use an SW/1 scenario with 1–20 steps.')
  const ids = new Set<string>()
  const steps = v.steps.map((raw): Step => {
    if (!object(raw)) throw new Error('Invalid step.')
    const id = text(raw.id, 40)
    if (
      !/^[a-z][a-z0-9_-]*$/.test(id) ||
      ['constructor', 'prototype', '__proto__'].includes(id) ||
      ids.has(id)
    )
      throw new Error('Step IDs must be safe and unique.')
    ids.add(id)
    if (
      !['question', 'result'].includes(raw.kind as string) ||
      !Array.isArray(raw.choices) ||
      raw.choices.length > 4 ||
      (raw.kind === 'question' && !raw.choices.length) ||
      (raw.kind === 'result' && raw.choices.length)
    )
      throw new Error('Questions need 1–4 choices; results have none.')
    const choices = raw.choices.map((choice): Choice => {
      if (!object(choice)) throw new Error('Invalid choice.')
      const label = text(choice.label, 100)
      if (!label.trim()) throw new Error('Choices need a label.')
      return { label, to: text(choice.to, 40) }
    })
    return {
      id,
      kind: raw.kind as Step['kind'],
      title: text(raw.title, 120),
      body: text(raw.body, 500),
      choices,
    }
  })
  const entry = text(v.entry, 40)
  if (!ids.has(entry)) throw new Error('The starting step does not exist.')
  for (const step of steps)
    for (const choice of step.choices)
      if (!ids.has(choice.to)) throw new Error(`Missing destination: ${choice.to}.`)
  const visiting = new Set<string>(),
    visited = new Set<string>()
  const byId = new Map(steps.map((step) => [step.id, step]))
  function visit(id: string) {
    if (visiting.has(id))
      throw new Error('This scenario contains a cycle. Connect each path to a result.')
    if (visited.has(id)) return
    visiting.add(id)
    for (const choice of byId.get(id)!.choices) visit(choice.to)
    visiting.delete(id)
    visited.add(id)
  }
  for (const step of steps) visit(step.id)
  return {
    format: 'SW/1',
    title: text(v.title, 120),
    description: text(v.description, 300),
    entry,
    steps,
  }
}
export function reachable(scenario: Scenario) {
  const ids = new Set<string>(),
    queue = [scenario.entry]
  while (queue.length) {
    const id = queue.shift()!
    if (ids.has(id)) continue
    ids.add(id)
    for (const choice of scenario.steps.find((step) => step.id === id)?.choices || [])
      queue.push(choice.to)
  }
  return ids
}
export function layout(scenario: Scenario) {
  const depths = new Map<string, number>([[scenario.entry, 0]])
  // Repeated relaxation gives the longest level in a validated DAG.
  for (let i = 0; i < scenario.steps.length; i++) {
    let changed = false
    for (const step of scenario.steps) {
      const depth = depths.get(step.id)
      if (depth === undefined) continue
      for (const choice of step.choices) {
        const next = depth + 1
        if (next > (depths.get(choice.to) ?? -1) && next <= scenario.steps.length) {
          depths.set(choice.to, next)
          changed = true
        }
      }
    }
    if (!changed) break
  }
  const last = Math.max(...depths.values(), 0) + 1
  const counts = new Map<number, number>()
  return scenario.steps.map((step) => {
    const level = depths.get(step.id) ?? last
    const row = counts.get(level) ?? 0
    counts.set(level, row + 1)
    return { ...step, x: 30 + level * 225, y: 35 + row * 155 }
  })
}
