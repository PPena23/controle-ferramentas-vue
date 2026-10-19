<script setup lang="ts">
// Placeholder animado exibido enquanto a API simulada responde.
withDefaults(defineProps<{ largura?: string; altura?: string; raio?: string }>(), {
  largura: '100%',
  altura: '1rem',
  raio: 'var(--radius-sm)',
})
</script>

<template>
  <span class="skeleton" :style="{ width: largura, height: altura, borderRadius: raio }" aria-hidden="true" />
</template>

<style scoped>
.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--color-surface-2) 0%,
    var(--color-surface-3) 40%,
    var(--color-surface-2) 80%
  );
  background-size: 200% 100%;
  animation: brilho 1.3s ease-in-out infinite;
}

@keyframes brilho {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -50% 0;
  }
}
</style>
