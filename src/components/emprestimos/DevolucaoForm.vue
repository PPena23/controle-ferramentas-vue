<script setup lang="ts">
import { reactive } from 'vue'
import type { DevolucaoInput, EmprestimoDetalhado } from '@/types'
import { useFormValidation, type Regras } from '@/composables/useFormValidation'
import { formatarData, formatarDataHora } from '@/utils/datas'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import StatusEmprestimoBadge from './StatusEmprestimoBadge.vue'

const props = defineProps<{ emprestimo: EmprestimoDetalhado; enviando?: boolean }>()
const emit = defineEmits<{ enviar: [dados: DevolucaoInput]; cancelar: [] }>()

const form = reactive<DevolucaoInput>({
  emprestimoId: props.emprestimo.id,
  comDefeito: false,
  observacao: '',
})

// Regra condicional: a observação só é obrigatória quando a ferramenta volta com defeito.
const regras: Regras<DevolucaoInput> = {
  observacao: [
    (texto, f) => !f.comDefeito || texto.trim().length >= 5 || 'Descreva o defeito (mín. 5 caracteres).',
    (texto) => texto.length <= 200 || 'Use no máximo 200 caracteres.',
  ],
}

const { erro, tocar, valido, validarTudo } = useFormValidation(form, regras)

function enviar() {
  if (!validarTudo()) return
  emit('enviar', { ...form })
}
</script>

<template>
  <form novalidate @submit.prevent="enviar">
    <dl class="resumo">
      <div class="resumo__linha resumo__linha--destaque">
        <dt class="sr-only">Ferramenta</dt>
        <dd>
          <span class="mono muted">{{ emprestimo.ferramenta?.codigo }}</span>
          <strong>{{ emprestimo.ferramenta?.nome ?? 'Ferramenta removida' }}</strong>
        </dd>
        <StatusEmprestimoBadge :status="emprestimo.status" :dias-atraso="emprestimo.diasAtraso" />
      </div>
      <div class="resumo__linha">
        <dt>Colaborador</dt>
        <dd>{{ emprestimo.colaborador }} · {{ emprestimo.setor }}</dd>
      </div>
      <div class="resumo__linha">
        <dt>Quantidade</dt>
        <dd>{{ emprestimo.quantidade }} un.</dd>
      </div>
      <div class="resumo__linha">
        <dt>Retirada</dt>
        <dd>{{ formatarDataHora(emprestimo.dataRetirada) }}</dd>
      </div>
      <div class="resumo__linha">
        <dt>Prevista</dt>
        <dd>{{ formatarData(emprestimo.dataPrevista) }}</dd>
      </div>
    </dl>

    <label class="defeito" :class="{ 'is-marcado': form.comDefeito }">
      <input v-model="form.comDefeito" type="checkbox" />
      <span>
        <strong>Devolvida com defeito</strong>
        <small>1 unidade será enviada para manutenção e ficará indisponível até o conserto.</small>
      </span>
      <AppIcon nome="wrench" :tamanho="20" />
    </label>

    <BaseInput
      v-model="form.observacao"
      :rotulo="form.comDefeito ? 'Descrição do defeito' : 'Observação (opcional)'"
      :obrigatorio="form.comDefeito"
      multilinha
      :placeholder="form.comDefeito ? 'Ex.: cabo com mau contato' : 'Ex.: devolvida limpa e completa'"
      :erro="erro('observacao')"
      @blur="tocar('observacao')"
    />

    <div class="acoes">
      <BaseButton variante="fantasma" :desabilitado="enviando" @click="emit('cancelar')">Cancelar</BaseButton>
      <BaseButton tipo="submit" variante="primario" icone="undo" :carregando="enviando" :desabilitado="!valido">
        Confirmar devolução
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.resumo {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  padding: var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  font-size: var(--text-sm);
}

.resumo__linha {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.resumo__linha dt {
  color: var(--color-text-muted);
}

.resumo__linha dd {
  text-align: right;
}

.resumo__linha--destaque {
  align-items: flex-start;
  padding-bottom: var(--space-2);
  margin-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.resumo__linha--destaque dd {
  display: flex;
  flex-direction: column;
  text-align: left;
  font-size: var(--text-base);
}

.defeito {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border: 1.5px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    border-color var(--duration-fast),
    background-color var(--duration-fast);
}

.defeito input {
  margin-top: 3px;
}

.defeito span {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.defeito small {
  color: var(--color-text-muted);
}

.defeito :deep(svg) {
  color: var(--color-text-soft);
}

.defeito.is-marcado {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
}

.defeito.is-marcado :deep(svg) {
  color: var(--color-warning);
}

.acoes {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
