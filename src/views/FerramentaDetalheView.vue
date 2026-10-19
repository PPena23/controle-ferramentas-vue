<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DevolucaoInput, EmprestimoDetalhado, NovoEmprestimoInput } from '@/types'
import { useFerramentasStore } from '@/stores/ferramentas'
import { useEstoqueStore } from '@/stores/estoque'
import { useEmprestimosStore } from '@/stores/emprestimos'
import { useHistoricoStore } from '@/stores/historico'
import { useDados } from '@/composables/useDados'
import { mensagemDeErro, useToast } from '@/composables/useToast'
import { formatarData, formatarDataHora } from '@/utils/datas'
import { formatarMoeda } from '@/utils/formatadores'
import { META_MOVIMENTACAO } from '@/utils/estoque'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import Badge from '@/components/base/Badge.vue'
import EstadoBadge from '@/components/ferramentas/EstadoBadge.vue'
import EstoqueBarra from '@/components/ferramentas/EstoqueBarra.vue'
import StatusEmprestimoBadge from '@/components/emprestimos/StatusEmprestimoBadge.vue'
import EmprestimoForm from '@/components/emprestimos/EmprestimoForm.vue'
import DevolucaoForm from '@/components/emprestimos/DevolucaoForm.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const toast = useToast()
const ferramentas = useFerramentasStore()
const estoque = useEstoqueStore()
const emprestimos = useEmprestimosStore()
const historico = useHistoricoStore()
const { carregandoInicial, carregando, erro, carregarTudo } = useDados()

const ferramenta = computed(() => estoque.porId.get(props.id))

// Título da aba acompanha a ferramenta exibida (inclusive depois de uma edição).
watch(
  () => ferramenta.value?.nome,
  (nome) => {
    if (nome) document.title = `${nome} · Almoxarifado de Ferramentas`
  },
  { immediate: true },
)

const emprestimosAbertos = computed(() => emprestimos.emAberto.filter((e) => e.ferramentaId === props.id))
const movimentacoes = computed(() => historico.ordenadas.filter((m) => m.ferramentaId === props.id).slice(0, 12))
const emManutencao = computed(() => !!ferramenta.value && (ferramenta.value.emManutencao > 0 || ferramenta.value.estado === 'manutencao'))

// ---------- Retirada ----------
const retiradaAberta = ref(false)

async function registrarRetirada(dados: NovoEmprestimoInput) {
  try {
    await emprestimos.registrarRetirada(dados)
    retiradaAberta.value = false
    toast.sucesso('Retirada registrada', `${dados.quantidade} un. para ${dados.colaborador}.`)
  } catch (e) {
    toast.erro('Retirada não registrada', mensagemDeErro(e))
  }
}

// ---------- Devolução ----------
const devolvendo = ref<EmprestimoDetalhado | null>(null)

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

// ---------- Manutenção ----------
async function concluirManutencao() {
  try {
    await ferramentas.concluirManutencao(props.id)
    toast.sucesso('Manutenção concluída', 'As unidades voltaram a ficar disponíveis.')
  } catch (e) {
    toast.erro('Não foi possível concluir', mensagemDeErro(e))
  }
}

// ---------- Exclusão ----------
const confirmandoExclusao = ref(false)

async function excluir() {
  const nome = ferramenta.value?.nome
  try {
    await ferramentas.excluir(props.id)
    confirmandoExclusao.value = false
    toast.sucesso('Ferramenta excluída', nome)
    router.push('/ferramentas')
  } catch (e) {
    confirmandoExclusao.value = false
    toast.erro('Exclusão bloqueada', mensagemDeErro(e))
  }
}
</script>

<template>
  <div>
    <ErrorState v-if="erro" :mensagem="erro" :carregando="carregando" @tentar-novamente="carregarTudo" />

    <div v-else-if="carregandoInicial" class="esqueleto" aria-busy="true" aria-label="Carregando ferramenta">
      <SkeletonBlock largura="120px" altura="0.8rem" />
      <SkeletonBlock largura="55%" altura="2.4rem" />
      <div class="grade">
        <SkeletonBlock altura="180px" raio="var(--radius-lg)" />
        <SkeletonBlock altura="180px" raio="var(--radius-lg)" />
      </div>
    </div>

    <EmptyState
      v-else-if="!ferramenta"
      class="card"
      icone="search"
      titulo="Ferramenta não encontrada"
      descricao="Ela pode ter sido excluída ou o endereço está incorreto."
    >
      <BaseButton para="/ferramentas" icone="arrow-left">Voltar ao catálogo</BaseButton>
    </EmptyState>

    <template v-else>
      <PageHeader :rotulo-superior="`${ferramenta.codigo} · ${ferramenta.categoria}`" :titulo="ferramenta.nome">
        <template #extra>
          <div class="selos">
            <EstadoBadge :estado="ferramenta.estado" />
            <Badge v-if="ferramenta.abaixoDoMinimo" tom="danger" icone="trending-down">Abaixo do mínimo</Badge>
            <Badge v-if="ferramenta.emprestadas" tom="info" icone="troca">{{ ferramenta.emprestadas }} emprestada(s)</Badge>
          </div>
        </template>
        <template #acoes>
          <BaseButton variante="fantasma" icone="arrow-left" para="/ferramentas">Catálogo</BaseButton>
          <BaseButton icone="pencil" :para="`/ferramentas/${ferramenta.id}/editar`">Editar</BaseButton>
          <BaseButton
            variante="primario"
            icone="log-out"
            :desabilitado="ferramenta.disponivel === 0"
            :title="ferramenta.disponivel === 0 ? 'Sem unidades disponíveis' : undefined"
            @click="retiradaAberta = true"
          >
            Registrar retirada
          </BaseButton>
        </template>
      </PageHeader>

      <div class="grade">
        <section class="card" aria-labelledby="titulo-estoque">
          <header class="card__header">
            <h2 id="titulo-estoque" class="card__title"><AppIcon nome="box" /> Estoque</h2>
          </header>
          <div class="card__body estoque">
            <p class="estoque__destaque">
              <strong>{{ ferramenta.disponivel }}</strong>
              <span>de {{ ferramenta.quantidadeTotal }} unidades disponíveis para retirada</span>
            </p>
            <EstoqueBarra
              detalhado
              :total="ferramenta.quantidadeTotal"
              :disponivel="ferramenta.disponivel"
              :emprestadas="ferramenta.emprestadas"
              :em-manutencao="ferramenta.emManutencao"
              :minimo="ferramenta.estoqueMinimo"
            />
            <div v-if="emManutencao" class="aviso-manutencao">
              <AppIcon nome="wrench" />
              <p>
                <strong>{{ ferramenta.emManutencao }} unidade(s) na oficina.</strong>
                Conclua a manutenção quando voltarem consertadas.
              </p>
              <BaseButton tamanho="sm" icone="check" :carregando="ferramentas.salvando" @click="concluirManutencao">
                Concluir manutenção
              </BaseButton>
            </div>
          </div>
        </section>

        <section class="card" aria-labelledby="titulo-ficha">
          <header class="card__header">
            <h2 id="titulo-ficha" class="card__title"><AppIcon nome="info" /> Ficha</h2>
          </header>
          <dl class="card__body ficha">
            <div><dt>Código</dt><dd class="mono">{{ ferramenta.codigo }}</dd></div>
            <div><dt>Marca</dt><dd>{{ ferramenta.marca }}</dd></div>
            <div><dt>Local</dt><dd>{{ ferramenta.local }}</dd></div>
            <div><dt>Estoque mínimo</dt><dd>{{ ferramenta.estoqueMinimo }} un.</dd></div>
            <div><dt>Valor unitário</dt><dd>{{ formatarMoeda(ferramenta.valorUnitario) }}</dd></div>
            <div><dt>Valor total</dt><dd>{{ formatarMoeda(ferramenta.valorUnitario * ferramenta.quantidadeTotal) }}</dd></div>
            <div><dt>Cadastrada em</dt><dd>{{ formatarData(ferramenta.criadoEm) }}</dd></div>
            <div><dt>Atualizada em</dt><dd>{{ formatarDataHora(ferramenta.atualizadoEm) }}</dd></div>
          </dl>
        </section>

        <section class="card" aria-labelledby="titulo-abertos">
          <header class="card__header">
            <h2 id="titulo-abertos" class="card__title"><AppIcon nome="troca" /> Com quem está</h2>
          </header>
          <EmptyState
            v-if="emprestimosAbertos.length === 0"
            compacto
            icone="check-circle"
            titulo="Nenhuma unidade emprestada"
            descricao="Todas as unidades estão no almoxarifado ou na manutenção."
          />
          <ul v-else class="lista">
            <li v-for="e in emprestimosAbertos" :key="e.id" class="lista__item">
              <div class="lista__texto">
                <strong>{{ e.colaborador }}</strong>
                <span class="muted">{{ e.quantidade }} un. · {{ e.setor }} · até {{ formatarData(e.dataPrevista) }}</span>
              </div>
              <StatusEmprestimoBadge :status="e.status" :dias-atraso="e.diasAtraso" />
              <BaseButton tamanho="sm" icone="undo" @click="devolvendo = e">Devolver</BaseButton>
            </li>
          </ul>
        </section>

        <section class="card" aria-labelledby="titulo-mov">
          <header class="card__header">
            <h2 id="titulo-mov" class="card__title"><AppIcon nome="historico" /> Movimentações</h2>
          </header>
          <ol class="lista">
            <li v-for="m in movimentacoes" :key="m.id" class="lista__item">
              <Badge :tom="META_MOVIMENTACAO[m.tipo].tom" :icone="META_MOVIMENTACAO[m.tipo].icone" compacto>
                {{ META_MOVIMENTACAO[m.tipo].rotulo }}
              </Badge>
              <span class="lista__texto">{{ m.descricao }}</span>
              <time class="muted data" :datetime="m.data">{{ formatarData(m.data) }}</time>
            </li>
          </ol>
        </section>
      </div>

      <div class="zona-perigo">
        <div>
          <strong>Excluir ferramenta</strong>
          <p class="muted">Remove do catálogo. O histórico é mantido. Bloqueado se houver unidades emprestadas.</p>
        </div>
        <BaseButton variante="perigo" icone="trash" @click="confirmandoExclusao = true">Excluir</BaseButton>
      </div>

      <BaseModal
        :aberto="retiradaAberta"
        titulo="Registrar retirada"
        :descricao="`${ferramenta.codigo} · ${ferramenta.nome}`"
        :bloqueado="emprestimos.salvando"
        @fechar="retiradaAberta = false"
      >
        <EmprestimoForm
          v-if="retiradaAberta"
          :ferramentas="estoque.comEstoque"
          :colaboradores="emprestimos.colaboradores"
          :ferramenta-inicial-id="ferramenta.id"
          :enviando="emprestimos.salvando"
          @enviar="registrarRetirada"
          @cancelar="retiradaAberta = false"
        />
      </BaseModal>

      <BaseModal
        :aberto="!!devolvendo"
        titulo="Registrar devolução"
        :bloqueado="emprestimos.salvando"
        @fechar="devolvendo = null"
      >
        <DevolucaoForm
          v-if="devolvendo"
          :emprestimo="devolvendo"
          :enviando="emprestimos.salvando"
          @enviar="registrarDevolucao"
          @cancelar="devolvendo = null"
        />
      </BaseModal>

      <ConfirmDialog
        :aberto="confirmandoExclusao"
        :titulo="`Excluir ${ferramenta.codigo}?`"
        :mensagem="`“${ferramenta.nome}” será removida do catálogo. Esta ação não pode ser desfeita.`"
        rotulo-confirmar="Excluir ferramenta"
        perigoso
        :carregando="ferramentas.salvando"
        @confirmar="excluir"
        @cancelar="confirmandoExclusao = false"
      />
    </template>
  </div>
</template>

<style scoped>
.esqueleto {
  display: grid;
  gap: var(--space-3);
}

.selos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.grade {
  display: grid;
  gap: var(--space-5);
}

@media (min-width: 900px) {
  .grade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.estoque {
  display: grid;
  gap: var(--space-4);
}

.estoque__destaque {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  color: var(--color-text-muted);
}

.estoque__destaque strong {
  font-family: var(--font-display);
  font-stretch: 75%;
  font-size: var(--text-3xl);
  line-height: 1;
  color: var(--color-text);
}

.aviso-manutencao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-left: 5px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: var(--text-sm);
}

.aviso-manutencao p {
  flex: 1 1 200px;
  color: var(--color-text);
}

.ficha {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4) var(--space-5);
}

.ficha dt {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ficha dd {
  font-weight: 600;
}

.lista {
  padding: 0;
  list-style: none;
}

.lista__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

.lista__item:last-child {
  border-bottom: 0;
}

.lista__texto {
  flex: 1 1 180px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.data {
  font-size: var(--text-xs);
  white-space: nowrap;
}

.zona-perigo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding: var(--space-4) var(--space-5);
  border: 1.5px dashed var(--color-danger);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
</style>
