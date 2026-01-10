/**
 * Página de Calendário
 * Mostra as datas limite das tarefas num calendário
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
  selectedDate: string = new Date().toISOString();
  tasksForDate: Task[] = [];
  allTasks: Task[] = [];
  projects: Map<string, Project> = new Map();
  highlightedDates: { date: string; textColor: string; backgroundColor: string }[] = [];

  constructor(
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.allTasks = await this.taskService.getAll();
    
    const projectsList = await this.projectService.getAll();
    this.projects.clear();
    projectsList.forEach((proj: Project) => this.projects.set(proj.id, proj));
    
    this.prepareHighlightedDates();
    await this.loadTasksForSelectedDate();
  }

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

    this.highlightedDates = Array.from(dateMap.entries())
      .map(([dateStr, counts]) => {
        let backgroundColor = '';
        let textColor = '#ffffff';

        // Prioriza: Atraso > Pendentes > Apenas Concluídas
        if (counts.overdue > 0) {
          backgroundColor = '#B8550A'; // Laranja-vermelho bem escuro para atraso (bem distinto)
        } else if (counts.pending > 0) {
          backgroundColor = '#E68A2E'; // Laranja suave para pendentes
        } else if (counts.completed > 0 && counts.pending === 0 && counts.overdue === 0) {
          backgroundColor = '#4CAF50'; // Verde apenas se SÓ houver tarefas concluídas (sem pendentes ou atraso)
          textColor = '#ffffff';
        }

        // Só retorna se houver uma cor definida
        if (backgroundColor) {
          return { date: dateStr, textColor, backgroundColor };
        }
        
        return null;
      })
      .filter((item): item is { date: string; textColor: string; backgroundColor: string } => item !== null);
  }

  async onDateChange(event: any): Promise<void> {
    this.selectedDate = event.detail.value;
    await this.loadTasksForSelectedDate();
  }

  async loadTasksForSelectedDate(): Promise<void> {
    const selectedDateObj = new Date(this.selectedDate);
    this.tasksForDate = await this.taskService.getByDate(selectedDateObj);
    
    this.tasksForDate.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (this.isOverdue(a) !== this.isOverdue(b)) return this.isOverdue(a) ? -1 : 1;
      return 0;
    });
  }

  isOverdue(task: Task): boolean {
    if (task.completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }

  getProjectName(projectId: string): string {
    return this.projects.get(projectId)?.name || 'Projeto desconhecido';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  goToTaskDetail(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }

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
