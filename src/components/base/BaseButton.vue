<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    variante?: 'primario' | 'secundario' | 'fantasma' | 'perigo'
    tamanho?: 'sm' | 'md' | 'lg'
    tipo?: 'button' | 'submit' | 'reset'
    icone?: string
    /** Se informado, o botão vira um RouterLink (mantendo o visual). */
    para?: RouteLocationRaw
    carregando?: boolean
    desabilitado?: boolean
    blocoInteiro?: boolean
    /** Botões só com ícone precisam de rótulo acessível. */
    somenteIcone?: boolean
  }>(),
  { variante: 'secundario', tamanho: 'md', tipo: 'button' },
)

const classes = computed(() => [
  'btn',
  `btn--${props.variante}`,
  `btn--${props.tamanho}`,
  { 'btn--bloco': props.blocoInteiro, 'btn--icone': props.somenteIcone, 'is-loading': props.carregando },
])
</script>

<template>
  <RouterLink v-if="para && !desabilitado" :to="para" :class="classes">
    <AppIcon v-if="icone" :nome="icone" :tamanho="tamanho === 'sm' ? 16 : 18" />
    <span :class="{ 'sr-only': somenteIcone }"><slot /></span>
  </RouterLink>
  <button
    v-else
    :type="tipo"
    :class="classes"
    :disabled="desabilitado || carregando"
    :aria-busy="carregando || undefined"
  >
    <span v-if="carregando" class="btn__spinner" aria-hidden="true" />
    <AppIcon v-else-if="icone" :nome="icone" :tamanho="tamanho === 'sm' ? 16 : 18" />
    <span :class="{ 'sr-only': somenteIcone }"><slot /></span>
  </button>
</template>

<style scoped>
.btn {
  --btn-bg: var(--color-surface);
  --btn-fg: var(--color-text);
  --btn-border: var(--color-border-strong);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1.5px solid var(--btn-border);
  border-radius: var(--radius-md);
  background: var(--btn-bg);
  color: var(--btn-fg);
  font-weight: 600;
  font-size: var(--text-sm);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast),
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
}

.btn:hover:not(:disabled) {
  border-color: var(--color-ink);
}

.btn:active:not(:disabled) {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Primário: amarelo de sinalização com sombra "carimbada" em preto */
.btn--primario {
  --btn-bg: var(--color-primary);
  --btn-fg: var(--color-ink);
  --btn-border: var(--color-ink);
  box-shadow: var(--shadow-hard);
}

.btn--primario:hover:not(:disabled) {
  --btn-bg: var(--color-primary-hover);
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--color-ink);
}

.btn--primario:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 var(--color-ink);
}

.btn--primario:disabled {
  box-shadow: none;
}

.btn--fantasma {
  --btn-bg: transparent;
  --btn-border: transparent;
}

.btn--fantasma:hover:not(:disabled) {
  --btn-bg: var(--color-surface-2);
  border-color: transparent;
}

.btn--perigo {
  --btn-bg: var(--color-danger);
  --btn-fg: #fff;
  --btn-border: var(--color-danger);
}

.btn--perigo:hover:not(:disabled) {
  --btn-bg: #94180f;
  border-color: #94180f;
}

.btn--sm {
  min-height: 32px;
  padding: 0 var(--space-3);
  font-size: var(--text-xs);
}

.btn--lg {
  min-height: 48px;
  padding: 0 var(--space-6);
  font-size: var(--text-base);
}

.btn--bloco {
  width: 100%;
}

.btn--icone {
  padding: 0;
  aspect-ratio: 1;
}

.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
</style>
