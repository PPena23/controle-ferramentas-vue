<script setup lang="ts">
import type { Tom } from '@/types'
import AppIcon from './AppIcon.vue'

// Selo de status: sempre combina cor + ícone + texto (nunca só cor), por acessibilidade.
withDefaults(defineProps<{ tom?: Tom; icone?: string; compacto?: boolean }>(), { tom: 'neutral' })
</script>

<template>
  <span class="badge" :class="[`badge--${tom}`, { 'badge--compacto': compacto }]">
    <AppIcon v-if="icone" :nome="icone" :tamanho="compacto ? 12 : 14" :espessura="2.4" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  --badge-fg: var(--color-text);
  --badge-bg: var(--color-surface-2);

  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  padding: 0.2em 0.6em;
  border-radius: 999px;
  background: var(--badge-bg);
  color: var(--badge-fg);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
  border: 1px solid color-mix(in srgb, var(--badge-fg) 18%, transparent);
}

.badge--compacto {
  padding: 0.05em 0.5em;
  font-size: 0.7rem;
}

.badge--neutral {
  --badge-fg: var(--color-steel);
  --badge-bg: var(--color-steel-soft);
}
.badge--primary {
  --badge-fg: var(--color-ink);
  --badge-bg: var(--color-primary-soft);
}
.badge--success {
  --badge-fg: var(--color-success);
  --badge-bg: var(--color-success-soft);
}
.badge--warning {
  --badge-fg: var(--color-warning);
  --badge-bg: var(--color-warning-soft);
}
.badge--danger {
  --badge-fg: var(--color-danger);
  --badge-bg: var(--color-danger-soft);
}
.badge--info {
  --badge-fg: var(--color-info);
  --badge-bg: var(--color-info-soft);
}
</style>
