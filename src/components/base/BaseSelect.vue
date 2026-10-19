<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import type { OpcaoSelect } from '@/types'

defineOptions({ inheritAttrs: false })

// class/style ficam no wrapper (para layout em grid); o resto dos atributos vai para o controle nativo.
const attrs = useAttrs()
const atributosDoControle = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([chave]) => chave !== 'class' && chave !== 'style')),
)

const props = defineProps<{
  modelValue: string
  rotulo: string
  opcoes: ReadonlyArray<OpcaoSelect | string>
  /** Opção vazia no topo (ex.: "Todas as categorias"). */
  placeholder?: string
  erro?: string
  dica?: string
  obrigatorio?: boolean
  rotuloOculto?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [valor: string]
  blur: []
}>()

const id = useId()
const idErro = `${id}-erro`

// Aceita tanto strings quanto objetos { valor, rotulo } — deixa o uso nas telas mais enxuto.
const opcoesNormalizadas = computed<OpcaoSelect[]>(() =>
  props.opcoes.map((o) => (typeof o === 'string' ? { valor: o, rotulo: o } : o)),
)
</script>

<template>
  <div class="campo" :class="[{ 'campo--erro': erro }, $attrs.class]" :style="$attrs.style as string | undefined">
    <label :for="id" class="campo__rotulo" :class="{ 'sr-only': rotuloOculto }">
      {{ rotulo }}
      <span v-if="obrigatorio" class="campo__obrigatorio" aria-hidden="true">*</span>
    </label>
    <div class="select">
      <select
        :id="id"
        class="select__input"
        :value="modelValue"
        :required="obrigatorio"
        :aria-invalid="erro ? 'true' : undefined"
        :aria-describedby="erro ? idErro : undefined"
        v-bind="atributosDoControle"
        @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        @blur="emit('blur')"
      >
        <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
        <option v-for="opcao in opcoesNormalizadas" :key="opcao.valor" :value="opcao.valor" :disabled="opcao.desabilitada">
          {{ opcao.rotulo }}
        </option>
      </select>
      <svg class="select__seta" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>
    <p v-if="dica && !erro" class="campo__dica">{{ dica }}</p>
    <p v-if="erro" :id="idErro" class="campo__erro" role="alert">{{ erro }}</p>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.campo__rotulo {
  font-size: var(--text-sm);
  font-weight: 600;
}

.campo__obrigatorio {
  color: var(--color-danger);
  margin-left: 2px;
}

.select {
  position: relative;
}

.select__input {
  appearance: none;
  width: 100%;
  min-height: 42px;
  padding: var(--space-2) 2.25rem var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  text-overflow: ellipsis;
  transition: border-color var(--duration-fast);
}

.select__input:hover {
  border-color: var(--color-steel);
}

.select__input:focus-visible {
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px var(--color-primary);
  border-radius: var(--radius-md);
}

.select__seta {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  translate: 0 -50%;
  pointer-events: none;
  color: var(--color-text-muted);
}

.campo--erro .select__input {
  border-color: var(--color-danger);
}

.campo__dica {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.campo__erro {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-danger);
}
</style>
