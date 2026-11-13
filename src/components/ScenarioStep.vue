<script setup lang="ts">
import { ref } from 'vue'
import type { Step } from '../domain/scenario'
import AppIcon from './AppIcon.vue'
const props = defineProps<{ step: Step; initialNote: string }>()
const emit = defineEmits<{ choose: [index: number]; note: [value: string] }>()
const note = ref(props.initialNote)
</script>
<template>
  <article
    data-ui="runner-card"
    class="max-w-120 bg-surface border border-solid border-line rounded-[14px] wrap-anywhere p-7 m-auto [@media(width<=700px)]:py-[23px] [@media(width<=700px)]:px-5 [&_[data-ui~=eyebrow]]:text-[length:8px] [&_[data-ui~=eyebrow]]:mb-[11px] [&_h2]:text-[length:28px] [&_h2]:leading-[1.1] [&_h2]:tracking-[-0.8px] [@media(width<=700px)]:[&_h2]:text-[length:26px]"
  >
    <span class="text-[length:47px] text-accent leading-[1.2] block mb-[13px]">{{
      step.kind === 'result' ? '✳' : '↗'
    }}</span>
    <p data-ui="eyebrow" class="text-[length:10px] font-[750] tracking-[1.8px] text-muted">
      {{ step.kind === 'result' ? 'YOUR NEXT GOOD MOVE' : 'ONE THOUGHTFUL QUESTION' }}
    </p>
    <h2>{{ step.title }}</h2>
    <p class="text-[length:12px] text-muted mt-[15px] mb-5.5 mx-0">
      {{ step.body }}
    </p>
    <div
      v-if="step.kind === 'question'"
      class="flex flex-col gap-[9px] [&_>_button]:flex [&_>_button]:items-center [&_>_button]:justify-between [&_>_button]:gap-2.5 [&_>_button]:text-left [&_>_button]:bg-[#eaf1e5] [&_>_button]:border [&_>_button]:border-solid [&_>_button]:border-[#d4e1cf] [&_>_button]:rounded-[8px] [&_>_button]:text-ink [&_>_button]:text-[length:12px] [&_>_button]:font-semibold [&_>_button]:py-[13px] [&_>_button]:px-[15px] [&_>_button:hover]:bg-[#dfecd8]"
    >
      <button v-for="(choice, index) in step.choices" :key="index" @click="emit('choose', index)">
        {{ choice.label }}<AppIcon />
      </button>
    </div>
    <div
      v-else
      class="flex items-center gap-[7px] bg-[#eaf1e5] rounded-[8px] text-[length:11px] text-accent p-3"
    >
      <AppIcon name="check" /> You’ve found a place to begin.
    </div>
    <label
      class="border-t [border-top-style:solid] border-t-line mt-[23px] pt-4.5 mb-0 text-[length:11px] [&_textarea]:text-[length:11px] [&_textarea]:bg-[#fcfcf8]"
      >A note to yourself<textarea
        v-model="note"
        rows="2"
        maxlength="1000"
        placeholder="Something worth remembering…"
        @input="emit('note', ($event.target as HTMLTextAreaElement).value)"
      />
    </label>
  </article>
</template>
