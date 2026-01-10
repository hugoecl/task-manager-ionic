/**
 * Módulo de Routing Principal da Aplicação
 * Define todas as rotas e a navegação entre páginas
 */
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Rota inicial - redireciona para welcome
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  // Página de boas-vindas (SEM tabs)
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then(m => m.WelcomePageModule)
  },
  // Tabs (navegação principal COM tabs)
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.module').then(m => m.TabsPageModule)
  },
  // Página Sobre (acessível via side menu)
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then(m => m.AboutPageModule)
  },
  // Página Perguntas/FAQ (acessível via side menu)
  {
    path: 'faq',
    loadChildren: () => import('./pages/faq/faq.module').then(m => m.FaqPageModule)
  },
  // Rotas de detalhe (fora das tabs mas acessíveis)
  {
    path: 'tasks/:projectId',
    loadChildren: () => import('./pages/tasks/tasks.module').then(m => m.TasksPageModule)
  },
  {
    path: 'task-detail/:taskId',
    loadChildren: () => import('./pages/task-detail/task-detail.module').then(m => m.TaskDetailPageModule)
  },
  {
    path: 'projects/category/:categoryId',
    loadChildren: () => import('./pages/projects/projects.module').then(m => m.ProjectsPageModule)
  },
  // Fallback - redireciona rotas antigas para tabs
  {
    path: 'home',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'projects',
    redirectTo: 'tabs/projects',
    pathMatch: 'full'
  },
  {
    path: 'calendar',
    redirectTo: 'tabs/calendar',
    pathMatch: 'full'
  },
  {
    path: 'categories',
    redirectTo: 'tabs/categories',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
