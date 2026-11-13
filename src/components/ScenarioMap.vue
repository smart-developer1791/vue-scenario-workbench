<script setup lang="ts">
import { computed } from 'vue'
import { layout, type Scenario } from '../domain/scenario'
import AppIcon from './AppIcon.vue'
const props = defineProps<{ schema: Scenario; selected: string }>()
const emit = defineEmits<{ select: [id: string] }>()
const nodes = computed(() => layout(props.schema))
const width = computed(() => Math.max(735, ...nodes.value.map((node) => node.x + 210)))
const height = computed(() => Math.max(485, ...nodes.value.map((node) => node.y + 140)))
const edges = computed(() =>
  nodes.value
    .flatMap((node) =>
      node.choices.map((choice, index) => {
        const target = nodes.value.find((item) => item.id === choice.to)
        return target
          ? {
              id: `${node.id}-${index}`,
              d: `M ${node.x + 180} ${node.y + 53} C ${node.x + 205} ${node.y + 53}, ${target.x - 25} ${target.y + 53}, ${target.x} ${target.y + 53}`,
            }
          : null
      }),
    )
    .filter(Boolean),
)
</script>
<template>
  <div
    data-ui="scenario-map"
    class="h-127.5 overflow-auto [scrollbar-gutter:stable] bg-canvas [background-image:radial-gradient(#c2cfc1_0.75px,_transparent_0.75px)] [background-size:17px_17px]"
  >
    <div class="relative" :style="{ width: `${width}px`, height: `${height}px` }">
      <svg
        class="absolute top-0 right-0 bottom-0 left-0 [&_>_path]:[fill:none] [&_>_path]:[stroke:#96b0a5] [&_>_path]:[stroke-width:1.4]"
        :width="width"
        :height="height"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="graph-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0 8 4 0 8" fill="#94ada4" />
          </marker>
        </defs>
        <path
          v-for="edge in edges"
          :key="edge!.id"
          :d="edge!.d"
          marker-end="url(#graph-arrow)"
        /></svg
      ><button
        v-for="(node, index) in nodes"
        :key="node.id"
        data-ui="graph-node"
        class="absolute w-45 h-28 text-left bg-surface border border-solid border-[#d5dfd2] rounded-[12px] shadow-[0_5px_13px_#2c493407] text-ink p-[13px] [&.selected]:border-[#3c8171] [&.selected]:shadow-[0_0_0_3px_#3c81711a] [&.result]:bg-[#e2efdc] [&.result]:border-[#c7dac2] [&_strong]:block [&_strong]:font-[family-name:'Bricolage_Grotesque_Variable'] [&_strong]:text-[length:13px] [&_strong]:leading-[1.3] [&_strong]:max-h-8.5 [&_strong]:overflow-hidden [&_strong]:wrap-anywhere [&_strong]:font-semibold"
        :class="{ selected: selected === node.id, result: node.kind === 'result' }"
        :style="{ left: `${node.x}px`, top: `${node.y}px` }"
        @click="emit('select', node.id)"
      >
        <span
          class="flex items-center justify-between gap-1 text-[length:6px] tracking-[0.7px] text-muted mb-[11px]"
          ><span>{{
            node.id === schema.entry
              ? 'START HERE'
              : node.kind === 'result'
                ? 'A GOOD NEXT STEP'
                : 'A LITTLE QUESTION'
          }}</span
          ><span>{{ String(index + 1).padStart(2, '0') }}</span></span
        ><strong>{{ node.title || 'Untitled step' }}</strong
        ><span class="flex items-center gap-[5px] mt-[11px] text-muted text-[length:8px]"
          ><AppIcon :name="node.kind === 'result' ? 'check' : 'branch'" :size="13" />{{
            node.kind === 'result' ? 'Result' : `${node.choices.length} paths`
          }}<span
            class="absolute right-[-4px] top-[49px] w-[7px] h-[7px] bg-[#88a490] border-[length:2px] border-solid border-surface rounded-[50%] [.result_&]:hidden"
        /></span>
      </button>
    </div>
  </div>
</template>
