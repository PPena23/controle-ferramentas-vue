<script setup lang="ts" generic="T extends { id: string }">
// Tabela genérica e tipada: o tipo da linha (T) é inferido a partir de `linhas`,
// então os slots `celula-<chave>` recebem `linha` já com o tipo correto.
import { computed } from 'vue'
import type { ColunaTabela, Ordenacao } from '@/types'
import AppIcon from './AppIcon.vue'
import SkeletonBlock from './SkeletonBlock.vue'

const props = withDefaults(
  defineProps<{
    colunas: ColunaTabela<T>[]
    linhas: T[]
    /** Descrição da tabela para leitores de tela. */
    legenda: string
    ordenacao?: Ordenacao
    carregando?: boolean
    linhasSkeleton?: number
  }>(),
  { linhasSkeleton: 6 },
)

const emit = defineEmits<{ 'update:ordenacao': [valor: Ordenacao] }>()

const comparador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

function valorDaCelula(linha: T, coluna: ColunaTabela<T>): string | number {
  if (coluna.valor) return coluna.valor(linha)
  const bruto = (linha as Record<string, unknown>)[coluna.chave]
  return typeof bruto === 'number' ? bruto : String(bruto ?? '')
}

const linhasOrdenadas = computed(() => {
  const ordem = props.ordenacao
  const coluna = props.colunas.find((c) => c.chave === ordem?.coluna)
  if (!ordem || !coluna) return props.linhas
  const fator = ordem.direcao === 'asc' ? 1 : -1
  return [...props.linhas].sort((a, b) => {
    const va = valorDaCelula(a, coluna)
    const vb = valorDaCelula(b, coluna)
    const resultado = typeof va === 'number' && typeof vb === 'number' ? va - vb : comparador.compare(String(va), String(vb))
    return resultado * fator
  })
})

function ordenarPor(coluna: ColunaTabela<T>) {
  const atual = props.ordenacao
  const direcao = atual?.coluna === coluna.chave && atual.direcao === 'asc' ? 'desc' : 'asc'
  emit('update:ordenacao', { coluna: coluna.chave, direcao })
}

function ariaSort(coluna: ColunaTabela<T>) {
  if (!coluna.ordenavel) return undefined
  if (props.ordenacao?.coluna !== coluna.chave) return 'none'
  return props.ordenacao.direcao === 'asc' ? 'ascending' : 'descending'
}
</script>

<template>
  <div class="tabela-wrapper" :aria-busy="carregando || undefined">
    <table class="tabela">
      <caption class="sr-only">{{ legenda }}</caption>
      <thead>
        <tr>
          <th
            v-for="coluna in colunas"
            :key="coluna.chave"
            scope="col"
            :aria-sort="ariaSort(coluna)"
            :class="[`alinhar-${coluna.alinhamento ?? 'inicio'}`]"
          >
            <button
              v-if="coluna.ordenavel"
              type="button"
              class="tabela__ordenar"
              :class="{ 'is-ativo': ordenacao?.coluna === coluna.chave }"
              @click="ordenarPor(coluna)"
            >
              {{ coluna.rotulo }}
              <AppIcon
                :nome="ordenacao?.coluna === coluna.chave && ordenacao.direcao === 'desc' ? 'chevron-down' : 'chevron-up'"
                :tamanho="14"
              />
            </button>
            <template v-else>{{ coluna.rotulo }}</template>
          </th>
        </tr>
      </thead>

      <tbody v-if="carregando">
        <tr v-for="n in linhasSkeleton" :key="`sk-${n}`" class="tabela__linha">
          <td v-for="coluna in colunas" :key="coluna.chave" :class="{ 'ocultar-mobile': coluna.ocultarNoMobile }">
            <SkeletonBlock :largura="coluna.chave === 'acoes' ? '64px' : `${55 + ((n * 17) % 40)}%`" />
          </td>
        </tr>
      </tbody>

      <TransitionGroup v-else-if="linhasOrdenadas.length" tag="tbody" name="lista">
        <tr v-for="linha in linhasOrdenadas" :key="linha.id" class="tabela__linha">
          <td
            v-for="coluna in colunas"
            :key="coluna.chave"
            :data-rotulo="coluna.rotulo"
            :class="[
              `alinhar-${coluna.alinhamento ?? 'inicio'}`,
              { 'ocultar-mobile': coluna.ocultarNoMobile, 'celula-acoes': coluna.chave === 'acoes' },
            ]"
          >
            <slot :name="`celula-${coluna.chave}`" :linha="linha">
              {{ valorDaCelula(linha, coluna) }}
            </slot>
          </td>
        </tr>
      </TransitionGroup>
    </table>

    <div v-if="!carregando && linhasOrdenadas.length === 0" class="tabela__vazio">
      <slot name="vazio" />
    </div>
  </div>
</template>

<style scoped>
.tabela-wrapper {
  width: 100%;
  overflow-x: auto;
}

.tabela {
  width: 100%;
  font-size: var(--text-sm);
}

thead th {
  position: sticky;
  top: 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-2);
  border-bottom: 1.5px solid var(--color-ink);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}

.tabela__ordenar {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}

.tabela__ordenar :deep(svg) {
  opacity: 0.35;
  transition: opacity var(--duration-fast);
}

.tabela__ordenar:hover,
.tabela__ordenar.is-ativo {
  color: var(--color-ink);
}

.tabela__ordenar:hover :deep(svg),
.tabela__ordenar.is-ativo :deep(svg) {
  opacity: 1;
}

td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.tabela__linha {
  transition: background-color var(--duration-fast);
}

.tabela__linha:hover {
  background: #fbfaf6;
}

.alinhar-fim {
  text-align: right;
}

.alinhar-centro {
  text-align: center;
}

.celula-acoes {
  white-space: nowrap;
}

.tabela__vazio {
  border-bottom: 1px solid var(--color-border);
}

/* ---------- Mobile: cada linha vira um cartão ---------- */
@media (max-width: 767px) {
  .tabela thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }

  .tabela,
  .tabela tbody {
    display: block;
  }

  .tabela__linha {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2) var(--space-4);
    padding: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .tabela__linha td {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 0;
    border: 0;
    text-align: left;
    min-width: 0;
  }

  /* O rótulo da coluna aparece acima do valor */
  .tabela__linha td[data-rotulo]::before {
    content: attr(data-rotulo);
    font-family: var(--font-mono);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-soft);
  }

  .tabela__linha td {
    align-items: flex-start;
  }

  /* As duas primeiras colunas (identificação) ocupam a linha inteira e dispensam rótulo */
  .tabela__linha td:first-child,
  .tabela__linha td:nth-child(2),
  .tabela__linha .celula-acoes {
    grid-column: 1 / -1;
  }

  .tabela__linha td:first-child::before,
  .tabela__linha td:nth-child(2)::before,
  .tabela__linha .celula-acoes::before {
    display: none;
  }

  .tabela__linha .celula-acoes {
    align-items: stretch;
  }

  .ocultar-mobile {
    display: none !important;
  }
}
</style>
