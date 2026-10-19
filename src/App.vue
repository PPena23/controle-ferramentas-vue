<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useDados } from '@/composables/useDados'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ToastContainer from '@/components/base/ToastContainer.vue'

const { carregarTudo } = useDados()

// Busca inicial (async/await) assim que o app é montado; cada tela exibe seu próprio skeleton.
onMounted(carregarTudo)
</script>

<template>
  <AppHeader />

  <main id="conteudo" class="container conteudo" tabindex="-1">
    <RouterView v-slot="{ Component, route }">
      <Transition name="pagina" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>

  <AppFooter />
  <ToastContainer />
</template>

<style scoped>
.conteudo {
  padding-top: var(--space-8);
  min-height: 70vh;
}

.conteudo:focus {
  outline: none;
}
</style>
