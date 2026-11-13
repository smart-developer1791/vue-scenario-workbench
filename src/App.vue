<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from './components/AppIcon.vue'
import AppDialog from './components/AppDialog.vue'
import ScenarioMap from './components/ScenarioMap.vue'
import ScenarioRunner, { type RunReport } from './components/ScenarioRunner.vue'
import { parseScenario, reachable, sample, type Step } from './domain/scenario'
import { clone, download, stamp } from './services/files'
import { useDraft } from './services/draft'
const { draft: schema, storageStatus } = useDraft(
  'scenario-workbench.v1',
  clone(sample),
  parseScenario,
)
const selected = ref(schema.value.entry)
const step = computed(
  () => schema.value.steps.find((item) => item.id === selected.value) || schema.value.steps[0]!,
)
const view = ref<'map' | 'run'>('map')
const newKind = ref<Step['kind']>('result')
const identity = computed(() => stamp('SW', schema.value))
const problem = computed(() => {
  try {
    parseScenario(schema.value)
    return ''
  } catch (error) {
    return (error as Error).message
  }
})
const disconnected = computed(
  () => schema.value.steps.filter((item) => !reachable(schema.value).has(item.id)).length,
)
const exportOpen = ref(false),
  importOpen = ref(false),
  resetOpen = ref(false)
const importText = ref(''),
  importError = ref('')
const report = ref<RunReport>()
watch(problem, (error) => {
  if (error) view.value = 'map'
})
function selectStep(id: string) {
  selected.value = id
  view.value = 'map'
}
watch(
  schema,
  () => {
    report.value = undefined
  },
  { deep: true },
)
const canRemove = computed(
  () =>
    step.value.id !== schema.value.entry &&
    (step.value.kind !== 'result' ||
      schema.value.steps.filter((item) => item.kind === 'result').length > 1),
)
function addStep() {
  if (schema.value.steps.length >= 20) return
  let n = 1
  while (schema.value.steps.some((item) => item.id === `step-${n}`)) n++
  const terminal = schema.value.steps.find((item) => item.kind === 'result')!
  const next: Step = {
    id: `step-${n}`,
    kind: newKind.value,
    title: newKind.value === 'result' ? 'A new place to begin' : 'What comes next?',
    body: 'A little guidance for the journey.',
    choices: newKind.value === 'result' ? [] : [{ label: 'Take the next step', to: terminal.id }],
  }
  schema.value.steps.push(next)
  selected.value = next.id
  view.value = 'map'
}
function removeStep() {
  if (!canRemove.value) return
  const id = step.value.id
  const terminal = schema.value.steps.find((item) => item.kind === 'result' && item.id !== id)!
  schema.value.steps = schema.value.steps.filter((item) => item.id !== id)
  for (const item of schema.value.steps)
    for (const choice of item.choices) if (choice.to === id) choice.to = terminal.id
  selected.value = schema.value.entry
}
function addChoice() {
  if (step.value.choices.length >= 4) return
  step.value.choices.push({
    label: 'Another way forward',
    to: schema.value.steps.find((item) => item.kind === 'result')!.id,
  })
}
function importSchema() {
  try {
    schema.value = parseScenario(JSON.parse(importText.value))
    selected.value = schema.value.entry
    view.value = 'map'
    importOpen.value = false
    importError.value = ''
  } catch (error) {
    importError.value = (error as Error).message
  }
}
function exportSchema() {
  download(
    'scenario-workbench.json',
    JSON.stringify(
      {
        ...parseScenario(schema.value),
        provenance: {
          project: 'vue-scenario-workbench',
          author: 'CodeSculptor',
          stamp: identity.value,
        },
      },
      null,
      2,
    ),
  )
}
function reset() {
  schema.value = clone(sample)
  selected.value = sample.entry
  view.value = 'map'
  resetOpen.value = false
}
</script>
<template>
  <div
    class="[&_main]:max-w-380 [&_main]:py-0 [&_main]:px-9.5 [&_main]:my-0 [&_main]:mx-auto [@media(width<=700px)]:[&_main]:px-4 [@media(700px<width<=1100px)]:[&_main]:px-6"
  >
    <header
      class="min-h-21.5 flex items-center justify-between gap-6 border-b [border-bottom-style:solid] border-b-line bg-surface py-5 px-9.5 [@media(width<=700px)]:gap-4 [@media(width<=700px)]:flex-wrap [@media(width<=700px)]:p-4 [@media(700px<width<=1100px)]:py-4.5 [@media(700px<width<=1100px)]:px-6 [@media(1600px<=width)]:px-[max(38px,_calc((100vw_-_1444px)_/_2))]"
    >
      <a
        class="font-display flex gap-[13px] items-center text-[length:24px] font-[650] tracking-[-0.8px] [@media(width<=700px)]:text-[length:22px]"
        href="/"
        aria-label="Scenario Workbench home"
        ><span
          class="w-10.5 h-10.5 rounded-[11px] bg-accent text-on-accent grid place-items-center text-[length:30px] relative [&_span]:text-[length:16px] [&_span]:absolute [&_span]:right-[5px] [&_span]:bottom-1"
          ><AppIcon name="branch" :size="25" /></span
        ><span
          >wayfinder<span
            class="block font-sans text-[length:8px] tracking-[1.5px] font-semibold text-muted mt-[3px]"
            >THE SCENARIO WORKBENCH</span
          ></span
        ></a
      >
      <div
        class="flex items-center gap-3 [@media(width<=700px)]:gap-2 [@media(width<=700px)]:w-full [@media(width<=700px)]:justify-end [@media(width<=700px)]:[&_>_button]:flex-1"
      >
        <span
          class="flex items-center gap-[7px] text-[length:11px] text-muted mr-3 [@media(width<=1100px)]:hidden"
          ><span class="inline-block w-1.5 h-1.5 rounded-[50%] bg-accent shrink-0" />{{
            storageStatus
          }}</span
        ><button
          data-ui="secondary"
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="importOpen = true"
        >
          <AppIcon name="upload" /> Import</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          :disabled="!!problem"
          @click="exportOpen = true"
        >
          <AppIcon name="download" /> Export scenario
        </button>
      </div>
    </header>
    <main>
      <section
        class="flex justify-between items-center min-h-60 gap-8 py-8.5 px-0 [@media(width<=700px)]:min-h-auto [@media(width<=700px)]:py-7.5 [@media(700px<width<=1100px)]:min-h-55 [&_[data-ui~=eyebrow]]:mb-[15px] [&_[data-ui~=eyebrow]]:text-accent [&_>_div_>_p:last-child]:mt-4 [&_>_div_>_p:last-child]:text-[length:14px] [&_>_div_>_p:last-child]:text-muted [@media(width<=700px)]:[&_>_div_>_p:last-child]:text-[length:13px] [@media(width<=700px)]:[&_h1]:text-[length:35px]"
      >
        <div>
          <p data-ui="eyebrow" class="text-[length:10px] font-[750] tracking-[1.8px] text-muted">
            A LITTLE CLARITY AT EVERY TURN
          </p>
          <h1>Every question deserves<br />a good <span class="text-accent">next step.</span></h1>
          <p>Map a helpful conversation. Follow its paths. Find a way forward.</p>
        </div>
        <div
          class="relative w-[255px] h-37.5 mr-20 [@media(width<=700px)]:mr-5 [@media(width<=700px)]:hidden [@media(700px<width<=1200px)]:mr-5"
          aria-hidden="true"
        >
          <i class="absolute left-12.5 top-19 w-38 h-[1px] bg-[#9bb09a]" /><i
            class="absolute left-[137px] top-[31px] w-14.5 h-[91px] border-t [border-top-style:solid] border-t-[#9bb09a] border-l [border-left-style:solid] border-l-[#9bb09a] border-b [border-bottom-style:solid] border-b-[#9bb09a] rounded-[13px_0_0_13px]"
          /><span
            class="absolute grid place-items-center rounded-[15px] border border-solid border-line shadow-[0_7px_20px_#263c300b] font-[family-name:'Bricolage_Grotesque_Variable'] text-[length:35px] bg-surface w-18 h-16 z-1 text-accent left-0 top-11 [transform:rotate(-8deg)]"
            >?</span
          ><span
            data-ui="one"
            class="absolute grid place-items-center rounded-[15px] border border-solid border-line shadow-[0_7px_20px_#263c300b] font-[family-name:'Bricolage_Grotesque_Variable'] text-[length:35px] bg-[#e2efdc] w-16.5 h-[59px] z-1 text-accent right-0 [&[data-ui~=one]]:top-0 [&[data-ui~=one]]:[transform:rotate(5deg)]"
            >✳</span
          ><span
            data-ui="two"
            class="absolute grid place-items-center rounded-[15px] border border-solid border-line shadow-[0_7px_20px_#263c300b] font-[family-name:'Bricolage_Grotesque_Variable'] text-[length:35px] bg-[#e2efdc] w-16.5 h-[59px] z-1 text-accent right-0 [&[data-ui~=two]]:bottom-0 [&[data-ui~=two]]:[transform:rotate(-4deg)]"
            >↗</span
          >
        </div>
      </section>
      <div
        class="grid grid-cols-[250px_minmax(330px,_1fr)_280px] gap-5 [align-items:start] [@media(width<=700px)]:grid-cols-[1fr] [@media(width<=700px)]:gap-4.5 [@media(700px<width<=1000px)]:grid-cols-[215px_minmax(300px,_1fr)] [@media(700px<width<=1000px)]:gap-3.5 [@media(1000px<width<=1200px)]:grid-cols-[215px_minmax(300px,_1fr)_250px] [@media(1000px<width<=1200px)]:gap-3.5"
      >
        <aside
          data-ui="steps-panel"
          class="bg-surface border border-solid border-line rounded-[var(--radius)] min-w-0 h-190 overflow-y-auto [scrollbar-gutter:stable] flex flex-col py-[23px] px-[15px] [@media(width<=700px)]:h-auto [@media(width<=700px)]:block [@media(width<=700px)]:py-5 [@media(width<=700px)]:px-3 [@media(700px<width<=1200px)]:py-5 [@media(700px<width<=1200px)]:px-3 [&_>_[data-ui~=panel-heading]]:py-0 [&_>_[data-ui~=panel-heading]]:px-2 [&_>_p]:py-0 [&_>_p]:px-2 [&_[data-ui~=side-note]]:shrink-0 [&_[data-ui~=side-note]]:mx-2 [&_[data-ui~=reset-button]]:shrink-0 [&_[data-ui~=reset-button]]:mx-2 [@media(width<=700px)]:[&_[data-ui~=reset-button]]:hidden [&_[data-ui~=add-step]]:shrink-0"
        >
          <div
            data-ui="panel-heading"
            class="flex items-center justify-between gap-3 mb-2 [&_+_p]:mb-5"
          >
            <h2>The conversation</h2>
            <span
              class="text-[length:10px] font-semibold bg-hover border border-solid border-line rounded-[6px] whitespace-nowrap py-1 px-[7px]"
              >{{ schema.steps.length }}/20</span
            >
          </div>
          <p data-ui="muted" class="text-muted text-[length:12px]">
            Each turn, a little more clarity.
          </p>
          <div
            data-ui="step-list"
            class="flex flex-col gap-[7px] mb-6 flex-1 min-h-0 overflow-y-auto [@media(width<=700px)]:grid [@media(width<=700px)]:grid-cols-[repeat(2,_minmax(0,_1fr))] [@media(width<=700px)]:max-h-70 [&_>_button]:w-full [&_>_button]:flex [&_>_button]:items-center [&_>_button]:gap-2.5 [&_>_button]:border [&_>_button]:border-solid [&_>_button]:border-[transparent] [&_>_button]:bg-[transparent] [&_>_button]:text-left [&_>_button]:rounded-[10px] [&_>_button]:text-ink [&_>_button]:min-h-[65px] [&_>_button]:py-3 [&_>_button]:px-[9px] [@media(width<=700px)]:[&_>_button]:gap-[7px] [@media(width<=700px)]:[&_>_button]:min-w-0 [@media(width<=700px)]:[&_>_button]:py-2.5 [@media(width<=700px)]:[&_>_button]:px-[7px] [&_>_button.selected]:bg-[#e8f1e7] [&_>_button.selected]:border-[#d5e2d3] [&_>_button_>_span:nth-child(2)]:min-w-0 [&_>_button_>_span:nth-child(2)]:flex-1 [&_strong]:block [&_strong]:overflow-hidden [&_strong]:whitespace-nowrap [&_strong]:text-ellipsis [&_strong]:text-[length:11px] [&_strong]:font-semibold [@media(width<=700px)]:[&_strong]:text-[length:10px] [&_small]:block [&_small]:mt-[5px] [&_small]:text-[length:9px] [&_small]:text-muted"
          >
            <button
              v-for="(item, index) in schema.steps"
              :key="item.id"
              :class="{ selected: step.id === item.id }"
              @click="selectStep(item.id)"
            >
              <span
                class="w-7 h-7 rounded-[7px] bg-[#f0f3ed] text-muted grid place-items-center shrink-0 [@media(width<=700px)]:w-6 [@media(width<=700px)]:h-6 [.selected_&]:bg-[#d0e5d2] [.selected_&]:text-accent"
                ><AppIcon :name="item.kind === 'result' ? 'check' : 'branch'" :size="15" /></span
              ><span
                ><strong>{{ item.title || 'Untitled step' }}</strong
                ><small>{{
                  item.id === schema.entry
                    ? 'Starting point'
                    : item.kind === 'result'
                      ? 'A good outcome'
                      : `${item.choices.length} ways forward`
                }}</small></span
              ><span
                class="font-[family-name:monospace] text-[length:9px] text-muted [@media(width<=700px)]:hidden"
                >{{ String(index + 1).padStart(2, '0') }}</span
              >
            </button>
          </div>
          <div
            data-ui="add-step"
            class="border-t [border-top-style:solid] border-t-line py-5 px-2 [@media(width<=700px)]:pb-4.5 [@media(width<=700px)]:grid [@media(width<=700px)]:grid-cols-2 [@media(width<=700px)]:gap-2.5 [&_label]:mb-0 [@media(width<=700px)]:[&_label]:[grid-column:1/-1] [&_select]:my-2.5 [&_select]:mx-0 [@media(width<=700px)]:[&_select]:my-0"
          >
            <label for="step-type">Add to the journey</label
            ><select id="step-type" v-model="newKind">
              <option value="question">Question</option>
              <option value="result">Result</option></select
            ><button
              data-ui="secondary full"
              class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink w-full py-2.5 px-[15px] [&:hover]:bg-hover"
              :disabled="schema.steps.length >= 20"
              @click="addStep"
            >
              <AppIcon name="plus" /> Add step
            </button>
          </div>
          <div
            data-ui="side-note"
            class="border-t [border-top-style:solid] border-t-line pt-5 flex items-start gap-[9px] text-muted text-[length:11px] [&_svg]:text-accent [&_svg]:mt-[3px]"
          >
            <AppIcon name="branch" />
            <p>
              {{
                disconnected
                  ? `${disconnected} disconnected step(s). Connect a choice to include them in the journey.`
                  : 'Every path in this sample finds a useful place to begin.'
              }}
            </p>
          </div>
          <button
            data-ui="text-button reset-button"
            class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted mt-4.5 text-[length:11px] py-[7px] px-0.5 [@media(width<=700px)]:inline-flex!"
            @click="resetOpen = true"
          >
            <AppIcon name="reset" /> Restore sample
          </button>
        </aside>
        <section
          data-ui="preview-panel"
          class="min-w-0 border border-solid border-line bg-surface rounded-[18px] overflow-hidden"
        >
          <div
            class="min-h-15 flex items-center justify-between gap-2.5 border-b [border-bottom-style:solid] border-b-line py-3.5 px-[17px] [@media(width<=700px)]:flex-wrap [@media(width<=700px)]:p-3 [&_>_code]:text-muted [&_>_code]:text-[length:9px] [@media(width<=700px)]:[&_>_code]:text-[length:8px]"
          >
            <div
              class="flex gap-[5px] bg-canvas rounded-[8px] p-1 [&_>_button]:flex [&_>_button]:items-center [&_>_button]:gap-1.5 [&_>_button]:bg-[transparent] [&_>_button]:border [&_>_button]:border-solid [&_>_button]:border-[transparent] [&_>_button]:rounded-[6px] [&_>_button]:text-[length:10px] [&_>_button]:font-semibold [&_>_button]:text-muted [&_>_button]:min-h-8 [&_>_button]:py-[7px] [&_>_button]:px-2.5 [@media(width<=700px)]:[&_>_button]:text-[length:9px] [@media(width<=700px)]:[&_>_button]:py-1.5 [@media(width<=700px)]:[&_>_button]:px-2 [&_>_button.active]:bg-surface [&_>_button.active]:text-accent [&_>_button.active]:border-line [&_>_button.active]:shadow-[0_2px_4px_#2538260a]"
            >
              <button :class="{ active: view === 'map' }" @click="view = 'map'">
                <AppIcon name="branch" :size="14" /> The map</button
              ><button
                :class="{ active: view === 'run' }"
                :disabled="!!problem"
                @click="view = 'run'"
              >
                <AppIcon name="play" :size="14" /> Try the journey
              </button>
            </div>
            <code>{{ identity }}</code>
          </div>
          <div
            class="border-b [border-bottom-style:solid] border-b-line min-h-34.5 h-34.5 overflow-y-auto py-6 px-6.5 [@media(width<=700px)]:p-5.5 [&_[data-ui~=eyebrow]]:text-[length:8px] [&_[data-ui~=eyebrow]]:mb-2.5 [&_h2]:text-[length:24px] [&_h2]:leading-[1.2] [&_h2]:wrap-anywhere [@media(width<=700px)]:[&_h2]:text-[length:23px] [&_>_p:last-child]:text-[length:11px] [&_>_p:last-child]:text-muted [&_>_p:last-child]:mt-2.5"
          >
            <span
              data-ui="eyebrow"
              class="text-[length:10px] font-[750] tracking-[1.8px] text-muted"
              >YOUR SCENARIO</span
            >
            <h2>{{ schema.title }}</h2>
            <p>{{ schema.description }}</p>
          </div>
          <ScenarioMap
            v-show="view === 'map'"
            :schema="schema"
            :selected="step.id"
            @select="selected = $event"
          /><ScenarioRunner v-show="view === 'run'" :schema="schema" @report="report = $event" />
          <div
            class="flex justify-between gap-3 border-t [border-top-style:solid] border-t-line text-[length:10px] text-muted py-[13px] px-5 [@media(width<=700px)]:flex-wrap"
          >
            <span>{{
              view === 'map'
                ? 'Select any step to shape the conversation.'
                : 'Notes stay with each step when you go back.'
            }}</span
            ><span
              >{{ schema.steps.filter((item) => item.kind === 'result').length }} possible
              outcomes</span
            >
          </div>
        </section>
        <aside
          class="bg-surface border border-solid border-line rounded-[var(--radius)] min-w-0 h-190 overflow-y-auto [scrollbar-gutter:stable] block p-[23px] [@media(width<=700px)]:grid-cols-[1fr] [@media(width<=700px)]:[grid-column:1/-1] [@media(width<=700px)]:gap-[10px_25px] [@media(width<=700px)]:p-5 [@media(700px<width<=1000px)]:[grid-column:1/-1] [@media(700px<width<=1000px)]:grid-cols-2 [@media(700px<width<=1000px)]:gap-[10px_25px] [@media(700px<width<=1000px)]:p-5 [@media(1000px<width<=1200px)]:p-5 [@media(width<=1000px)]:[&_>_[data-ui~=panel-heading]]:[grid-column:1/-1] [@media(width<=1000px)]:[&_>_[data-ui~=inspector-tabs]]:[grid-column:1/-1] [@media(width<=1000px)]:[&_>_[data-ui~=choices-heading]]:[grid-column:1/-1] [@media(width<=1000px)]:[&_>_hr]:[grid-column:1/-1] [@media(width<=1000px)]:[&_>_[data-ui~=outcome-note]]:[grid-column:1/-1] [@media(width<=1000px)]:[&_>_[data-ui~=error]]:[grid-column:1/-1] [@media(width<=1000px)]:[&_>_[data-ui~=choice-editor]]:mb-0 [@media(width<=1000px)]:[&_>_[data-ui~=full]]:[align-self:start] [@media(width<=1000px)]:[&_>_[data-ui~=remove-step]]:[align-self:start] [@media(width<=700px)]:[&_>_*]:[grid-column:1]! [@media_(max-width:_1000px)_and_(min-width:_701px)]:grid"
        >
          <div
            data-ui="panel-heading"
            class="flex items-center justify-between gap-3 mb-2 [&_+_p]:mb-5"
          >
            <h2>A thoughtful turn</h2>
            <AppIcon name="branch" />
          </div>
          <div
            data-ui="inspector-tabs"
            class="flex justify-between gap-2.5 text-[length:9px] border-b [border-bottom-style:solid] border-b-line mb-[23px] text-muted py-4.5 px-0 [&_.active]:font-bold [&_.active]:text-accent"
          >
            <span class="active">{{ step.kind.toUpperCase() }}</span
            ><code>{{ step.id }}</code>
          </div>
          <label>Step heading<input v-model="step.title" maxlength="120" /></label
          ><label>A little guidance<textarea v-model="step.body" maxlength="500" rows="4" /></label
          ><template v-if="step.kind === 'question'"
            ><p
              data-ui="eyebrow choices-heading"
              class="text-[length:10px] font-[750] tracking-[1.8px] text-muted mt-6 mb-[13px] mx-0"
            >
              WAYS FORWARD
            </p>
            <div
              v-for="(choice, index) in step.choices"
              :key="index"
              data-ui="choice-editor"
              class="bg-[#f4f6f0] border border-solid border-line rounded-[10px] mb-3 p-3 [&_label]:text-[length:10px] [&_label]:mb-3 [&_label:last-child]:mb-0 [&_input]:text-[length:13px] [&_input]:min-h-[41px] [&_input]:py-2.5 [&_select]:text-[length:11px] [&_select]:min-h-[35px] [&_select]:p-2 [&_input]:px-[11px]"
            >
              <div
                class="flex items-center justify-between gap-2.5 text-[length:8px] tracking-[1px] text-muted mb-2.5 [&_[data-ui~=text-button]]:min-h-5 [&_[data-ui~=text-button]]:p-[1px]"
              >
                <span>PATH {{ index + 1 }}</span
                ><button
                  data-ui="text-button"
                  class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted py-[7px] px-0.5"
                  :disabled="step.choices.length === 1"
                  :aria-label="`Remove path ${index + 1}`"
                  @click="step.choices.splice(index, 1)"
                >
                  <AppIcon name="close" :size="13" />
                </button>
              </div>
              <label>Answer label<input v-model="choice.label" maxlength="100" /></label
              ><label
                >Leads to<select v-model="choice.to">
                  <option
                    v-for="target in schema.steps.filter((item) => item.id !== step.id)"
                    :key="target.id"
                    :value="target.id"
                  >
                    {{ target.title || target.id }}
                  </option>
                </select></label
              >
            </div>
            <button
              data-ui="secondary full"
              class="text-[length:12px] inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink w-full py-2.5 px-[15px] [&:hover]:bg-hover"
              :disabled="step.choices.length >= 4"
              @click="addChoice"
            >
              <AppIcon name="plus" :size="15" /> Add a path
            </button></template
          >
          <div
            v-else
            data-ui="outcome-note"
            class="flex items-center gap-3 bg-[#edf3e7] rounded-[12px] p-[17px] my-5.5 mx-0 [&_>_span]:text-[length:38px] [&_>_span]:text-accent [&_p]:text-[length:10px] [&_p]:text-muted"
          >
            <span>✳</span>
            <p>A result gives the conversation<br />a useful place to land.</p>
          </div>
          <button
            data-ui="text-button danger remove-step"
            class="text-muted inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] mt-[15px] text-[length:11px] py-[7px] px-0.5 [&[data-ui~=danger]]:text-danger"
            :disabled="!canRemove"
            @click="removeStep"
          >
            <AppIcon name="trash" :size="15" /> Remove step
          </button>
          <hr />
          <label>Scenario name<input v-model="schema.title" maxlength="120" /></label
          ><label
            >Introduction<textarea v-model="schema.description" maxlength="300" rows="2" /></label
          ><label
            >Starting point<select v-model="schema.entry">
              <option v-for="item in schema.steps" :key="item.id" :value="item.id">
                {{ item.title || item.id }}
              </option>
            </select></label
          >
          <p v-if="problem" data-ui="error" class="text-[length:12px] text-danger" role="alert">
            {{ problem }}
          </p>
        </aside>
      </div>
      <footer
        class="flex justify-between gap-[15px] text-[length:9px] tracking-[1.3px] text-muted py-7.5 px-0 [@media(width<=700px)]:flex-col [@media(width<=700px)]:py-6 [&_>_span:first-child]:font-bold [&_>_span:first-child]:text-ink [&_[data-ui~=muted]]:font-normal [&_[data-ui~=muted]]:tracking-[0]"
      >
        <span
          >WAYFINDER
          <span data-ui="muted" class="text-muted">/ One good turn at a time.</span></span
        ><span>LOCAL FIRST · VUE 3 · CODESCULPTOR</span>
      </footer>
    </main>
    <AppDialog v-model="exportOpen" title="Take the conversation with you"
      ><p>
        Your scenario includes steps, choices, and a configuration stamp. You can bring it back here
        at any time.
      </p>
      <pre>{{ JSON.stringify({ ...schema, stamp: identity }, null, 2) }}</pre>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          :disabled="!!problem"
          @click="exportSchema"
        >
          <AppIcon name="download" /> Download scenario</button
        ><button
          data-ui="secondary"
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          :disabled="!report?.completed"
          @click="
            download(
              'scenario-run.json',
              JSON.stringify({ format: 'SW-run/1', schemaStamp: identity, ...report }, null, 2),
            )
          "
        >
          Download completed run
        </button>
      </div>
      <p data-ui="muted" class="text-muted text-[length:12px]">
        Finish a trial journey to export its chosen path and notes. Run state is session-only.
      </p></AppDialog
    >
    <AppDialog v-model="importOpen" title="Bring in a conversation"
      ><p>
        Paste an SW/1 scenario. Broken links and cycles are rejected before your current draft
        changes.
      </p>
      <label
        >Scenario JSON<textarea
          v-model="importText"
          class="font-[family-name:ui-monospace,_monospace]! text-[length:12px]!"
          rows="12"
        />
      </label>
      <p v-if="importError" data-ui="error" class="text-danger" role="alert">{{ importError }}</p>
      <button
        class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
        @click="importSchema"
      >
        Import scenario <AppIcon /></button
    ></AppDialog>
    <AppDialog v-model="resetOpen" title="Restore the sample?"
      ><p>This replaces your saved scenario and restarts the trial journey.</p>
      <div
        class="flex flex-wrap gap-2.5 my-5 mx-0 [@media(width<=700px)]:[&_>_button]:flex-1 [@media(width<=700px)]:[&_>_button]:min-w-32.5"
      >
        <button
          data-ui="secondary"
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
          @click="resetOpen = false"
        >
          Keep editing</button
        ><button
          class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-accent text-on-accent py-2.5 px-[15px] [&:hover]:[filter:brightness(0.96)]"
          @click="reset"
        >
          Restore sample
        </button>
      </div></AppDialog
    >
  </div>
</template>
