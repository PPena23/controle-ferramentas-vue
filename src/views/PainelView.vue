<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CATEGORIAS, type ItemGrafico } from '@/types'
import { useFerramentasStore } from '@/stores/ferramentas'
import { useEstoqueStore } from '@/stores/estoque'
import { useEmprestimosStore } from '@/stores/emprestimos'
import { useHistoricoStore } from '@/stores/historico'
import { useDados } from '@/composables/useDados'
import { formatarData, formatarDiaExtenso, formatarRelativo } from '@/utils/datas'
import { formatarMoeda, plural } from '@/utils/formatadores'
import { META_MOVIMENTACAO } from '@/utils/estoque'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatCard from '@/components/base/StatCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import Badge from '@/components/base/Badge.vue'
import StatusEmprestimoBadge from '@/components/emprestimos/StatusEmprestimoBadge.vue'
import EstoqueBarra from '@/components/ferramentas/EstoqueBarra.vue'
import UsoPorCategoriaChart from '@/components/painel/UsoPorCategoriaChart.vue'

const ferramentas = useFerramentasStore()
const estoque = useEstoqueStore()
const emprestimos = useEmprestimosStore()
const historico = useHistoricoStore()
const { carregandoInicial, carregando, erro, carregarTudo } = useDados()

const hoje = formatarDiaExtenso(new Date())

const percentualDisponivel = computed(() => {
  const { unidades, disponiveis } = estoque.totais
  return unidades ? Math.round((disponiveis / unidades) * 100) : 0
})

// Agrega os empréstimos por categoria da ferramenta: total já retirado × em uso agora.
const usoPorCategoria = computed<ItemGrafico[]>(() => {
  const mapa = new Map<string, ItemGrafico>(CATEGORIAS.map((c) => [c, { rotulo: c, valor: 0, destaque: 0 }]))
  for (const e of emprestimos.detalhados) {
    const item = e.ferramenta && mapa.get(e.ferramenta.categoria)
    if (!item) continue
    item.valor += e.quantidade
    if (e.status !== 'devolvido') item.destaque += e.quantidade
  }
  return [...mapa.values()].sort((a, b) => b.valor - a.valor)
})

const ultimasMovimentacoes = computed(() => historico.ordenadas.slice(0, 6))

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}
</script>

<template>
  <div class="painel">
    <PageHeader
      :rotulo-superior="hoje"
      titulo="Painel do almoxarifado"
      subtitulo="Situação do estoque, empréstimos que pedem atenção e o uso das ferramentas por categoria."
    >
      <template #acoes>
        <BaseButton icone="plus" para="/ferramentas/nova">Cadastrar ferramenta</BaseButton>
        <BaseButton variante="primario" icone="log-out" :para="{ path: '/emprestimos', query: { nova: '1' } }">
          Nova retirada
        </BaseButton>
      </template>
    </PageHeader>

    <ErrorState v-if="erro" class="painel__erro" :mensagem="erro" :carregando="carregando" @tentar-novamente="carregarTudo" />

    <!-- KPIs -->
    <section class="kpis" aria-label="Indicadores do almoxarifado">
      <StatCard
        rotulo="Ferramentas cadastradas"
        :valor="ferramentas.itens.length"
        icone="wrench"
        tom="primary"
        :detalhe="`${plural(estoque.totais.unidades, 'unidade')} · ${formatarMoeda(estoque.totais.valorPatrimonio)}`"
        para="/ferramentas"
        :carregando="carregandoInicial"
      />
      <StatCard
        rotulo="Unidades disponíveis"
        :valor="estoque.totais.disponiveis"
        icone="check-circle"
        tom="success"
        :detalhe="`${percentualDisponivel}% do estoque ativo`"
        :carregando="carregandoInicial"
      />
      <StatCard
        rotulo="Unidades emprestadas"
        :valor="estoque.totais.emprestadas"
        icone="troca"
        tom="info"
        :detalhe="`${plural(emprestimos.emAberto.length, 'empréstimo')} em aberto`"
        para="/emprestimos"
        :carregando="carregandoInicial"
      />
      <StatCard
        rotulo="Empréstimos atrasados"
        :valor="emprestimos.atrasados.length"
        icone="clock"
        tom="danger"
        :alerta="emprestimos.atrasados.length > 0"
        :detalhe="emprestimos.atrasados.length ? 'Cobrar devolução' : 'Tudo dentro do prazo'"
        :para="{ path: '/emprestimos', query: { aba: 'atrasados' } }"
        :carregando="carregandoInicial"
      />
      <StatCard
        rotulo="Abaixo do mínimo"
        :valor="estoque.abaixoDoMinimo.length"
        icone="trending-down"
        tom="warning"
        :detalhe="`${plural(estoque.totais.emManutencao, 'unidade')} em manutenção`"
        :para="{ path: '/ferramentas', query: { abaixoDoMinimo: '1' } }"
        :carregando="carregandoInicial"
      />
    </section>

    <div class="painel__grade">
      <!-- Atrasados -->
      <section class="card painel__atrasados" aria-labelledby="titulo-atrasados">
        <header class="card__header">
          <h2 id="titulo-atrasados" class="card__title">
            <AppIcon nome="clock" /> Empréstimos atrasados
            <Badge v-if="emprestimos.atrasados.length" tom="danger" compacto>{{ emprestimos.atrasados.length }}</Badge>
          </h2>
          <RouterLink class="link" :to="{ path: '/emprestimos', query: { aba: 'atrasados' } }">Ver todos</RouterLink>
        </header>

        <ul v-if="carregandoInicial" class="lista" aria-hidden="true">
          <li v-for="n in 3" :key="n" class="lista__item">
            <SkeletonBlock largura="40px" altura="40px" raio="50%" />
            <div class="lista__texto"><SkeletonBlock largura="50%" /><SkeletonBlock largura="70%" altura="0.8rem" /></div>
          </li>
        </ul>
        <EmptyState
          v-else-if="emprestimos.atrasados.length === 0"
          compacto
          icone="check-circle"
          titulo="Nenhum atraso"
          descricao="Todas as ferramentas emprestadas estão dentro do prazo de devolução."
        />
        <TransitionGroup v-else tag="ul" name="lista" class="lista">
          <li v-for="e in emprestimos.atrasados.slice(0, 5)" :key="e.id" class="lista__item">
            <span class="avatar" aria-hidden="true">{{ iniciais(e.colaborador) }}</span>
            <div class="lista__texto">
              <p class="lista__titulo">{{ e.ferramenta?.nome ?? 'Ferramenta removida' }} <span class="muted">× {{ e.quantidade }}</span></p>
              <p class="lista__meta">{{ e.colaborador }} · {{ e.setor }} · previsto {{ formatarData(e.dataPrevista) }}</p>
            </div>
            <div class="lista__acoes">
              <StatusEmprestimoBadge :status="e.status" :dias-atraso="e.diasAtraso" />
              <BaseButton tamanho="sm" icone="undo" :para="{ path: '/emprestimos', query: { devolver: e.id } }">
                Devolver
              </BaseButton>
            </div>
          </li>
        </TransitionGroup>
      </section>

      <!-- Abaixo do mínimo -->
      <section class="card painel__minimo" aria-labelledby="titulo-minimo">
        <header class="card__header">
          <h2 id="titulo-minimo" class="card__title"><AppIcon nome="trending-down" /> Abaixo do mínimo</h2>
          <RouterLink class="link" :to="{ path: '/ferramentas', query: { abaixoDoMinimo: '1' } }">Ver lista</RouterLink>
        </header>
        <ul v-if="carregandoInicial" class="lista" aria-hidden="true">
          <li v-for="n in 4" :key="n" class="lista__item"><SkeletonBlock /></li>
        </ul>
        <EmptyState
          v-else-if="estoque.abaixoDoMinimo.length === 0"
          compacto
          icone="check-circle"
          titulo="Estoque saudável"
          descricao="Nenhuma ferramenta está abaixo do estoque mínimo."
        />
        <ul v-else class="lista">
          <li v-for="f in estoque.abaixoDoMinimo.slice(0, 6)" :key="f.id" class="lista__item lista__item--coluna">
            <RouterLink :to="`/ferramentas/${f.id}`" class="lista__link">
              <span class="mono muted">{{ f.codigo }}</span>
              <span class="lista__titulo">{{ f.nome }}</span>
            </RouterLink>
            <EstoqueBarra
              :total="f.quantidadeTotal"
              :disponivel="f.disponivel"
              :emprestadas="f.emprestadas"
              :em-manutencao="f.emManutencao"
              :minimo="f.estoqueMinimo"
            />
          </li>
        </ul>
      </section>

      <!-- Gráfico -->
      <section class="card painel__grafico" aria-labelledby="titulo-grafico">
        <header class="card__header">
          <h2 id="titulo-grafico" class="card__title"><AppIcon nome="chart" /> Uso por categoria</h2>
        </header>
        <div class="card__body">
          <div v-if="carregandoInicial" class="esqueleto-grafico" aria-hidden="true">
            <SkeletonBlock v-for="n in 6" :key="n" :largura="`${90 - n * 12}%`" altura="18px" />
          </div>
          <UsoPorCategoriaChart
            v-else
            :itens="usoPorCategoria"
            rotulo-valor="Unidades retiradas (total)"
            rotulo-destaque="Em uso agora"
          />
        </div>
      </section>

      <!-- Últimas movimentações -->
      <section class="card painel__movimentos" aria-labelledby="titulo-movimentos">
        <header class="card__header">
          <h2 id="titulo-movimentos" class="card__title"><AppIcon nome="historico" /> Últimas movimentações</h2>
          <RouterLink class="link" to="/historico">Histórico</RouterLink>
        </header>
        <ul v-if="carregandoInicial" class="lista" aria-hidden="true">
          <li v-for="n in 5" :key="n" class="lista__item"><SkeletonBlock /></li>
        </ul>
        <ul v-else class="lista">
          <li v-for="m in ultimasMovimentacoes" :key="m.id" class="lista__item">
            <span class="mov-icone" :class="`mov-icone--${META_MOVIMENTACAO[m.tipo].tom}`">
              <AppIcon :nome="META_MOVIMENTACAO[m.tipo].icone" :tamanho="16" :rotulo="META_MOVIMENTACAO[m.tipo].rotulo" />
            </span>
            <div class="lista__texto">
              <p class="lista__titulo">{{ m.ferramentaNome }}</p>
              <p class="lista__meta">{{ m.descricao }}</p>
            </div>
            <time class="lista__tempo" :datetime="m.data">{{ formatarRelativo(m.data) }}</time>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.painel__erro {
  margin-bottom: var(--space-6);
}

/* KPIs: auto-fit distribui de 1 a 5 colunas conforme a largura disponível */
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

@media (max-width: 479px) {
  .kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .kpis > :first-child {
    grid-column: 1 / -1;
  }
}

.painel__grade {
  display: grid;
  gap: var(--space-5);
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'atrasados'
    'minimo'
    'grafico'
    'movimentos';
}

@media (min-width: 1024px) {
  .painel__grade {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    grid-template-areas:
      'atrasados minimo'
      'grafico movimentos';
  }
}

.painel__atrasados {
  grid-area: atrasados;
}
.painel__minimo {
  grid-area: minimo;
}
.painel__grafico {
  grid-area: grafico;
}
.painel__movimentos {
  grid-area: movimentos;
}

.lista {
  padding: 0;
  list-style: none;
}

.lista__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.lista__item:last-child {
  border-bottom: 0;
}

.lista__item--coluna {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);
}

.lista__texto {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lista__titulo {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lista__meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.lista__acoes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

@media (max-width: 599px) {
  .painel__atrasados .lista__item {
    flex-wrap: wrap;
  }
  .painel__atrasados .lista__acoes {
    width: 100%;
    justify-content: space-between;
    padding-left: calc(40px + var(--space-3));
  }
}

.lista__link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  font-size: var(--text-sm);
}

.lista__link:hover .lista__titulo {
  text-decoration: underline;
  text-decoration-color: var(--color-primary);
  text-decoration-thickness: 2px;
}

.lista__tempo {
  font-size: var(--text-xs);
  color: var(--color-text-soft);
  white-space: nowrap;
}

.avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-primary);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
}

.mov-icone {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-steel-soft);
  color: var(--color-steel);
}

.mov-icone--primary {
  background: var(--color-primary-soft);
  color: var(--color-ink);
}
.mov-icone--info {
  background: var(--color-info-soft);
  color: var(--color-info);
}
.mov-icone--success {
  background: var(--color-success-soft);
  color: var(--color-success);
}
.mov-icone--warning {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
.mov-icone--danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.esqueleto-grafico {
  display: grid;
  gap: var(--space-3);
}
</style>
