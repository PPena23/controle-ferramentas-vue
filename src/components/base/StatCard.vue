<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import type { Tom } from '@/types'
import { formatarNumero } from '@/utils/formatadores'
import AppIcon from './AppIcon.vue'
import SkeletonBlock from './SkeletonBlock.vue'

const props = withDefaults(
  defineProps<{
    rotulo: string
    valor: number
    icone: string
    tom?: Tom
    detalhe?: string
    para?: RouteLocationRaw
    carregando?: boolean
    /** Destaca o cartão quando o número pede atenção (ex.: atrasos > 0). */
    alerta?: boolean
  }>(),
  { tom: 'neutral' },
)

// Animação de contagem: o watch reage a cada novo valor e interpola até ele.
const valorExibido = ref(0)
let quadro = 0

watch(
  () => props.valor,
  (destino, origem = 0) => {
    cancelAnimationFrame(quadro)
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduzirMovimento) {
      valorExibido.value = destino
      return
    }
    const inicio = performance.now()
    const duracao = 600
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao)
      const suavizado = 1 - Math.pow(1 - t, 3)
      valorExibido.value = Math.round(origem + (destino - origem) * suavizado)
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
  },
  { immediate: true },
)

onBeforeUnmount(() => cancelAnimationFrame(quadro))
</script>

<template>
  <component
    :is="para ? RouterLink : 'article'"
    :to="para"
    class="stat"
    :class="[`stat--${tom}`, { 'stat--alerta': alerta, 'stat--link': para }]"
  >
    <div class="stat__topo">
      <span class="stat__rotulo">{{ rotulo }}</span>
      <span class="stat__icone" aria-hidden="true"><AppIcon :nome="icone" :tamanho="18" /></span>
    </div>
    <SkeletonBlock v-if="carregando" largura="60%" altura="2.4rem" />
    <p v-else class="stat__valor">
      <span aria-hidden="true">{{ formatarNumero(valorExibido) }}</span>
      <span class="sr-only">{{ formatarNumero(valor) }}</span>
    </p>
    <p v-if="detalhe" class="stat__detalhe">{{ detalhe }}</p>
  </component>
</template>

<style scoped>
.stat {
  --stat-accent: var(--color-steel);

  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  transition:
    border-color var(--duration-fast),
    transform var(--duration-base) var(--ease-out),
    box-shadow var(--duration-base) var(--ease-out);
}

/* Filete colorido no topo identifica o tipo do indicador */
.stat::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  background: var(--stat-accent);
}

.stat--link:hover {
  border-color: var(--color-ink);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat--primary {
  --stat-accent: var(--color-primary);
}
.stat--success {
  --stat-accent: var(--color-success);
}
.stat--info {
  --stat-accent: var(--color-info);
}
.stat--warning {
  --stat-accent: var(--color-warning);
}
.stat--danger {
  --stat-accent: var(--color-danger);
}

.stat--alerta::before {
  height: 6px;
  background: var(--hazard);
}

.stat__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.stat__rotulo {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}

.stat__icone {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--stat-accent) 14%, transparent);
  color: var(--stat-accent);
}

.stat--primary .stat__icone {
  color: var(--color-ink);
  background: var(--color-primary-soft);
}

.stat__valor {
  font-family: var(--font-display);
  font-stretch: 75%;
  font-weight: 800;
  font-size: var(--text-3xl);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat__detalhe {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
