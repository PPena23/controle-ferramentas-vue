import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import PainelView from '@/views/PainelView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    titulo?: string
  }
}

// O painel entra no bundle principal; as demais telas são carregadas sob demanda (code splitting).
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'painel', component: PainelView, meta: { titulo: 'Painel' } },
  {
    path: '/ferramentas',
    name: 'ferramentas',
    component: () => import('@/views/FerramentasView.vue'),
    meta: { titulo: 'Ferramentas' },
  },
  {
    path: '/ferramentas/nova',
    name: 'ferramenta-nova',
    component: () => import('@/views/FerramentaFormView.vue'),
    meta: { titulo: 'Nova ferramenta' },
  },
  {
    path: '/ferramentas/:id',
    name: 'ferramenta-detalhe',
    component: () => import('@/views/FerramentaDetalheView.vue'),
    props: true, // o :id chega como prop, desacoplando a view do objeto route
    meta: { titulo: 'Ferramenta' },
  },
  {
    path: '/ferramentas/:id/editar',
    name: 'ferramenta-editar',
    component: () => import('@/views/FerramentaFormView.vue'),
    props: true,
    meta: { titulo: 'Editar ferramenta' },
  },
  {
    path: '/emprestimos',
    name: 'emprestimos',
    component: () => import('@/views/EmprestimosView.vue'),
    meta: { titulo: 'Empréstimos' },
  },
  {
    path: '/historico',
    name: 'historico',
    component: () => import('@/views/HistoricoView.vue'),
    meta: { titulo: 'Histórico' },
  },
  {
    path: '/:caminho(.*)*',
    name: 'nao-encontrado',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { titulo: 'Página não encontrada' },
  },
]

export const router = createRouter({
  // Hash history: no GitHub Pages não há fallback de rotas no servidor, então F5 funciona sempre.
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, salvo) {
    if (salvo) return salvo
    if (to.path === from.path) return false // só mudou a query (filtros): mantém a rolagem
    return { top: 0 }
  },
})

// Guard global: atualiza o título da aba a cada navegação.
router.afterEach((to) => {
  document.title = to.meta.titulo ? `${to.meta.titulo} · Almoxarifado de Ferramentas` : 'Almoxarifado de Ferramentas'
})
