/**
 * Página de Gestão de Tarefas
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ItemReorderEventDetail } from '@ionic/angular';
import { ProjectService, TaskService, NotificationService, TranslationService } from '../../services';
import { Project, Task } from '../../models';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: false
})
export class TasksPage implements OnInit {
  projectId: string = '';
  project: Project | null = null;
  projects: Project[] = [];
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  filter: 'all' | 'pending' | 'completed' | 'overdue' = 'all';
  reorderEnabled = false;
  isTabMode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private projectService: ProjectService,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private translation: TranslationService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      this.projectId = params['projectId'] || '';
      this.isTabMode = !this.projectId;
      await this.loadData();
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.projects = await this.projectService.getAll();
    
    if (this.projectId) {
      this.project = await this.projectService.getById(this.projectId) || null;
      this.tasks = await this.taskService.getByProject(this.projectId);
    } else {
      this.tasks = await this.taskService.getAll();
    }
    
    this.applyFilter();
  }

  applyFilter(): void {
    switch (this.filter) {
      case 'pending':
        this.filteredTasks = this.tasks.filter(t => !t.completed);
        break;
      case 'completed':
        this.filteredTasks = this.tasks.filter(t => t.completed);
        break;
      case 'overdue':
        this.filteredTasks = this.tasks.filter(t => this.isOverdue(t));
        break;
      default:
        this.filteredTasks = [...this.tasks];
    }
    
    this.filteredTasks.sort((a, b) => {
      if (this.isOverdue(a) && !this.isOverdue(b)) return -1;
      if (!this.isOverdue(a) && this.isOverdue(b)) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  setFilter(filter: 'all' | 'pending' | 'completed' | 'overdue'): void {
    this.filter = filter;
    this.applyFilter();
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : '';
  }

  isOverdue(task: Task): boolean {
    if (task.completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }

  isDueToday(task: Task): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === now.getTime();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  async toggleComplete(task: Task): Promise<void> {
    await this.taskService.toggleComplete(task.id);
    await this.loadData();
      this.showToast(task.completed ? this.translation.task('taskReopened') : this.translation.task('taskCompleted'));
  }

  async addTask(): Promise<void> {
    if (this.isTabMode && this.projects.length > 0) {
      await this.selectProjectAndAddTask();
      return;
    }
    await this.createTask(this.projectId);
  }

  async selectProjectAndAddTask(): Promise<void> {
    if (this.projects.length === 0) {
      this.showToast(this.translation.category('createCategoryFirst'), 'warning');
      return;
    }

    const inputs = this.projects.map((p, i) => ({
      name: 'project', 
      type: 'radio' as const, 
      label: p.name, 
      value: p.id, 
      checked: i === 0
    }));

    const alert = await this.alertController.create({
      header: this.translation.task('selectProject'),
      message: this.translation.task('selectProjectMessage'),
      inputs,
      cssClass: 'custom-alert',
      buttons: [
        { 
          text: this.translation.common('cancel'), 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        { 
          text: 'Continuar', 
          cssClass: 'alert-button-confirm',
          handler: async (projectId) => { 
            if (projectId) await this.createTask(projectId); 
          }
        }
      ]
    });
    await alert.present();
  }

  async createTask(projectId: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Primeiro, pedir a prioridade
    const priorityAlert = await this.alertController.create({
      header: this.translation.task('selectPriority'),
      message: this.translation.task('selectPriorityMessage'),
      inputs: [
        { name: 'priority', type: 'radio', label: `🔴 ${this.translation.task('priorityHigh')}`, value: 'high' },
        { name: 'priority', type: 'radio', label: `🟡 ${this.translation.task('priorityMedium')}`, value: 'medium', checked: true },
        { name: 'priority', type: 'radio', label: `🟢 ${this.translation.task('priorityLow')}`, value: 'low' }
      ],
      cssClass: 'custom-alert',
      buttons: [
        { 
          text: this.translation.common('cancel'), 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: this.translation.common('continue'),
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            const priority = data || 'medium';
            // Agora mostrar o alert principal com os campos
            await this.showTaskForm(projectId, priority, tomorrow);
            return true;
          }
        }
      ]
    });

    await priorityAlert.present();
  }

  private async showTaskForm(projectId: string, priority: string, defaultDate: Date): Promise<void> {
    const priorityLabels: { [key: string]: string } = {
      'high': this.translation.task('priorityHighLabel'),
      'medium': this.translation.task('priorityMediumLabel'),
      'low': this.translation.task('priorityLowLabel')
    };

    const alert = await this.alertController.create({
      header: this.translation.task('newTask'),
      message: `${this.translation.task('createTaskForm')}\n\n${this.translation.task('selectedPriority')}: ${priorityLabels[priority] || this.translation.task('priorityMediumLabel')}`,
      inputs: [
        { 
          name: 'title', 
          type: 'text', 
          placeholder: this.translation.placeholder('taskTitle'),
          attributes: { required: true, maxlength: 100, autocomplete: 'off' }
        },
        { 
          name: 'description', 
          type: 'textarea', 
          placeholder: this.translation.placeholder('taskDescription'),
          attributes: { rows: 4, maxlength: 500 }
        },
        { 
          name: 'dueDate', 
          type: 'date', 
          value: defaultDate.toISOString().split('T')[0],
          placeholder: 'Data limite'
        }
      ],
      cssClass: 'custom-alert professional-form',
      buttons: [
        { 
          text: this.translation.common('cancel'), 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: this.translation.task('newTask'),
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            if (data.title?.trim()) {
              const newTask = await this.taskService.create({
                title: data.title.trim(),
                description: data.description?.trim() || '',
                dueDate: new Date(data.dueDate),
                projectId,
                completed: false,
                priority: priority as 'low' | 'medium' | 'high'
              });
              // Agendar notificações para a nova tarefa
              await this.notificationService.scheduleTaskNotifications(newTask);
              await this.loadData();
              this.showToast(this.translation.task('taskCreated'));
              return true;
            } else {
              this.showToast(this.translation.task('taskTitleRequired'), 'warning');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
    
    // Adicionar labels visuais após o alert ser apresentado
    setTimeout(() => {
      const inputGroup = document.querySelector('.professional-form .alert-input-group');
      if (inputGroup) {
        const inputs = inputGroup.querySelectorAll('.alert-input-wrapper');
        inputs.forEach((wrapper) => {
          const input = wrapper.querySelector('input, textarea');
          if (input) {
            const name = (input as HTMLInputElement).name;
            const isRequired = input.hasAttribute('required');
            let label = '';
            
            if (name === 'title') {
              label = this.translation.label('taskTitleLabel');
              if (isRequired) label += ' *';
            } else if (name === 'description') {
              label = this.translation.label('taskDescriptionLabel');
            } else if (name === 'dueDate') {
              label = this.translation.label('dueDateLabel');
            }
            
            if (label && !wrapper.querySelector('.field-label')) {
              const labelElement = document.createElement('div');
              labelElement.className = 'field-label';
              labelElement.textContent = label;
              labelElement.style.cssText = 'color: #E68A2E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px; padding-left: 4px;';
              wrapper.insertBefore(labelElement, wrapper.firstChild);
            }
          }
        });
      }
    }, 150);
  }

  goToTaskDetail(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }

  async deleteTask(task: Task, event: Event): Promise<void> {
    event.stopPropagation();
    const alert = await this.alertController.create({
      header: this.translation.task('deleteTask'),
      message: `${this.translation.task('deleteTaskMessage')} "${task.title}"?`,
      buttons: [
        { text: this.translation.common('cancel'), role: 'cancel' },
        { text: this.translation.common('delete'), cssClass: 'danger', handler: async () => {
          // Cancelar notificações da tarefa antes de deletar
          await this.notificationService.cancelTaskNotifications(task.id);
          await this.taskService.delete(task.id);
          await this.loadData();
          this.showToast(this.translation.task('taskDeleted'));
        }}
      ]
    });
    await alert.present();
  }

  toggleReorder(): void {
    this.reorderEnabled = !this.reorderEnabled;
  }

  async handleReorder(event: CustomEvent<ItemReorderEventDetail>): Promise<void> {
    const movedItem = this.filteredTasks.splice(event.detail.from, 1)[0];
    this.filteredTasks.splice(event.detail.to, 0, movedItem);
    if (this.projectId) {
      await this.taskService.reorder(this.projectId, this.filteredTasks.map(t => t.id));
    }
    event.detail.complete();
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message, 
      duration: 2000, 
      position: 'bottom', 
      color: color === 'warning' ? 'warning' : color === 'danger' ? 'danger' : 'success'
    });
    await toast.present();
  }
}
