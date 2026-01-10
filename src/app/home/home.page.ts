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
  greeting = '';
  currentDate = new Date();
  overdueTasks: Task[] = [];
  upcomingTasks: Task[] = [];
  projects: Project[] = [];
  totalTasks = 0;
  completedTasks = 0;
  progressPercent = 0;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {
    this.setGreeting();
  }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  setGreeting(): void {
    this.greeting = 'Bem-vindo!';
  }

  async loadData(): Promise<void> {
    this.projects = await this.projectService.getAll();
    
    const tasks = await this.taskService.getAll();
    this.totalTasks = tasks.length;
    this.completedTasks = tasks.filter((t: Task) => t.completed).length;
    
    this.progressPercent = this.totalTasks > 0 
      ? Math.round((this.completedTasks / this.totalTasks) * 100) 
      : 0;
    
    this.overdueTasks = await this.taskService.getOverdue();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    this.upcomingTasks = tasks
      .filter((t: Task) => {
        if (t.completed) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .sort((a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : 'Projeto';
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return '';
    }
  }

  goToProjects(): void {
    this.router.navigate(['/tabs/projects']);
  }

  goToTask(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }

  goToOverdueTasks(): void {
    this.router.navigate(['/tabs/tasks'], { queryParams: { filter: 'overdue' } });
  }
}
