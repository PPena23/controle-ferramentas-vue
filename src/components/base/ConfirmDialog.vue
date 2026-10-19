<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

withDefaults(
  defineProps<{
    aberto: boolean
    titulo: string
    mensagem: string
    rotuloConfirmar?: string
    rotuloCancelar?: string
    perigoso?: boolean
    carregando?: boolean
  }>(),
  { rotuloConfirmar: 'Confirmar', rotuloCancelar: 'Cancelar' },
)

const emit = defineEmits<{ confirmar: []; cancelar: [] }>()
</script>

<template>
  <BaseModal :aberto="aberto" :titulo="titulo" largura="sm" :bloqueado="carregando" @fechar="emit('cancelar')">
    <p class="mensagem">{{ mensagem }}</p>
    <template #rodape>
      <BaseButton variante="fantasma" :desabilitado="carregando" @click="emit('cancelar')">
        {{ rotuloCancelar }}
      </BaseButton>
      <BaseButton :variante="perigoso ? 'perigo' : 'primario'" :carregando="carregando" @click="emit('confirmar')">
        {{ rotuloConfirmar }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.mensagem {
  color: var(--color-text-muted);
}
</style>
