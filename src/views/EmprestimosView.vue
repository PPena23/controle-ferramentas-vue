<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { ColunaTabela, DevolucaoInput, EmprestimoDetalhado, NovoEmprestimoInput } from '@/types'
import { useEmprestimosStore } from '@/stores/emprestimos'
import { useEstoqueStore } from '@/stores/estoque'
import { usePreferenciasStore } from '@/stores/preferencias'
import { useFilters } from '@/composables/useFilters'
import { useDebounce } from '@/composables/useDebounce'
import { useDados } from '@/composables/useDados'
import { mensagemDeErro, useToast } from '@/composables/useToast'
import { formatarData, formatarRelativo } from '@/utils/datas'
import { normalizar } from '@/utils/formatadores'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import DataTable from '@/components/base/DataTable.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import StatusEmprestimoBadge from '@/components/emprestimos/StatusEmprestimoBadge.vue'
import EmprestimoForm from '@/components/emprestimos/EmprestimoForm.vue'
import DevolucaoForm from '@/components/emprestimos/DevolucaoForm.vue'

type Aba = 'abertos' | 'atrasados' | 'devolvidos' | 'todos'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const emprestimos = useEmprestimosStore()
const estoque = useEstoqueStore()
const preferencias = usePreferenciasStore()
const { carregandoInicial, carregando, erro, carregarTudo } = useDados()

const { filtros } = useFilters({ aba: 'abertos', busca: '' })
const buscaAtrasada = useDebounce(toRef(filtros, 'busca'), 200)

const abas = computed<{ id: Aba; rotulo: string; total: number }[]>(() => [
  { id: 'abertos', rotulo: 'Em aberto', total: emprestimos.emAberto.length },
  { id: 'atrasados', rotulo: 'Atrasados', total: emprestimos.atrasados.length },
  { id: 'devolvidos', rotulo: 'Devolvidos', total: emprestimos.devolvidos.length },
  { id: 'todos', rotulo: 'Todos', total: emprestimos.detalhados.length },
])

const listaDaAba = computed(() => {
  switch (filtros.aba as Aba) {
    case 'atrasados':
      return emprestimos.atrasados
    case 'devolvidos':
      return emprestimos.devolvidos
    case 'todos':
      return emprestimos.detalhados
    default:
      return emprestimos.emAberto
  }
})

const filtrados = computed(() => {
  const termo = normalizar(buscaAtrasada.value)
  if (!termo) return listaDaAba.value
  return listaDaAba.value.filter((e) =>
    normalizar(`${e.colaborador} ${e.setor} ${e.ferramenta?.nome ?? ''} ${e.ferramenta?.codigo ?? ''}`).includes(termo),
  )
})

const ORDEM_STATUS = { atrasado: 0, ativo: 1, devolvido: 2 } as const

const colunas: ColunaTabela<EmprestimoDetalhado>[] = [
  { chave: 'ferramenta', rotulo: 'Ferramenta', ordenavel: true, valor: (e) => e.ferramenta?.nome ?? '' },
  { chave: 'colaborador', rotulo: 'Colaborador', ordenavel: true },
  { chave: 'quantidade', rotulo: 'Qtd.', ordenavel: true, alinhamento: 'centro' },
  { chave: 'dataRetirada', rotulo: 'Retirada', ordenavel: true, ocultarNoMobile: true },
  { chave: 'dataPrevista', rotulo: 'Prevista', ordenavel: true },
  { chave: 'status', rotulo: 'Situação', ordenavel: true, valor: (e) => ORDEM_STATUS[e.status] * 1000 - e.diasAtraso },
  { chave: 'acoes', rotulo: 'Ações', alinhamento: 'fim' },
]

// ---------- Abas acessíveis (setas do teclado alternam) ----------
const refsAbas = ref<HTMLButtonElement[]>([])

function aoTeclarNaAba(evento: KeyboardEvent, indice: number) {
  const delta = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0
  if (!delta) return
  evento.preventDefault()
  const proximo = (indice + delta + abas.value.length) % abas.value.length
  filtros.aba = abas.value[proximo].id
  nextTick(() => refsAbas.value[proximo]?.focus())
}

// ---------- Modais ----------
const retiradaAberta = ref(false)
const ferramentaInicialId = ref<string | undefined>()
const devolvendo = ref<EmprestimoDetalhado | null>(null)

/** Remove parâmetros de "ação" da URL depois de consumidos, mantendo os filtros. */
function limparParametro(...chaves: string[]) {
  const query = { ...route.query }
  chaves.forEach((c) => delete query[c])
  router.replace({ query })
}

// Links como /emprestimos?nova=1&ferramenta=fer-001 abrem o modal já preenchido.
watch(
  () => route.query.nova,
  (nova) => {
    if (nova !== '1') return
    ferramentaInicialId.value = typeof route.query.ferramenta === 'string' ? route.query.ferramenta : undefined
    retiradaAberta.value = true
    limparParametro('nova', 'ferramenta')
  },
  { immediate: true },
)

// /emprestimos?devolver=<id> (vindo do painel) precisa esperar os dados chegarem.
watch(
  [() => route.query.devolver, () => emprestimos.carregado],
  ([id, carregado]) => {
    if (typeof id !== 'string' || !carregado) return
    const alvo = emprestimos.detalhados.find((e) => e.id === id && e.status !== 'devolvido')
    if (alvo) devolvendo.value = alvo
    else toast.info('Empréstimo já devolvido ou inexistente')
    limparParametro('devolver')
  },
  { immediate: true },
)

async function registrarRetirada(dados: NovoEmprestimoInput) {
  try {
    await emprestimos.registrarRetirada(dados)
    retiradaAberta.value = false
    toast.sucesso('Retirada registrada', `${dados.quantidade} un. para ${dados.colaborador}.`)
  } catch (e) {
    toast.erro('Retirada não registrada', mensagemDeErro(e))
  }
}

async function registrarDevolucao(dados: DevolucaoInput) {
  try {
    await emprestimos.registrarDevolucao(dados)
    devolvendo.value = null
    toast.sucesso(
      'Devolução registrada',
      dados.comDefeito ? '1 unidade foi enviada para manutenção.' : 'As unidades voltaram ao estoque.',
    )
  } catch (e) {
    toast.erro('Devolução não registrada', mensagemDeErro(e))
  }
}

function abrirRetirada() {
  ferramentaInicialId.value = undefined
  retiradaAberta.value = true
}
</script>

<template>
  <div>
    <PageHeader
      rotulo-superior="Retirada e devolução"
      titulo="Empréstimos"
      subtitulo="Controle quem está com cada ferramenta e cobre as devoluções em atraso."
    >
      <template #acoes>
        <BaseButton variante="primario" icone="log-out" @click="abrirRetirada">Nova retirada</BaseButton>
      </template>
    </PageHeader>

    <ErrorState v-if="erro" class="erro" :mensagem="erro" :carregando="carregando" @tentar-novamente="carregarTudo" />

    <section class="card">
      <div class="barra">
        <div class="abas" role="tablist" aria-label="Situação dos empréstimos">
          <button
            v-for="(aba, indice) in abas"
            :id="`aba-${aba.id}`"
            :key="aba.id"
            ref="refsAbas"
            type="button"
            role="tab"
            class="aba"
            :class="{ 'is-ativa': filtros.aba === aba.id, 'aba--perigo': aba.id === 'atrasados' && aba.total > 0 }"
            :aria-selected="filtros.aba === aba.id"
            :tabindex="filtros.aba === aba.id ? 0 : -1"
            aria-controls="painel-emprestimos"
            @click="filtros.aba = aba.id"
            @keydown="aoTeclarNaAba($event, indice)"
          >
            {{ aba.rotulo }}
            <span class="aba__total">{{ aba.total }}</span>
          </button>
        </div>
        <div class="barra__busca">
          <AppIcon nome="search" :tamanho="18" class="barra__lupa" />
          <BaseInput
            v-model="filtros.busca"
            tipo="search"
            rotulo="Buscar empréstimo"
            rotulo-oculto
            placeholder="Colaborador, setor ou ferramenta…"
          />
        </div>
      </div>

      <div id="painel-emprestimos" role="tabpanel" :aria-labelledby="`aba-${filtros.aba}`">
        <DataTable
          v-model:ordenacao="preferencias.ordenacaoEmprestimos"
          :colunas="colunas"
          :linhas="filtrados"
          :carregando="carregandoInicial"
          legenda="Lista de empréstimos de ferramentas"
        >
          <template #celula-ferramenta="{ linha }">
            <RouterLink v-if="linha.ferramenta" :to="`/ferramentas/${linha.ferramenta.id}`" class="ferramenta">
              <span class="mono muted">{{ linha.ferramenta.codigo }}</span>
              <strong>{{ linha.ferramenta.nome }}</strong>
            </RouterLink>
            <span v-else class="muted">Ferramenta removida</span>
          </template>
          <template #celula-colaborador="{ linha }">
            <div class="pessoa">
              <strong>{{ linha.colaborador }}</strong>
              <span class="muted">{{ linha.setor }}</span>
            </div>
          </template>
          <template #celula-dataRetirada="{ linha }">
            <time :datetime="linha.dataRetirada">{{ formatarData(linha.dataRetirada) }}</time>
          </template>
          <template #celula-dataPrevista="{ linha }">
            <div class="pessoa">
              <time :datetime="linha.dataPrevista">{{ formatarData(linha.dataPrevista) }}</time>
              <span v-if="linha.status !== 'devolvido'" class="muted">{{ formatarRelativo(linha.dataPrevista) }}</span>
            </div>
          </template>
          <template #celula-status="{ linha }">
            <StatusEmprestimoBadge :status="linha.status" :dias-atraso="linha.diasAtraso" />
            <span v-if="linha.devolvidaComDefeito" class="defeito">
              <AppIcon nome="wrench" :tamanho="12" /> com defeito
            </span>
          </template>
          <template #celula-acoes="{ linha }">
            <BaseButton v-if="linha.status !== 'devolvido'" tamanho="sm" icone="undo" @click="devolvendo = linha">
              Devolver<span class="sr-only"> {{ linha.ferramenta?.nome }} de {{ linha.colaborador }}</span>
            </BaseButton>
            <span v-else class="muted devolvido-em">em {{ formatarData(linha.dataDevolucao ?? '') }}</span>
          </template>

          <template #vazio>
            <EmptyState
              v-if="buscaAtrasada"
              icone="search"
              titulo="Nada encontrado"
              descricao="Nenhum empréstimo corresponde à busca nesta aba."
            >
              <BaseButton icone="x" @click="filtros.busca = ''">Limpar busca</BaseButton>
            </EmptyState>
            <EmptyState
              v-else-if="filtros.aba === 'atrasados'"
              icone="check-circle"
              titulo="Nenhum atraso"
              descricao="Todas as ferramentas emprestadas estão dentro do prazo."
            />
            <EmptyState v-else icone="troca" titulo="Nenhum empréstimo aqui" descricao="Registre uma retirada para começar.">
              <BaseButton variante="primario" icone="log-out" @click="abrirRetirada">Nova retirada</BaseButton>
            </EmptyState>
          </template>
        </DataTable>
      </div>
    </section>

    <BaseModal
      :aberto="retiradaAberta"
      titulo="Registrar retirada"
      descricao="A quantidade é validada contra o estoque disponível no momento."
      :bloqueado="emprestimos.salvando"
      @fechar="retiradaAberta = false"
    >
      <EmprestimoForm
        v-if="retiradaAberta"
        :ferramentas="estoque.comEstoque"
        :colaboradores="emprestimos.colaboradores"
        :ferramenta-inicial-id="ferramentaInicialId"
        :enviando="emprestimos.salvando"
        @enviar="registrarRetirada"
        @cancelar="retiradaAberta = false"
      />
    </BaseModal>

    <BaseModal :aberto="!!devolvendo" titulo="Registrar devolução" :bloqueado="emprestimos.salvando" @fechar="devolvendo = null">
      <DevolucaoForm
        v-if="devolvendo"
        :emprestimo="devolvendo"
        :enviando="emprestimos.salvando"
        @enviar="registrarDevolucao"
        @cancelar="devolvendo = null"
      />
    </BaseModal>
  </div>
</template>

<style scoped>
.erro {
  margin-bottom: var(--space-5);
}

.barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3) var(--space-5);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.abas {
  display: flex;
  gap: var(--space-1);
  padding: 4px;
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  overflow-x: auto;
  max-width: 100%;
}

.aba {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast),
    color var(--duration-fast);
}

.aba:hover {
  color: var(--color-ink);
}

.aba.is-ativa {
  background: var(--color-ink);
  color: #fff;
}

.aba__total {
  min-width: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-xs);
  line-height: 20px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.aba.is-ativa .aba__total {
  background: var(--color-primary);
  color: var(--color-ink);
}

.aba--perigo .aba__total {
  background: var(--color-danger);
  color: #fff;
}

.barra__busca {
  position: relative;
  flex: 1 1 260px;
  max-width: 420px;
}

.barra__lupa {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  translate: 0 -50%;
  z-index: 1;
  color: var(--color-text-muted);
  pointer-events: none;
}

.barra__busca :deep(input) {
  padding-left: 2.4rem;
}

.ferramenta,
.pessoa {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  min-width: 0;
}

.ferramenta .mono,
.pessoa .muted {
  font-size: var(--text-xs);
}

.ferramenta strong,
.pessoa strong {
  font-weight: 600;
}

.ferramenta:hover strong {
  text-decoration: underline;
  text-decoration-color: var(--color-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.defeito {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: var(--text-xs);
  color: var(--color-warning);
}

.devolvido-em {
  font-size: var(--text-xs);
  white-space: nowrap;
}
</style>
