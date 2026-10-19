<script setup lang="ts">
import { useRoute } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'

const route = useRoute()
</script>

<template>
  <section class="nao-encontrado" aria-labelledby="titulo-404">
    <div class="placa">
      <div class="hazard-stripe" aria-hidden="true" />
      <div class="placa__corpo">
        <p class="placa__codigo mono" aria-hidden="true">404</p>
        <h1 id="titulo-404">Esta prateleira está vazia</h1>
        <p class="muted">
          Não encontramos nada em <code class="mono">{{ route.fullPath }}</code>. A página pode ter sido movida ou o
          endereço está incorreto.
        </p>
        <div class="placa__acoes">
          <BaseButton variante="primario" icone="painel" para="/">Ir para o painel</BaseButton>
          <BaseButton icone="wrench" para="/ferramentas">Ver ferramentas</BaseButton>
        </div>
      </div>
      <div class="hazard-stripe" aria-hidden="true" />
    </div>
  </section>
</template>

<style scoped>
.nao-encontrado {
  display: grid;
  place-items: center;
  min-height: 55vh;
}

.placa {
  width: min(560px, 100%);
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 6px 6px 0 var(--color-ink);
  overflow: hidden;
  text-align: center;
}

.placa__corpo {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-6);
}

.placa__codigo {
  font-size: clamp(4rem, 3rem + 6vw, 6.5rem);
  font-weight: 600;
  line-height: 1;
  color: var(--color-ink);
  -webkit-text-stroke: 2px var(--color-ink);
  text-shadow: 4px 4px 0 var(--color-primary);
}

h1 {
  font-size: var(--text-2xl);
  font-stretch: 75%;
  text-transform: uppercase;
}

code {
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
  word-break: break-all;
}

.placa__acoes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
</style>
