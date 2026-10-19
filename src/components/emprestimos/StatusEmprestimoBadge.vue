<script setup lang="ts">
import { computed } from 'vue'
import type { StatusEmprestimo } from '@/types'
import { META_STATUS_EMPRESTIMO } from '@/utils/estoque'
import Badge from '@/components/base/Badge.vue'

const props = defineProps<{ status: StatusEmprestimo; diasAtraso?: number }>()
const meta = computed(() => META_STATUS_EMPRESTIMO[props.status])
const rotulo = computed(() =>
  props.status === 'atrasado' && props.diasAtraso
    ? `Atrasado ${props.diasAtraso} dia${props.diasAtraso > 1 ? 's' : ''}`
    : meta.value.rotulo,
)
</script>

<template>
  <Badge :tom="meta.tom" :icone="meta.icone">{{ rotulo }}</Badge>
</template>
