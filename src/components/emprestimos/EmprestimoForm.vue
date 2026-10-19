<script setup lang="ts">
import { computed, reactive, useId, watch } from 'vue'
import { SETORES, type FerramentaComEstoque, type NovoEmprestimoInput } from '@/types'
import { useFormValidation, validadores as v, type Regras } from '@/composables/useFormValidation'
import { hojeISO, paraDataISO, somarDias } from '@/utils/datas'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const props = defineProps<{
  ferramentas: FerramentaComEstoque[]
  colaboradores: string[]
  ferramentaInicialId?: string
  enviando?: boolean
}>()

const emit = defineEmits<{ enviar: [dados: NovoEmprestimoInput]; cancelar: [] }>()

const hoje = hojeISO()
const idLista = useId()

const form = reactive<NovoEmprestimoInput>({
  ferramentaId: props.ferramentaInicialId ?? '',
  quantidade: 1,
  colaborador: '',
  setor: '',
  dataPrevista: paraDataISO(somarDias(new Date(), 7)),
  observacao: '',
})

const selecionada = computed(() => props.ferramentas.find((f) => f.id === form.ferramentaId))
const disponivel = computed(() => selecionada.value?.disponivel ?? 0)

const regras: Regras<NovoEmprestimoInput> = {
  ferramentaId: [
    v.obrigatorio('Escolha a ferramenta.'),
    () => disponivel.value > 0 || 'Esta ferramenta não tem unidades disponíveis.',
  ],
  quantidade: [
    v.numero(),
    v.inteiro(),
    v.minimo(1, 'Retire ao menos 1 unidade.'),
    // Regra de negócio: bloqueia retirada acima do disponível.
    (qtd) => !selecionada.value || qtd <= disponivel.value || `Só há ${disponivel.value} unidade(s) disponível(is).`,
  ],
  colaborador: [v.obrigatorio('Informe quem está retirando.'), v.minCaracteres(3)],
  setor: [v.obrigatorio('Escolha o setor.')],
  dataPrevista: [
    v.obrigatorio('Informe a data prevista de devolução.'),
    (data) => data >= hoje || 'A devolução não pode ser no passado.',
  ],
  observacao: [v.maxCaracteres(200)],
}

const { erro, tocar, valido, validarTudo } = useFormValidation(form, regras)

const opcoesFerramentas = computed(() =>
  [...props.ferramentas]
    .filter((f) => f.estado !== 'baixada')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((f) => ({
      valor: f.id,
      rotulo: `${f.codigo} — ${f.nome} (${f.disponivel} disp.)`,
      desabilitada: f.disponivel === 0,
    })),
)

// Ao trocar de ferramenta, ajusta a quantidade para caber no novo disponível.
watch(
  () => form.ferramentaId,
  () => {
    if (disponivel.value > 0 && form.quantidade > disponivel.value) form.quantidade = disponivel.value
  },
)

function enviar() {
  if (!validarTudo()) return
  emit('enviar', { ...form })
}
</script>

<template>
  <form class="form-emprestimo" novalidate @submit.prevent="enviar">
    <div class="form-grid">
      <BaseSelect
        v-model="form.ferramentaId"
        class="span-2"
        rotulo="Ferramenta"
        obrigatorio
        placeholder="Selecione a ferramenta…"
        :opcoes="opcoesFerramentas"
        :erro="erro('ferramentaId')"
        @blur="tocar('ferramentaId')"
      />

      <Transition name="fade">
        <div v-if="selecionada" class="span-2 info-ferramenta" aria-live="polite">
          <AppIcon nome="map-pin" :tamanho="16" />
          <span>{{ selecionada.local }}</span>
          <span class="info-ferramenta__sep" aria-hidden="true">•</span>
          <span :class="{ 'texto-perigo': selecionada.disponivel === 0 }">
            <strong>{{ selecionada.disponivel }}</strong> de {{ selecionada.quantidadeTotal }} disponíveis
          </span>
        </div>
      </Transition>

      <BaseInput
        v-model="form.quantidade"
        tipo="number"
        rotulo="Quantidade"
        obrigatorio
        min="1"
        :max="disponivel || undefined"
        step="1"
        inputmode="numeric"
        :erro="erro('quantidade')"
        @blur="tocar('quantidade')"
      />
      <BaseInput
        v-model="form.dataPrevista"
        tipo="date"
        rotulo="Devolução prevista"
        obrigatorio
        :min="hoje"
        :erro="erro('dataPrevista')"
        @blur="tocar('dataPrevista')"
      />
      <BaseInput
        v-model="form.colaborador"
        rotulo="Colaborador"
        obrigatorio
        placeholder="Nome de quem retira"
        autocomplete="off"
        :list="idLista"
        :erro="erro('colaborador')"
        @blur="tocar('colaborador')"
      />
      <datalist :id="idLista">
        <option v-for="nome in colaboradores" :key="nome" :value="nome" />
      </datalist>
      <BaseSelect
        v-model="form.setor"
        rotulo="Setor"
        obrigatorio
        placeholder="Selecione…"
        :opcoes="SETORES"
        :erro="erro('setor')"
        @blur="tocar('setor')"
      />
      <BaseInput
        v-model="form.observacao"
        class="span-2"
        rotulo="Observação (opcional)"
        multilinha
        placeholder="Ex.: uso na obra do bloco C"
        :erro="erro('observacao')"
        @blur="tocar('observacao')"
      />
    </div>

    <div class="form-emprestimo__acoes">
      <BaseButton variante="fantasma" :desabilitado="enviando" @click="emit('cancelar')">Cancelar</BaseButton>
      <BaseButton tipo="submit" variante="primario" icone="log-out" :carregando="enviando" :desabilitado="!valido">
        Registrar retirada
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.info-ferramenta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.info-ferramenta__sep {
  color: var(--color-border-strong);
}

.texto-perigo {
  color: var(--color-danger);
}

.form-emprestimo__acoes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
