/**
 * Página Principal (Dashboard)
 * Mostra resumo das tarefas, categorias e acesso rápido às funcionalidades
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CategoryService, ProjectService, TaskService } from '../services';
import { Category, Task } from '../models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  /** Lista de categorias */
  categories: Category[] = [];
  
  /** Tarefas em atraso */
  overdueTasks: Task[] = [];
  
  /** Contadores */
  totalProjects = 0;
  totalTasks = 0;
  completedTasks = 0;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  /**
   * Carrega os dados quando a página é inicializada
   */
  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  /**
   * Recarrega os dados quando a página volta a ser exibida
   */
  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  /**
   * Carrega todos os dados necessários para o dashboard
   */
  async loadData(): Promise<void> {
    // Carregar categorias
    this.categories = await this.categoryService.getAll();
    
    // Carregar projetos
    const projects = await this.projectService.getAll();
    this.totalProjects = projects.length;
    
    // Carregar tarefas
    const tasks = await this.taskService.getAll();
    this.totalTasks = tasks.length;
    this.completedTasks = tasks.filter(t => t.completed).length;
    
    // Carregar tarefas em atraso
    this.overdueTasks = await this.taskService.getOverdue();
  }

  /**
   * Navega para a página de categorias
   */
  goToCategories(): void {
    this.router.navigate(['/categories']);
  }

  /**
   * Navega para a página de projetos filtrada por categoria
   * @param categoryId - ID da categoria (opcional)
   */
  goToProjects(categoryId?: string): void {
    if (categoryId) {
      this.router.navigate(['/projects/category', categoryId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  /**
   * Navega para o calendário
   */
  goToCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  /**
   * Navega para os detalhes de uma tarefa
   * @param taskId - ID da tarefa
   */
  goToTask(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }
}
