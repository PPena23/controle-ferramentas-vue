<script setup lang="ts">
import { ref } from 'vue'
import { simularFalhaNaProximaRequisicao } from '@/services/api'
import { useDados } from '@/composables/useDados'
import { mensagemDeErro, useToast } from '@/composables/useToast'
import BaseButton from '@/components/base/BaseButton.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'

const { restaurarExemplo, carregarTudo, carregando } = useDados()
const toast = useToast()

const confirmandoRestauracao = ref(false)
const restaurando = ref(false)

async function restaurar() {
  restaurando.value = true
  try {
    await restaurarExemplo()
    toast.sucesso('Dados de exemplo restaurados', 'O catálogo, os empréstimos e o histórico voltaram ao estado inicial.')
    confirmandoRestauracao.value = false
  } catch (e) {
    toast.erro('Não foi possível restaurar', mensagemDeErro(e))
  } finally {
    restaurando.value = false
  }
}

/** Arma uma falha e recarrega os dados: a tela atual exibe o estado de erro com "Tentar novamente". */
async function simularFalha() {
  simularFalhaNaProximaRequisicao()
  await carregarTudo()
  window.scrollTo({ top: 0, behavior: 'smooth' })
  toast.aviso('Falha de rede simulada', 'Veja o estado de erro no topo da página e use "Tentar novamente".')
}
</script>

<template>
  <footer class="rodape">
    <div class="container rodape__grade">
      <div class="rodape__sobre">
        <p>
          <strong>Almoxarifado de Ferramentas</strong> — projeto de portfólio em Vue 3 + TypeScript.
          Todos os dados são <strong>fictícios</strong> e ficam salvos apenas no seu navegador.
        </p>
        <p class="rodape__autor">
          Feito por Pedro Pena ·
          <a class="link" href="https://www.linkedin.com/in/pedropena23/" target="_blank" rel="noopener">LinkedIn</a> ·
          <a class="link" href="https://github.com/PPena23" target="_blank" rel="noopener">GitHub</a>
        </p>
      </div>

      <div class="rodape__demo" role="group" aria-labelledby="titulo-demo">
        <p id="titulo-demo" class="eyebrow">Controles da demonstração</p>
        <div class="rodape__botoes">
          <BaseButton tamanho="sm" icone="refresh" @click="confirmandoRestauracao = true">
            Restaurar dados de exemplo
          </BaseButton>
          <BaseButton tamanho="sm" icone="wifi" variante="fantasma" :carregando="carregando" @click="simularFalha">
            Simular falha de rede
          </BaseButton>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :aberto="confirmandoRestauracao"
      titulo="Restaurar dados de exemplo?"
      mensagem="Todas as ferramentas, empréstimos e movimentações que você criou ou alterou serão substituídos pelos dados fictícios originais."
      rotulo-confirmar="Restaurar"
      perigoso
      :carregando="restaurando"
      @confirmar="restaurar"
      @cancelar="confirmandoRestauracao = false"
    />
  </footer>
</template>

<style scoped>
.rodape {
  margin-top: var(--space-12);
  padding: var(--space-8) 0 calc(var(--bottom-nav-height) + var(--space-8));
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
  font-size: var(--text-sm);
}

@media (min-width: 900px) {
  .rodape {
    padding-bottom: var(--space-8);
  }
}

.rodape__grade {
  display: grid;
  gap: var(--space-6);
}

@media (min-width: 900px) {
  .rodape__grade {
    grid-template-columns: 1.4fr 1fr;
    align-items: start;
  }
}

.rodape__sobre {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  color: var(--color-text-muted);
  max-width: 60ch;
}

.rodape__autor {
  color: var(--color-text);
}

.rodape__demo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rodape__botoes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
