<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'

defineOptions({ inheritAttrs: false })

// class/style ficam no wrapper (para layout em grid); o resto dos atributos vai para o controle nativo.
const attrs = useAttrs()
const atributosDoControle = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([chave]) => chave !== 'class' && chave !== 'style')),
) // atributos extras (min, max, list…) vão para o <input>, não para o wrapper

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    rotulo: string
    tipo?: 'text' | 'number' | 'date' | 'search' | 'email'
    erro?: string
    dica?: string
    obrigatorio?: boolean
    multilinha?: boolean
    /** Texto fixo à esquerda do campo, ex.: "R$". */
    prefixo?: string
    /** Esconde o rótulo visualmente (continua disponível para leitores de tela). */
    rotuloOculto?: boolean
  }>(),
  { tipo: 'text' },
)

const emit = defineEmits<{
  'update:modelValue': [valor: string | number]
  blur: []
}>()

const id = useId()
const idErro = `${id}-erro`
const idDica = `${id}-dica`

const descritoPor = computed(() => [props.erro && idErro, props.dica && idDica].filter(Boolean).join(' ') || undefined)

// Em campos numéricos, NaN representa "vazio" e é exibido como string vazia.
const valorExibido = computed(() =>
  typeof props.modelValue === 'number' && Number.isNaN(props.modelValue) ? '' : props.modelValue,
)

function aoDigitar(evento: Event) {
  const alvo = evento.target as HTMLInputElement | HTMLTextAreaElement
  if (props.tipo === 'number') {
    emit('update:modelValue', alvo.value === '' ? Number.NaN : Number(alvo.value))
  } else {
    emit('update:modelValue', alvo.value)
  }
}
</script>

<template>
  <div class="campo" :class="[{ 'campo--erro': erro }, $attrs.class]" :style="$attrs.style as string | undefined">
    <label :for="id" class="campo__rotulo" :class="{ 'sr-only': rotuloOculto }">
      {{ rotulo }}
      <span v-if="obrigatorio" class="campo__obrigatorio" aria-hidden="true">*</span>
    </label>

    <div class="campo__controle" :class="{ 'campo__controle--prefixo': prefixo }">
      <span v-if="prefixo" class="campo__prefixo" aria-hidden="true">{{ prefixo }}</span>
      <textarea
        v-if="multilinha"
        :id="id"
        class="campo__input campo__input--multilinha"
        :value="valorExibido"
        :aria-invalid="erro ? 'true' : undefined"
        :aria-describedby="descritoPor"
        :required="obrigatorio"
        rows="3"
        v-bind="atributosDoControle"
        @input="aoDigitar"
        @blur="emit('blur')"
      />
      <input
        v-else
        :id="id"
        class="campo__input"
        :type="tipo"
        :value="valorExibido"
        :aria-invalid="erro ? 'true' : undefined"
        :aria-describedby="descritoPor"
        :required="obrigatorio"
        v-bind="atributosDoControle"
        @input="aoDigitar"
        @blur="emit('blur')"
      />
    </div>

    <p v-if="dica && !erro" :id="idDica" class="campo__dica">{{ dica }}</p>
    <Transition name="fade">
      <p v-if="erro" :id="idErro" class="campo__erro" role="alert">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M12 8v5M12 16.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
        {{ erro }}
      </p>
    </Transition>
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
  color: var(--color-text);
}

.campo__obrigatorio {
  color: var(--color-danger);
  margin-left: 2px;
}

.campo__controle {
  position: relative;
}

.campo__prefixo {
  position: absolute;
  inset: 0 auto 0 0;
  display: grid;
  place-items: center;
  width: 2.6rem;
  border-right: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
  pointer-events: none;
}

.campo__input {
  width: 100%;
  min-height: 42px;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color var(--duration-fast),
    box-shadow var(--duration-fast);
}

.campo__controle--prefixo .campo__input {
  padding-left: 3.1rem;
}

.campo__input--multilinha {
  resize: vertical;
  min-height: 84px;
}

.campo__input::placeholder {
  color: var(--color-text-soft);
}

.campo__input:hover {
  border-color: var(--color-steel);
}

.campo__input:focus-visible {
  border-color: var(--color-ink);
  box-shadow: 0 0 0 3px var(--color-primary);
  border-radius: var(--radius-md);
}

.campo--erro .campo__input {
  border-color: var(--color-danger);
  background: #fffafa;
}

.campo--erro .campo__input:focus-visible {
  box-shadow: 0 0 0 3px var(--color-danger-soft);
}

.campo__dica {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.campo__erro {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-danger);
}

.campo__erro svg {
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-danger-soft);
}
</style>
