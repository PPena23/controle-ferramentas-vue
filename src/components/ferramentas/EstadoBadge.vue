<script setup lang="ts">
import { computed } from 'vue'
import type { EstadoFerramenta } from '@/types'
import { META_ESTADO } from '@/utils/estoque'
import Badge from '@/components/base/Badge.vue'

const props = defineProps<{ estado: EstadoFerramenta; compacto?: boolean }>()
const meta = computed(() => META_ESTADO[props.estado])
</script>

<template>
  <Badge :tom="meta.tom" :icone="meta.icone" :compacto="compacto">{{ meta.rotulo }}</Badge>
</template>
