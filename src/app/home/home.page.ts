/**
 * Dashboard - Página Principal
 * Mostra resumo das tarefas, progresso e alertas
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService, TaskService } from '../services';
import { Project, Task } from '../models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  /** Saudação baseada na hora */
  greeting = '';
  
  /** Data atual */
  currentDate = new Date();
  
  /** Tarefas em atraso */
  overdueTasks: Task[] = [];
  
  /** Próximas tarefas (7 dias) */
  upcomingTasks: Task[] = [];
  
  /** Lista de projetos (para nomes) */
  projects: Project[] = [];
  
  /** Contadores */
  totalTasks = 0;
  completedTasks = 0;
  
  /** Percentagem de progresso */
  progressPercent = 0;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {
    this.setGreeting();
  }

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
   * Define a saudação baseada na hora do dia
   */
  setGreeting(): void {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Bom dia! ☀️';
    } else if (hour < 19) {
      this.greeting = 'Boa tarde! 🌤️';
    } else {
      this.greeting = 'Boa noite! 🌙';
    }
  }

  /**
   * Carrega todos os dados necessários para o dashboard
   */
  async loadData(): Promise<void> {
    // Carregar projetos
    this.projects = await this.projectService.getAll();
    
    // Carregar todas as tarefas
    const tasks = await this.taskService.getAll();
    this.totalTasks = tasks.length;
    this.completedTasks = tasks.filter(t => t.completed).length;
    
    // Calcular progresso
    this.progressPercent = this.totalTasks > 0 
      ? Math.round((this.completedTasks / this.totalTasks) * 100) 
      : 0;
    
    // Carregar tarefas em atraso
    this.overdueTasks = await this.taskService.getOverdue();
    
    // Carregar próximas tarefas (não concluídas, nos próximos 7 dias)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    this.upcomingTasks = tasks
      .filter(t => {
        if (t.completed) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5); // Máximo 5 tarefas
  }

  /**
   * Obtém o nome do projeto
   */
  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : 'Projeto';
  }

  /**
   * Obtém a cor da prioridade
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  /**
   * Obtém o label da prioridade
   */
  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return '';
    }
  }

  /**
   * Navega para a página de projetos
   */
  goToProjects(): void {
    this.router.navigate(['/tabs/projects']);
  }

  /**
   * Navega para os detalhes de uma tarefa
   */
  goToTask(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }
}
