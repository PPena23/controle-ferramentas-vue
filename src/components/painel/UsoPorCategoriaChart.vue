<script setup lang="ts">
import { computed } from 'vue'
import type { ItemGrafico } from '@/types'

const props = defineProps<{ itens: ItemGrafico[]; rotuloValor: string; rotuloDestaque: string }>()

const maximo = computed(() => Math.max(1, ...props.itens.map((i) => i.valor)))
const pct = (valor: number) => `${(valor / maximo.value) * 100}%`
</script>

<template>
  <figure class="grafico">
    <!-- Gráfico de barras feito só com CSS Grid + custom properties, sem biblioteca -->
    <ul class="grafico__lista">
      <li v-for="(item, indice) in itens" :key="item.rotulo" class="grafico__linha">
        <span class="grafico__rotulo">{{ item.rotulo }}</span>
        <span class="grafico__trilho" aria-hidden="true">
          <span class="grafico__barra" :style="{ width: pct(item.valor), animationDelay: `${indice * 60}ms` }">
            <span v-if="item.destaque > 0" class="grafico__barra-destaque" :style="{ width: `${(item.destaque / item.valor) * 100}%` }" />
          </span>
        </span>
        <span class="grafico__valor">
          {{ item.valor }}
          <span class="sr-only">{{ rotuloValor }}, {{ item.destaque }} {{ rotuloDestaque }}</span>
        </span>
      </li>
    </ul>
    <figcaption class="grafico__legenda">
      <span><i class="legenda legenda--total" aria-hidden="true" /> {{ rotuloValor }}</span>
      <span><i class="legenda legenda--destaque" aria-hidden="true" /> {{ rotuloDestaque }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.grafico__lista {
  display: grid;
  gap: var(--space-3);
  padding: 0;
  list-style: none;
}

.grafico__linha {
  display: grid;
  grid-template-columns: minmax(84px, 120px) 1fr 2.5ch;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.grafico__rotulo {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-muted);
}

.grafico__trilho {
  height: 18px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
  overflow: hidden;
}

.grafico__barra {
  position: relative;
  display: block;
  height: 100%;
  background: var(--color-steel);
  border-radius: var(--radius-sm);
  transform-origin: left;
  animation: crescer 700ms var(--ease-out) both;
  transition: width 500ms var(--ease-out);
}

.grafico__barra-destaque {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--color-primary);
  border-right: 2px solid var(--color-ink);
  transition: width 500ms var(--ease-out);
}

.grafico__valor {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.grafico__legenda {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-4);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.grafico__legenda span {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.legenda {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legenda--total {
  background: var(--color-steel);
}

.legenda--destaque {
  background: var(--color-primary);
  border: 1.5px solid var(--color-ink);
}

@keyframes crescer {
  from {
    transform: scaleX(0);
  }
}
</style>
