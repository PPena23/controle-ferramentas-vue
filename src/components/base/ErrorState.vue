<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import BaseButton from './BaseButton.vue'

withDefaults(defineProps<{ mensagem: string; titulo?: string; carregando?: boolean }>(), {
  titulo: 'Não foi possível carregar os dados',
})

const emit = defineEmits<{ tentarNovamente: [] }>()
</script>

<template>
  <div class="erro" role="alert">
    <AppIcon nome="wifi" :tamanho="28" />
    <div class="erro__texto">
      <h3>{{ titulo }}</h3>
      <p>{{ mensagem }}</p>
    </div>
    <BaseButton icone="refresh" :carregando="carregando" @click="emit('tentarNovamente')">Tentar novamente</BaseButton>
  </div>
</template>

<style scoped>
.erro {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1.5px solid var(--color-danger);
  border-left-width: 6px;
  border-radius: var(--radius-lg);
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.erro__texto {
  flex: 1 1 240px;
}

.erro h3 {
  font-size: var(--text-lg);
  color: var(--color-ink);
}

.erro p {
  color: var(--color-text);
  font-size: var(--text-sm);
}
</style>
