/**
 * Página de Calendário
 * Mostra as datas limite das tarefas num calendário
 * Permite visualizar e editar tarefas ao selecionar uma data
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService, ProjectService } from '../../services';
import { Task, Project } from '../../models';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: false
})
export class CalendarPage implements OnInit {
  /** Data selecionada */
  selectedDate: string = new Date().toISOString();
  
  /** Tarefas da data selecionada */
  tasksForDate: Task[] = [];
  
  /** Todas as tarefas (para marcar datas) */
  allTasks: Task[] = [];
  
  /** Projetos (para mostrar nome) */
  projects: Map<string, Project> = new Map();
  
  /** Datas que têm tarefas (para destacar no calendário) */
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];

  constructor(
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  /**
   * Recarrega dados quando a página fica visível
   */
  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  /**
   * Carrega todas as tarefas e projetos
   */
  async loadData(): Promise<void> {
    // Carregar tarefas
    this.allTasks = await this.taskService.getAll();
    
    // Carregar projetos
    const projectsList = await this.projectService.getAll();
    this.projects.clear();
    projectsList.forEach(proj => this.projects.set(proj.id, proj));
    
    // Preparar datas destacadas
    this.prepareHighlightedDates();
    
    // Carregar tarefas da data selecionada
    await this.loadTasksForSelectedDate();
  }

  /**
   * Prepara as datas a destacar no calendário
   */
  prepareHighlightedDates(): void {
    const dateMap = new Map<string, { completed: number; pending: number; overdue: number }>();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    this.allTasks.forEach(task => {
      const date = new Date(task.dueDate);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { completed: 0, pending: 0, overdue: 0 });
      }

      const counts = dateMap.get(dateStr)!;
      if (task.completed) {
        counts.completed++;
      } else if (date < now) {
        counts.overdue++;
      } else {
        counts.pending++;
      }
    });

    this.highlightedDates = Array.from(dateMap.entries()).map(([dateStr, counts]) => {
      let backgroundColor = '';
      let textColor = '#ffffff';

      if (counts.overdue > 0) {
        backgroundColor = '#eb445a'; // danger
      } else if (counts.pending > 0) {
        backgroundColor = '#3880ff'; // primary
      } else {
        backgroundColor = '#2dd36f'; // success
        textColor = '#000000';
      }

      return { date: dateStr, textColor, backgroundColor };
    });
  }

  /**
   * Handler para mudança de data no calendário
   */
  async onDateChange(event: any): Promise<void> {
    this.selectedDate = event.detail.value;
    await this.loadTasksForSelectedDate();
  }

  /**
   * Carrega tarefas para a data selecionada
   */
  async loadTasksForSelectedDate(): Promise<void> {
    const selectedDateObj = new Date(this.selectedDate);
    this.tasksForDate = await this.taskService.getByDate(selectedDateObj);
    
    // Ordenar: em atraso primeiro, depois pendentes, depois concluídas
    this.tasksForDate.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (this.isOverdue(a) !== this.isOverdue(b)) return this.isOverdue(a) ? -1 : 1;
      return 0;
    });
  }

  /**
   * Verifica se uma tarefa está em atraso
   */
  isOverdue(task: Task): boolean {
    if (task.completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }

  /**
   * Obtém nome do projeto
   */
  getProjectName(projectId: string): string {
    return this.projects.get(projectId)?.name || 'Projeto desconhecido';
  }

  /**
   * Obtém cor da prioridade
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
   * Navega para detalhes da tarefa
   */
  goToTaskDetail(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }

  /**
   * Formata a data selecionada para exibição
   */
  getFormattedSelectedDate(): string {
    const date = new Date(this.selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Hoje';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getTime() === yesterday.getTime()) {
      return 'Ontem';
    }

    return date.toLocaleDateString('pt-PT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  /**
   * Conta tarefas por estado
   */
  getTaskStats(): { total: number; completed: number; pending: number; overdue: number } {
    const stats = { total: 0, completed: 0, pending: 0, overdue: 0 };
    stats.total = this.tasksForDate.length;
    this.tasksForDate.forEach(task => {
      if (task.completed) {
        stats.completed++;
      } else if (this.isOverdue(task)) {
        stats.overdue++;
      } else {
        stats.pending++;
      }
    });
    return stats;
  }
}
