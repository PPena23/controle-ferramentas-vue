<script setup lang="ts">
// Ícones de traço (24×24) desenhados inline: zero dependências e herdam a cor via currentColor.
import { computed } from 'vue'

const ICONES: Record<string, string[]> = {
  painel: ['M3 3h7v9H3z', 'M14 3h7v5h-7z', 'M14 12h7v9h-7z', 'M3 16h7v5H3z'],
  wrench: [
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  ],
  box: [
    'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    'm3.3 7 8.7 5 8.7-5',
    'M12 22V12',
  ],
  troca: ['M8 3 4 7l4 4', 'M4 7h16', 'm16 21 4-4-4-4', 'M20 17H4'],
  historico: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  plus: ['M5 12h14', 'M12 5v14'],
  search: ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z', 'm21 21-4.3-4.3'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  check: ['M20 6 9 17l-5-5'],
  'check-circle': ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'm9 12 2 2 4-4'],
  alert: ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z', 'M12 9v4', 'M12 17h.01'],
  info: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 16v-4', 'M12 8h.01'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7v5l3 2'],
  ban: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'm5.6 5.6 12.8 12.8'],
  pencil: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z', 'm15 5 4 4'],
  trash: ['M3 6h18', 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6', 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'],
  'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
  'chevron-up': ['m18 15-6-6-6 6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'arrow-left': ['m12 19-7-7 7-7', 'M19 12H5'],
  refresh: [
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8',
    'M21 3v5h-5',
    'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16',
    'M8 16H3v5',
  ],
  'trending-down': ['m22 17-8.5-8.5-5 5L2 7', 'M16 17h6v-6'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z'],
  'map-pin': ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  wifi: ['M12 20h.01', 'M8.5 16.43a5 5 0 0 1 7 0', 'M5 12.86a10 10 0 0 1 14 0', 'M2 8.82a15 15 0 0 1 20 0'],
  chart: ['M3 3v18h18', 'M7 16V9', 'M12 16V5', 'M17 16v-4'],
}

const props = withDefaults(
  defineProps<{
    nome: string
    tamanho?: number
    /** Texto alternativo. Sem ele o ícone é decorativo (aria-hidden). */
    rotulo?: string
    espessura?: number
  }>(),
  { tamanho: 20, espessura: 2 },
)

const caminhos = computed(() => ICONES[props.nome] ?? ICONES.info)
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="espessura"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="rotulo ? 'img' : undefined"
    :aria-label="rotulo"
    :aria-hidden="rotulo ? undefined : 'true'"
    focusable="false"
    class="icone"
  >
    <path v-for="d in caminhos" :key="d" :d="d" />
  </svg>
</template>

<style scoped>
.icone {
  flex-shrink: 0;
}
</style>
