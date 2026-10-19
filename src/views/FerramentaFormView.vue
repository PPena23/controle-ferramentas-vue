<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FerramentaInput } from '@/types'
import { useFerramentasStore } from '@/stores/ferramentas'
import { useEstoqueStore } from '@/stores/estoque'
import { useDados } from '@/composables/useDados'
import { mensagemDeErro, useToast } from '@/composables/useToast'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import PageHeader from '@/components/layout/PageHeader.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import ErrorState from '@/components/base/ErrorState.vue'
import SkeletonBlock from '@/components/base/SkeletonBlock.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import FerramentaForm from '@/components/ferramentas/FerramentaForm.vue'

// Mesma view atende /ferramentas/nova e /ferramentas/:id/editar.
const props = defineProps<{ id?: string }>()

const router = useRouter()
const ferramentas = useFerramentasStore()
const estoque = useEstoqueStore()
const toast = useToast()
const { carregandoInicial, carregando, erro, carregarTudo } = useDados()

const modoEdicao = computed(() => Boolean(props.id))
const atual = computed(() => (props.id ? estoque.porId.get(props.id) : undefined))

const inicial = computed<FerramentaInput | null>(() => {
  if (!modoEdicao.value) {
    return {
      codigo: ferramentas.proximoCodigo,
      nome: '',
      categoria: 'Manuais',
      marca: '',
      local: '',
      quantidadeTotal: 1,
      estoqueMinimo: 1,
      valorUnitario: Number.NaN,
      estado: 'bom',
      emManutencao: 0,
    }
  }
  if (!atual.value) return null
  const { id: _id, criadoEm: _c, atualizadoEm: _a, emprestadas: _e, disponivel: _d, abaixoDoMinimo: _m, ...dados } = atual.value
  return dados
})

const codigosEmUso = computed(() =>
  ferramentas.itens.filter((f) => f.id !== props.id).map((f) => f.codigo.toUpperCase()),
)

// ---------- Proteção contra perda de alterações ----------
const sujo = ref(false)
const salvo = ref(false)
const { dialogoAberto, sairMesmoAssim, continuarEditando } = useUnsavedChangesGuard(() => sujo.value && !salvo.value)

async function salvar(dados: FerramentaInput) {
  try {
    const ferramenta = props.id ? await ferramentas.atualizar(props.id, dados) : await ferramentas.criar(dados)
    salvo.value = true
    toast.sucesso(
      modoEdicao.value ? 'Alterações salvas' : 'Ferramenta cadastrada',
      `${ferramenta.codigo} · ${ferramenta.nome}`,
    )
    router.push(`/ferramentas/${ferramenta.id}`)
  } catch (e) {
    toast.erro('Não foi possível salvar', mensagemDeErro(e))
  }
}

function cancelar() {
  router.push(props.id ? `/ferramentas/${props.id}` : '/ferramentas')
}
</script>

<template>
  <div>
    <PageHeader
      :rotulo-superior="modoEdicao ? atual?.codigo ?? 'Edição' : 'Catálogo'"
      :titulo="modoEdicao ? 'Editar ferramenta' : 'Nova ferramenta'"
      :subtitulo="
        modoEdicao
          ? 'Atualize os dados de cadastro. As regras de estoque continuam valendo.'
          : 'Preencha os dados para incluir a ferramenta no almoxarifado.'
      "
    >
      <template #acoes>
        <BaseButton variante="fantasma" icone="arrow-left" @click="cancelar">Voltar</BaseButton>
      </template>
    </PageHeader>

    <ErrorState v-if="erro" :mensagem="erro" :carregando="carregando" @tentar-novamente="carregarTudo" />

    <div v-else-if="carregandoInicial" class="esqueleto card" aria-busy="true" aria-label="Carregando formulário">
      <SkeletonBlock v-for="n in 6" :key="n" altura="42px" />
    </div>

    <EmptyState
      v-else-if="!inicial"
      class="card"
      icone="search"
      titulo="Ferramenta não encontrada"
      descricao="Ela pode ter sido excluída ou o endereço está incorreto."
    >
      <BaseButton para="/ferramentas" icone="arrow-left">Voltar ao catálogo</BaseButton>
    </EmptyState>

    <FerramentaForm
      v-else
      :key="id ?? 'nova'"
      :inicial="inicial"
      :codigos-em-uso="codigosEmUso"
      :emprestadas="atual?.emprestadas ?? 0"
      :enviando="ferramentas.salvando"
      :modo-edicao="modoEdicao"
      @enviar="salvar"
      @cancelar="cancelar"
      @sujo="sujo = $event"
    />

    <ConfirmDialog
      :aberto="dialogoAberto"
      titulo="Descartar alterações?"
      mensagem="Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas."
      rotulo-confirmar="Sair sem salvar"
      rotulo-cancelar="Continuar editando"
      perigoso
      @confirmar="sairMesmoAssim"
      @cancelar="continuarEditando"
    />
  </div>
</template>

<style scoped>
.esqueleto {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
}
</style>
