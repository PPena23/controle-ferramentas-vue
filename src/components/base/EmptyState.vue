<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    titulo: string
    descricao?: string
    icone?: string
    /** Versão compacta para usar dentro de cartões. */
    compacto?: boolean
  }>(),
  { icone: 'box' },
)
</script>

<template>
  <div class="vazio" :class="{ 'vazio--compacto': compacto }" role="status">
    <div class="vazio__icone" aria-hidden="true">
      <AppIcon :nome="icone" :tamanho="compacto ? 22 : 28" />
    </div>
    <h3 class="vazio__titulo">{{ titulo }}</h3>
    <p v-if="descricao" class="vazio__descricao">{{ descricao }}</p>
    <div v-if="$slots.default" class="vazio__acoes">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-10) var(--space-6);
  text-align: center;
}

.vazio--compacto {
  padding: var(--space-6) var(--space-4);
}

/* Ícone dentro de um "cone" de sinalização com borda zebrada */
.vazio__icone {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-2);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-ink);
  isolation: isolate;
}

.vazio__icone::before {
  content: '';
  position: absolute;
  inset: -5px;
  z-index: -1;
  border-radius: 50%;
  background: var(--hazard);
  opacity: 0.9;
}

.vazio--compacto .vazio__icone {
  width: 48px;
  height: 48px;
}

.vazio__titulo {
  font-size: var(--text-lg);
}

.vazio__descricao {
  max-width: 42ch;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.vazio__acoes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
</style>
