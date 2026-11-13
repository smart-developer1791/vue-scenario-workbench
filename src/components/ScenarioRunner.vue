<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Scenario } from '../domain/scenario'
import ScenarioStep from './ScenarioStep.vue'
import AppIcon from './AppIcon.vue'
const props = defineProps<{ schema: Scenario }>()
export interface RunReport {
  trail: { id: string; via: string }[]
  notes: Record<string, string>
  completed: boolean
}
const emit = defineEmits<{ report: [report: RunReport] }>()
const trail = ref([{ id: props.schema.entry, via: 'Start' }])
const notes = ref<Record<string, string>>({})
const epoch = ref(0)
const current = computed(
  () =>
    props.schema.steps.find((step) => step.id === trail.value.at(-1)?.id) || props.schema.steps[0]!,
)
function report() {
  emit('report', {
    trail: trail.value.map((item) => ({ ...item })),
    notes: { ...notes.value },
    completed: current.value.kind === 'result',
  })
}
function choose(index: number) {
  const choice = current.value.choices[index]
  if (!choice) return
  trail.value.push({ id: choice.to, via: choice.label })
  report()
}
function back() {
  if (trail.value.length > 1) {
    trail.value.pop()
    report()
  }
}
function note(value: string) {
  notes.value[current.value.id] = value
  report()
}
function restart() {
  trail.value = [{ id: props.schema.entry, via: 'Start' }]
  notes.value = {}
  epoch.value++
  report()
}
watch(() => props.schema, restart, { deep: true })
</script>
<template>
  <div class="h-127.5 bg-canvas flex flex-col min-h-0 [&[style*='display:_none']]:hidden!">
    <div
      class="flex items-center gap-[7px] text-[length:8px] text-muted tracking-[1px] py-3 px-[23px] [&_[data-ui~=text-button]]:ml-auto [&_[data-ui~=text-button]]:text-[length:9px] [&_[data-ui~=text-button]]:tracking-[0]"
    >
      <span class="inline-block w-1.5 h-1.5 rounded-[50%] bg-accent shrink-0" />{{
        current.kind === 'result' ? 'A PLACE TO BEGIN' : `STEP ${trail.length}`
      }}<button
        data-ui="text-button"
        class="inline-flex items-center justify-center gap-[9px] min-h-8 font-semibold leading-[1.3] rounded-[9px] border border-solid border-[transparent] [transition:background_0.15s] bg-[transparent] text-muted py-[7px] px-0.5"
        @click="restart"
      >
        <AppIcon name="reset" :size="13" /> Start again
      </button>
    </div>
    <div
      class="overflow-auto pt-1 pb-6 flex-1 min-h-0 [scrollbar-gutter:stable] px-6 [@media(width<=700px)]:pb-5 [@media(width<=700px)]:px-4"
    >
      <KeepAlive :key="epoch" :max="20"
        ><ScenarioStep
          :key="current.id"
          :step="current"
          :initial-note="notes[current.id] || ''"
          @choose="choose"
          @note="note"
      /></KeepAlive>
    </div>
    <div
      class="border-t [border-top-style:solid] border-t-line flex items-center gap-[15px] bg-surface min-h-18 py-[15px] px-5.5 [@media(width<=700px)]:gap-3 [@media(width<=700px)]:p-3.5 [&_[data-ui~=secondary]]:text-[length:10px] [&_[data-ui~=secondary]]:min-h-8 [&_[data-ui~=secondary]]:shrink-0 [&_[data-ui~=secondary]]:py-2 [&_[data-ui~=secondary]]:px-[11px] [&_[data-ui~=eyebrow]]:text-[length:7px] [&_p]:text-[length:9px] [&_p]:text-muted [&_p]:mt-1 [&_>_div]:min-w-0 [&_>_div]:wrap-anywhere"
    >
      <button
        data-ui="secondary"
        class="inline-flex items-center justify-center gap-[9px] min-h-10 font-semibold leading-[1.3] rounded-[9px] border border-solid border-line [transition:background_0.15s] bg-surface text-ink py-2.5 px-[15px] [&:hover]:bg-hover"
        :disabled="trail.length < 2"
        @click="back"
      >
        ← Back one step
      </button>
      <div>
        <span data-ui="eyebrow" class="text-[length:10px] font-[750] tracking-[1.8px] text-muted"
          >YOUR PATH</span
        >
        <p>{{ trail.map((item) => item.via).join(' → ') }}</p>
      </div>
    </div>
  </div>
</template>
