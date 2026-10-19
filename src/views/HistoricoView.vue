<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { Movimentacao, TipoMovimentacao } from '@/types'
import { useHistoricoStore } from '@/stores/historico'
import { useEstoqueStore } from '@/stores/estoque'
import { useFilters } from '@/composables/useFilters'
import { useDebounce } from '@/composables/useDebounce'
import { useDados } from '@/composables/useDados'
import { formatarDiaExtenso, formatarHora, hojeISO, paraDataISO, somarDias } from '@/utils/datas'
import { normalizar, plural } from '@/utils/formatadores'
import { META_MOVIMENTACAO } from '@/utils/estoque'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const POR_PAGINA = 30

const historico = useHistoricoStore()
const estoque = useEstoqueStore()
const { carregandoInicial, carregando, erro, carregarTudo } = useDados()

const { filtros, quantidadeAtivos, limpar } = useFilters({ tipos: '', periodo: '', busca: '' })
const buscaAtrasada = useDebounce(toRef(filtros, 'busca'), 200)

const TIPOS = Object.keys(META_MOVIMENTACAO) as TipoMovimentacao[]

// "tipos" é guardado na URL como lista separada por vírgula (?tipos=retirada,devolucao).
const tiposSelecionados = computed(() => new Set(filtros.tipos.split(',').filter(Boolean)))

function alternarTipo(tipo: TipoMovimentacao) {
  const novos = new Set(tiposSelecionados.value)
  if (novos.has(tipo)) novos.delete(tipo)
  else novos.add(tipo)
  filtros.tipos = [...novos].join(',')
}

const opcoesPeriodo = [
  { valor: '7', rotulo: 'Últimos 7 dias' },
  { valor: '30', rotulo: 'Últimos 30 dias' },
  { valor: '90', rotulo: 'Últimos 90 dias' },
]

const contagemPorTipo = computed(() => {
  const contagem = Object.fromEntries(TIPOS.map((t) => [t, 0])) as Record<TipoMovimentacao, number>
  historico.itens.forEach((m) => contagem[m.tipo]++)
  return contagem
})

const filtradas = computed(() => {
  const termo = normalizar(buscaAtrasada.value)
  const desde = filtros.periodo ? paraDataISO(somarDias(new Date(), -Number(filtros.periodo))) : ''
  return historico.ordenadas.filter((m) => {
    if (tiposSelecionados.value.size && !tiposSelecionados.value.has(m.tipo)) return false
    if (desde && paraDataISO(new Date(m.data)) < desde) return false
    if (termo && !normalizar(`${m.ferramentaCodigo} ${m.ferramentaNome} ${m.descricao}`).includes(termo)) return false
    return true
  })
})

// Paginação incremental ("carregar mais"): o watch zera a página quando qualquer filtro muda.
const limite = ref(POR_PAGINA)
watch([() => filtros.tipos, () => filtros.periodo, buscaAtrasada], () => (limite.value = POR_PAGINA))

const visiveis = computed(() => filtradas.value.slice(0, limite.value))

/** Agrupa as movimentações visíveis por dia, preservando a ordem (mais recentes primeiro). */
const grupos = computed(() => {
  const mapa = new Map<string, Movimentacao[]>()
  for (const m of visiveis.value) {
    const dia = paraDataISO(new Date(m.data))
    if (!mapa.has(dia)) mapa.set(dia, [])
    mapa.get(dia)!.push(m)
  }
  return [...mapa.entries()].map(([dia, itens]) => ({ dia, itens }))
})

const hoje = hojeISO()
const ontem = paraDataISO(somarDias(new Date(), -1))

function rotuloDia(dia: string): string {
  if (dia === hoje) return 'Hoje'
  if (dia === ontem) return 'Ontem'
  return formatarDiaExtenso(dia)
}

const ferramentaExiste = (id: string) => estoque.porId.has(id)
</script>

<template>
  <div>
    <PageHeader
      rotulo-superior="Rastreabilidade"
      titulo="Histórico"
      subtitulo="Linha do tempo de cadastros, retiradas, devoluções e manutenções."
    />

    <ErrorState v-if="erro" class="erro" :mensagem="erro" :carregando="carregando" @tentar-novamente="carregarTudo" />

    <div class="layout">
      <aside class="card filtros" aria-label="Filtros do histórico">
        <div class="filtros__bloco">
          <p class="eyebrow">Tipo de movimentação</p>
          <div class="chips">
            <button
              v-for="tipo in TIPOS"
              :key="tipo"
              type="button"
              class="chip"
              :class="[`chip--${META_MOVIMENTACAO[tipo].tom}`, { 'is-ativo': tiposSelecionados.has(tipo) }]"
              :aria-pressed="tiposSelecionados.has(tipo)"
              @click="alternarTipo(tipo)"
            >
              <AppIcon :nome="META_MOVIMENTACAO[tipo].icone" :tamanho="14" />
              {{ META_MOVIMENTACAO[tipo].rotulo }}
              <span class="chip__total">{{ contagemPorTipo[tipo] }}</span>
            </button>
          </div>
        </div>
        <BaseSelect v-model="filtros.periodo" rotulo="Período" placeholder="Todo o período" :opcoes="opcoesPeriodo" />
        <BaseInput v-model="filtros.busca" tipo="search" rotulo="Buscar" placeholder="Ferramenta ou descrição…" />
        <BaseButton v-if="quantidadeAtivos" variante="fantasma" icone="x" tamanho="sm" @click="limpar">
          Limpar filtros
        </BaseButton>
      </aside>

      <section class="card linha-tempo" aria-labelledby="titulo-linha">
        <header class="card__header">
          <h2 id="titulo-linha" class="card__title"><AppIcon nome="historico" /> Movimentações</h2>
          <span class="muted contagem" aria-live="polite">{{ plural(filtradas.length, 'registro') }}</span>
        </header>

        <div v-if="carregandoInicial" class="card__body esqueleto" aria-hidden="true">
          <div v-for="n in 6" :key="n" class="esqueleto__item">
            <SkeletonBlock largura="32px" altura="32px" raio="50%" />
            <div class="esqueleto__texto"><SkeletonBlock largura="40%" /><SkeletonBlock largura="75%" altura="0.8rem" /></div>
          </div>
        </div>

        <EmptyState
          v-else-if="filtradas.length === 0"
          icone="historico"
          titulo="Nenhuma movimentação"
          :descricao="quantidadeAtivos ? 'Nada corresponde aos filtros escolhidos.' : 'As movimentações aparecem aqui conforme o estoque é usado.'"
        >
          <BaseButton v-if="quantidadeAtivos" icone="x" @click="limpar">Limpar filtros</BaseButton>
        </EmptyState>

        <div v-else class="card__body">
          <section v-for="grupo in grupos" :key="grupo.dia" class="dia" :aria-label="rotuloDia(grupo.dia)">
            <h3 class="dia__titulo">{{ rotuloDia(grupo.dia) }}</h3>
            <ol class="eventos">
              <li v-for="m in grupo.itens" :key="m.id" class="evento" :class="`evento--${META_MOVIMENTACAO[m.tipo].tom}`">
                <span class="evento__marcador" aria-hidden="true">
                  <AppIcon :nome="META_MOVIMENTACAO[m.tipo].icone" :tamanho="14" :espessura="2.4" />
                </span>
                <div class="evento__conteudo">
                  <p class="evento__topo">
                    <span class="evento__tipo">{{ META_MOVIMENTACAO[m.tipo].rotulo }}</span>
                    <RouterLink v-if="ferramentaExiste(m.ferramentaId)" :to="`/ferramentas/${m.ferramentaId}`" class="link">
                      {{ m.ferramentaNome }}
                    </RouterLink>
                    <span v-else>{{ m.ferramentaNome }}</span>
                    <span class="mono muted evento__codigo">{{ m.ferramentaCodigo }}</span>
                  </p>
                  <p class="evento__descricao">{{ m.descricao }}</p>
                  <p class="evento__meta">
                    <time :datetime="m.data">{{ formatarHora(m.data) }}</time> · {{ m.responsavel }}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <div v-if="filtradas.length > limite" class="mais">
            <BaseButton icone="chevron-down" @click="limite += POR_PAGINA">
              Carregar mais ({{ filtradas.length - limite }} restantes)
            </BaseButton>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.erro {
  margin-bottom: var(--space-5);
}

.layout {
  display: grid;
  gap: var(--space-5);
  align-items: start;
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: 300px minmax(0, 1fr);
  }
  .filtros {
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
  }
}

.filtros {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
}

.filtros__bloco {
  display: grid;
  gap: var(--space-2);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  --chip-cor: var(--color-steel);

  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 var(--space-3);
  border: 1.5px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  font-size: var(--text-xs);
  font-weight: 600;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast);
}

.chip :deep(svg) {
  color: var(--chip-cor);
}

.chip:hover {
  border-color: var(--color-ink);
}

.chip.is-ativo {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: #fff;
}

.chip.is-ativo :deep(svg) {
  color: var(--color-primary);
}

.chip__total {
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

.chip--primary {
  --chip-cor: var(--color-primary-strong);
}
.chip--info {
  --chip-cor: var(--color-info);
}
.chip--success {
  --chip-cor: var(--color-success);
}
.chip--warning {
  --chip-cor: var(--color-warning);
}
.chip--danger {
  --chip-cor: var(--color-danger);
}

.contagem {
  font-size: var(--text-sm);
}

/* ---------- Linha do tempo ---------- */
.dia + .dia {
  margin-top: var(--space-6);
}

.dia__titulo {
  position: sticky;
  top: calc(var(--header-height) + 6px); /* + faixa zebrada */
  z-index: 1;
  margin-bottom: var(--space-3);
  padding: var(--space-2) 0;
  background: var(--color-surface);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.eventos {
  position: relative;
  padding: 0;
  list-style: none;
}

/* Trilho vertical */
.eventos::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: repeating-linear-gradient(to bottom, var(--color-border-strong) 0 6px, transparent 6px 10px);
}

.evento {
  --evento-cor: var(--color-steel);
  --evento-fundo: var(--color-steel-soft);

  position: relative;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
}

.evento--primary {
  --evento-cor: var(--color-ink);
  --evento-fundo: var(--color-primary);
}
.evento--info {
  --evento-cor: var(--color-info);
  --evento-fundo: var(--color-info-soft);
}
.evento--success {
  --evento-cor: var(--color-success);
  --evento-fundo: var(--color-success-soft);
}
.evento--warning {
  --evento-cor: var(--color-warning);
  --evento-fundo: var(--color-warning-soft);
}
.evento--danger {
  --evento-cor: var(--color-danger);
  --evento-fundo: var(--color-danger-soft);
}

.evento__marcador {
  position: relative;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--evento-fundo);
  color: var(--evento-cor);
  box-shadow: 0 0 0 1px var(--color-border);
}

.evento__conteudo {
  min-width: 0;
  padding-top: 4px;
}

.evento__topo {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1) var(--space-2);
  font-size: var(--text-sm);
}

.evento__tipo {
  font-weight: 700;
  color: var(--evento-cor);
}

.evento--primary .evento__tipo {
  color: var(--color-ink);
}

.evento__codigo {
  font-size: var(--text-xs);
}

.evento__descricao {
  font-size: var(--text-sm);
}

.evento__meta {
  font-size: var(--text-xs);
  color: var(--color-text-soft);
}

.mais {
  display: flex;
  justify-content: center;
  padding-top: var(--space-4);
}

.esqueleto {
  display: grid;
  gap: var(--space-5);
}

.esqueleto__item {
  display: flex;
  gap: var(--space-3);
}

.esqueleto__texto {
  flex: 1;
  display: grid;
  gap: var(--space-2);
}
</style>
