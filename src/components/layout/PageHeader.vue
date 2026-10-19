<script setup lang="ts">
defineProps<{ titulo: string; subtitulo?: string; rotuloSuperior?: string }>()
</script>

<template>
  <header class="cabecalho">
    <div class="cabecalho__texto">
      <p v-if="rotuloSuperior" class="eyebrow">{{ rotuloSuperior }}</p>
      <h1 class="cabecalho__titulo">{{ titulo }}</h1>
      <p v-if="subtitulo" class="cabecalho__subtitulo">{{ subtitulo }}</p>
      <slot name="extra" />
    </div>
    <div v-if="$slots.acoes" class="cabecalho__acoes">
      <slot name="acoes" />
    </div>
  </header>
</template>

<style scoped>
.cabecalho {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.cabecalho__texto {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.cabecalho__titulo {
  font-size: var(--text-2xl);
  font-stretch: 75%;
  text-transform: uppercase;
  letter-spacing: 0.01em;
}

.cabecalho__subtitulo {
  color: var(--color-text-muted);
  max-width: 60ch;
}

.cabecalho__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
</style>
