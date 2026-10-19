<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    total: number
    disponivel: number
    emprestadas: number
    emManutencao: number
    minimo: number
    /** Exibe a legenda detalhada abaixo da barra. */
    detalhado?: boolean
  }>(),
  {},
)

const pct = (valor: number) => (props.total > 0 ? `${Math.min(100, (valor / props.total) * 100)}%` : '0%')

const abaixo = computed(() => props.disponivel < props.minimo)
const descricao = computed(
  () =>
    `${props.disponivel} de ${props.total} disponíveis; ${props.emprestadas} emprestadas; ` +
    `${props.emManutencao} em manutenção; mínimo ${props.minimo}.`,
)
</script>

<template>
  <div class="estoque" :class="{ 'estoque--alerta': abaixo, 'estoque--detalhado': detalhado }">
    <div class="estoque__numeros" aria-hidden="true">
      <strong>{{ disponivel }}</strong><span>/{{ total }}</span>
    </div>
    <div class="estoque__barra" role="img" :aria-label="descricao">
      <span class="seg seg--disponivel" :style="{ width: pct(disponivel) }" />
      <span class="seg seg--emprestada" :style="{ width: pct(emprestadas) }" />
      <span class="seg seg--manutencao" :style="{ width: pct(emManutencao) }" />
      <span v-if="minimo > 0 && total > 0" class="estoque__minimo" :style="{ left: pct(minimo) }" title="Estoque mínimo" />
    </div>
    <ul v-if="detalhado" class="estoque__legenda">
      <li><i class="seg--disponivel" aria-hidden="true" /> Disponíveis: <strong>{{ disponivel }}</strong></li>
      <li><i class="seg--emprestada" aria-hidden="true" /> Emprestadas: <strong>{{ emprestadas }}</strong></li>
      <li><i class="seg--manutencao" aria-hidden="true" /> Em manutenção: <strong>{{ emManutencao }}</strong></li>
      <li><i class="marcador-minimo" aria-hidden="true" /> Mínimo: <strong>{{ minimo }}</strong></li>
    </ul>
  </div>
</template>

<style scoped>
.estoque {
  display: grid;
  grid-template-columns: auto minmax(60px, 1fr);
  align-items: center;
  gap: var(--space-2);
  min-width: 120px;
}

.estoque--detalhado {
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
}

.estoque__numeros {
  font-variant-numeric: tabular-nums;
  font-size: var(--text-sm);
  white-space: nowrap;
}

.estoque__numeros span {
  color: var(--color-text-soft);
}

.estoque--alerta .estoque__numeros strong {
  color: var(--color-danger);
}

.estoque__barra {
  position: relative;
  display: flex;
  height: 8px;
  border-radius: 999px;
  background: var(--color-surface-3);
  overflow: visible;
}

.estoque--detalhado .estoque__barra {
  height: 14px;
}

.seg {
  height: 100%;
  transition: width 500ms var(--ease-out);
}

.seg:first-child {
  border-radius: 999px 0 0 999px;
}

.seg--disponivel {
  background: var(--color-success);
}

.estoque--alerta .seg--disponivel {
  background: var(--color-danger);
}

.seg--emprestada {
  background: var(--color-info);
}

.seg--manutencao {
  background: var(--color-primary);
}

.estoque__minimo,
.marcador-minimo {
  width: 2px;
  background: var(--color-ink);
}

.estoque__minimo {
  position: absolute;
  top: -3px;
  bottom: -3px;
}

.estoque__legenda {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.estoque__legenda li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.estoque__legenda strong {
  color: var(--color-text);
}

.estoque__legenda i {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.estoque__legenda i.marcador-minimo {
  width: 3px;
  height: 14px;
  border-radius: 0;
}
</style>
