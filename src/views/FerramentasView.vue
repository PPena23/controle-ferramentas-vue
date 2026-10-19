<script setup lang="ts">
import { computed, toRef } from 'vue'
import { RouterLink } from 'vue-router'
import { CATEGORIAS, ESTADOS, type ColunaTabela, type FerramentaComEstoque } from '@/types'
import { useFerramentasStore } from '@/stores/ferramentas'
import { useEstoqueStore } from '@/stores/estoque'
import { usePreferenciasStore } from '@/stores/preferencias'
import { useFilters } from '@/composables/useFilters'
import { useDebounce } from '@/composables/useDebounce'
import { useDados } from '@/composables/useDados'
import { formatarMoeda, normalizar, plural } from '@/utils/formatadores'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import DataTable from '@/components/base/DataTable.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import EstadoBadge from '@/components/ferramentas/EstadoBadge.vue'
import EstoqueBarra from '@/components/ferramentas/EstoqueBarra.vue'

const ferramentas = useFerramentasStore()
const estoque = useEstoqueStore()
const preferencias = usePreferenciasStore()
const { carregandoInicial, carregando, erro, carregarTudo } = useDados()

// Filtros sincronizados com a URL (?categoria=Elétricas&abaixoDoMinimo=1…)
const { filtros, quantidadeAtivos, limpar } = useFilters({
  busca: '',
  categoria: '',
  estado: '',
  abaixoDoMinimo: false,
})

// A busca espera o usuário parar de digitar antes de filtrar.
const buscaAtrasada = useDebounce(toRef(filtros, 'busca'), 200)

const filtradas = computed(() => {
  const termo = normalizar(buscaAtrasada.value)
  return estoque.comEstoque.filter((f) => {
    if (filtros.categoria && f.categoria !== filtros.categoria) return false
    if (filtros.estado && f.estado !== filtros.estado) return false
    if (filtros.abaixoDoMinimo && !f.abaixoDoMinimo) return false
    if (!termo) return true
    return normalizar(`${f.codigo} ${f.nome} ${f.marca} ${f.local}`).includes(termo)
  })
})

const colunas: ColunaTabela<FerramentaComEstoque>[] = [
  { chave: 'codigo', rotulo: 'Código', ordenavel: true },
  { chave: 'nome', rotulo: 'Ferramenta', ordenavel: true },
  { chave: 'categoria', rotulo: 'Categoria', ordenavel: true, ocultarNoMobile: true },
  { chave: 'local', rotulo: 'Local', ordenavel: true },
  { chave: 'disponivel', rotulo: 'Disponível', ordenavel: true },
  { chave: 'estado', rotulo: 'Estado', ordenavel: true },
  { chave: 'valorUnitario', rotulo: 'Valor un.', ordenavel: true, alinhamento: 'fim', ocultarNoMobile: true },
  { chave: 'acoes', rotulo: 'Ações', alinhamento: 'fim' },
]

const opcoesEstado = ESTADOS.map((e) => ({ valor: e.valor, rotulo: e.rotulo }))
</script>

<template>
  <div>
    <PageHeader
      rotulo-superior="Catálogo"
      titulo="Ferramentas"
      :subtitulo="`${plural(ferramentas.itens.length, 'ferramenta cadastrada', 'ferramentas cadastradas')} no almoxarifado.`"
    >
      <template #acoes>
        <BaseButton variante="primario" icone="plus" para="/ferramentas/nova">Nova ferramenta</BaseButton>
      </template>
    </PageHeader>

    <ErrorState v-if="erro" class="erro" :mensagem="erro" :carregando="carregando" @tentar-novamente="carregarTudo" />

    <section class="card">
      <!-- Barra de filtros -->
      <div class="filtros" role="search" aria-label="Filtrar ferramentas">
        <div class="filtros__busca">
          <AppIcon nome="search" :tamanho="18" class="filtros__lupa" />
          <BaseInput
            v-model="filtros.busca"
            tipo="search"
            rotulo="Buscar ferramenta"
            rotulo-oculto
            placeholder="Buscar por código, nome, marca ou local…"
          />
        </div>
        <BaseSelect
          v-model="filtros.categoria"
          rotulo="Categoria"
          rotulo-oculto
          placeholder="Todas as categorias"
          :opcoes="CATEGORIAS"
        />
        <BaseSelect v-model="filtros.estado" rotulo="Estado" rotulo-oculto placeholder="Todos os estados" :opcoes="opcoesEstado" />
        <label class="filtros__toggle" :class="{ 'is-ativo': filtros.abaixoDoMinimo }">
          <input v-model="filtros.abaixoDoMinimo" type="checkbox" />
          Só abaixo do mínimo
        </label>
      </div>

      <div class="resumo-filtros" aria-live="polite">
        <span>
          <strong>{{ filtradas.length }}</strong> de {{ ferramentas.itens.length }} ferramentas
          <template v-if="quantidadeAtivos">· {{ plural(quantidadeAtivos, 'filtro ativo', 'filtros ativos') }}</template>
        </span>
        <BaseButton v-if="quantidadeAtivos" tamanho="sm" variante="fantasma" icone="x" @click="limpar">Limpar filtros</BaseButton>
      </div>

      <DataTable
        v-model:ordenacao="preferencias.ordenacaoFerramentas"
        :colunas="colunas"
        :linhas="filtradas"
        :carregando="carregandoInicial"
        legenda="Catálogo de ferramentas do almoxarifado"
      >
        <template #celula-codigo="{ linha }">
          <span class="mono codigo">{{ linha.codigo }}</span>
        </template>
        <template #celula-nome="{ linha }">
          <RouterLink :to="`/ferramentas/${linha.id}`" class="nome">
            <strong>{{ linha.nome }}</strong>
            <span class="muted">{{ linha.marca }}</span>
          </RouterLink>
        </template>
        <template #celula-local="{ linha }">
          <span class="local">{{ linha.local }}</span>
        </template>
        <template #celula-disponivel="{ linha }">
          <EstoqueBarra
            :total="linha.quantidadeTotal"
            :disponivel="linha.disponivel"
            :emprestadas="linha.emprestadas"
            :em-manutencao="linha.emManutencao"
            :minimo="linha.estoqueMinimo"
          />
        </template>
        <template #celula-estado="{ linha }">
          <EstadoBadge :estado="linha.estado" />
        </template>
        <template #celula-valorUnitario="{ linha }">
          <span class="valor">{{ formatarMoeda(linha.valorUnitario) }}</span>
        </template>
        <template #celula-acoes="{ linha }">
          <div class="acoes">
            <BaseButton tamanho="sm" variante="fantasma" icone="pencil" :para="`/ferramentas/${linha.id}/editar`">
              Editar<span class="sr-only"> {{ linha.nome }}</span>
            </BaseButton>
            <BaseButton tamanho="sm" icone="chevron-right" :para="`/ferramentas/${linha.id}`">
              Detalhes<span class="sr-only"> de {{ linha.nome }}</span>
            </BaseButton>
          </div>
        </template>

        <template #vazio>
          <EmptyState
            v-if="ferramentas.itens.length === 0"
            titulo="Nenhuma ferramenta cadastrada"
            descricao="Cadastre a primeira ferramenta ou restaure os dados de exemplo no rodapé."
          >
            <BaseButton variante="primario" icone="plus" para="/ferramentas/nova">Cadastrar ferramenta</BaseButton>
          </EmptyState>
          <EmptyState
            v-else
            icone="search"
            titulo="Nada encontrado"
            descricao="Nenhuma ferramenta corresponde aos filtros aplicados. Tente outro termo ou limpe os filtros."
          >
            <BaseButton icone="x" @click="limpar">Limpar filtros</BaseButton>
          </EmptyState>
        </template>
      </DataTable>
    </section>
  </div>
</template>

<style scoped>
.erro {
  margin-bottom: var(--space-5);
}

.filtros {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

@media (min-width: 640px) {
  .filtros {
    grid-template-columns: 1fr 1fr;
  }
  .filtros__busca {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1100px) {
  .filtros {
    grid-template-columns: minmax(280px, 2fr) 1fr 1fr auto;
    align-items: center;
  }
  .filtros__busca {
    grid-column: auto;
  }
}

.filtros__busca {
  position: relative;
}

.filtros__lupa {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  translate: 0 -50%;
  z-index: 1;
  color: var(--color-text-muted);
  pointer-events: none;
}

.filtros__busca :deep(input) {
  padding-left: 2.4rem;
}

.filtros__toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 42px;
  padding: 0 var(--space-4);
  border: 1.5px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast);
}

.filtros__toggle:hover {
  border-color: var(--color-ink);
}

.filtros__toggle:has(input:focus-visible) {
  box-shadow: var(--focus-ring);
}

.filtros__toggle.is-ativo {
  border-style: solid;
  border-color: var(--color-ink);
  background: var(--color-primary-soft);
}

.resumo-filtros {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 48px;
  padding: var(--space-2) var(--space-5);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.codigo {
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-2);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.nome {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  min-width: 0;
}

.nome strong {
  font-weight: 600;
}

.nome:hover strong {
  text-decoration: underline;
  text-decoration-color: var(--color-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.nome .muted {
  font-size: var(--text-xs);
}

.local {
  white-space: nowrap;
}

.valor {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.acoes {
  display: inline-flex;
  gap: var(--space-2);
}

@media (max-width: 767px) {
  .acoes {
    width: 100%;
  }
  .acoes > :deep(*) {
    flex: 1;
  }
}
</style>
