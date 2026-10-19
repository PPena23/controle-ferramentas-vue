<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useEmprestimosStore } from '@/stores/emprestimos'
import AppIcon from '@/components/base/AppIcon.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const route = useRoute()
const emprestimos = useEmprestimosStore()

const links = [
  { para: '/', rotulo: 'Painel', icone: 'painel' },
  { para: '/ferramentas', rotulo: 'Ferramentas', icone: 'wrench' },
  { para: '/emprestimos', rotulo: 'Empréstimos', icone: 'troca' },
  { para: '/historico', rotulo: 'Histórico', icone: 'historico' },
] as const

const totalAtrasados = computed(() => emprestimos.atrasados.length)

function pularParaConteudo() {
  document.getElementById('conteudo')?.focus()
}

// "/ferramentas/nova" e "/ferramentas/:id" também acendem o item "Ferramentas".
function estaAtivo(caminho: string): boolean {
  return caminho === '/' ? route.path === '/' : route.path.startsWith(caminho)
}
</script>

<template>
  <!-- Com hash history, um href="#..." viraria navegação de rota; por isso o foco é movido via script. -->
  <a href="#conteudo" class="pular-link" @click.prevent="pularParaConteudo">Pular para o conteúdo</a>

  <header class="topo">
    <div class="container topo__barra">
      <RouterLink to="/" class="marca" aria-label="Almoxarifado de Ferramentas — ir para o painel">
        <span class="marca__selo" aria-hidden="true"><AppIcon nome="wrench" :tamanho="20" :espessura="2.4" /></span>
        <span class="marca__texto">
          <strong>Almoxarifado</strong>
          <small>de ferramentas</small>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="Navegação principal">
        <RouterLink
          v-for="link in links"
          :key="link.para"
          :to="link.para"
          class="nav__link"
          :class="{ 'is-ativo': estaAtivo(link.para) }"
          :aria-current="estaAtivo(link.para) ? 'page' : undefined"
        >
          {{ link.rotulo }}
          <span v-if="link.para === '/emprestimos' && totalAtrasados" class="nav__contador">
            {{ totalAtrasados }}<span class="sr-only"> atrasado(s)</span>
          </span>
        </RouterLink>
      </nav>

      <div class="topo__acoes">
        <BaseButton variante="primario" icone="log-out" :para="{ path: '/emprestimos', query: { nova: '1' } }">
          Nova retirada
        </BaseButton>
      </div>
    </div>
    <div class="hazard-stripe" aria-hidden="true" />
  </header>

  <!-- Navegação inferior no mobile: alvos de toque grandes e sempre ao alcance do polegar -->
  <nav class="nav-inferior" aria-label="Navegação principal (mobile)">
    <RouterLink
      v-for="link in links"
      :key="link.para"
      :to="link.para"
      class="nav-inferior__link"
      :class="{ 'is-ativo': estaAtivo(link.para) }"
      :aria-current="estaAtivo(link.para) ? 'page' : undefined"
    >
      <span class="nav-inferior__icone">
        <AppIcon :nome="link.icone" :tamanho="22" />
        <span v-if="link.para === '/emprestimos' && totalAtrasados" class="nav-inferior__ponto">
          {{ totalAtrasados }}<span class="sr-only"> atrasado(s)</span>
        </span>
      </span>
      {{ link.rotulo }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.pular-link {
  position: absolute;
  left: var(--space-4);
  top: -100px;
  z-index: 300;
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary);
  color: var(--color-ink);
  font-weight: 700;
  border: 2px solid var(--color-ink);
  border-radius: var(--radius-md);
}

.pular-link:focus {
  top: var(--space-2);
}

.topo {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--color-ink);
  color: #f3f1ea;
}

.topo__barra {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  height: var(--header-height);
}

.marca {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  margin-right: auto;
}

.marca__selo {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-ink);
  transition: transform var(--duration-base) var(--ease-out);
}

.marca:hover .marca__selo {
  transform: rotate(-12deg);
}

.marca__texto {
  display: flex;
  flex-direction: column;
  line-height: 1;
}

.marca__texto strong {
  font-family: var(--font-display);
  font-stretch: 70%;
  font-weight: 900;
  font-size: 1.35rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.marca__texto small {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.nav {
  display: none;
  align-items: stretch;
  height: 100%;
  gap: var(--space-1);
}

.nav__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-3);
  color: #c9c6bd;
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
  transition: color var(--duration-fast);
}

/* Indicador da rota ativa: barra amarela que "desliza" para cima */
.nav__link::after {
  content: '';
  position: absolute;
  left: var(--space-3);
  right: var(--space-3);
  bottom: 0;
  height: 4px;
  background: var(--color-primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--duration-base) var(--ease-out);
}

.nav__link:hover {
  color: #fff;
}

.nav__link.is-ativo {
  color: #fff;
}

.nav__link.is-ativo::after {
  transform: scaleX(1);
}

.nav__link:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-primary);
}

.nav__contador {
  min-width: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

/* Botão primário sobre fundo escuro: sombra amarela no lugar da preta */
.topo__acoes :deep(.btn--primario) {
  box-shadow: 3px 3px 0 #f3f1ea;
}

/* Telas estreitas: o atalho vira só ícone (o texto continua acessível a leitores de tela) */
@media (max-width: 479px) {
  .topo__barra {
    gap: var(--space-3);
  }
  .topo__acoes :deep(.btn) {
    width: 44px;
    padding: 0;
  }
  .topo__acoes :deep(.btn > span) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
}

.marca:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* ---------- Navegação inferior (mobile) ---------- */
.nav-inferior {
  position: fixed;
  inset: auto 0 0;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: var(--bottom-nav-height);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-ink);
  border-top: 3px solid var(--color-primary);
}

.nav-inferior__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #a9a69d;
  font-size: 0.7rem;
  font-weight: 600;
  text-decoration: none;
  transition: color var(--duration-fast);
}

.nav-inferior__link.is-ativo {
  color: var(--color-primary);
}

.nav-inferior__link:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-primary);
  border-radius: 0;
}

.nav-inferior__icone {
  position: relative;
}

.nav-inferior__ponto {
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}

@media (min-width: 900px) {
  .nav {
    display: flex;
  }
  .nav-inferior {
    display: none;
  }
}
</style>
