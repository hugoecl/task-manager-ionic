/**
 * Módulo de Routing Principal da Aplicação
 * Define todas as rotas e a navegação entre páginas
 */
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  // Rota inicial - redireciona para home
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  // Página inicial (dashboard)
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  // Gestão de categorias
  {
    path: 'categories',
    loadChildren: () => import('./pages/categories/categories.module').then(m => m.CategoriesPageModule)
  },
  // Lista de projetos (pode filtrar por categoria)
  {
    path: 'projects',
    loadChildren: () => import('./pages/projects/projects.module').then(m => m.ProjectsPageModule)
  },
  // Projetos filtrados por categoria específica
  {
    path: 'projects/category/:categoryId',
    loadChildren: () => import('./pages/projects/projects.module').then(m => m.ProjectsPageModule)
  },
  // Lista de tarefas de um projeto específico
  {
    path: 'tasks/:projectId',
    loadChildren: () => import('./pages/tasks/tasks.module').then(m => m.TasksPageModule)
  },
  // Detalhes de uma tarefa específica
  {
    path: 'task-detail/:taskId',
    loadChildren: () => import('./pages/task-detail/task-detail.module').then(m => m.TaskDetailPageModule)
  },
  // Calendário com datas limite das tarefas
  {
    path: 'calendar',
    loadChildren: () => import('./pages/calendar/calendar.module').then(m => m.CalendarPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
