/**
 * Página de Gestão de Tarefas
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ItemReorderEventDetail, ActionSheetController } from '@ionic/angular';
import { ProjectService, TaskService, NotificationService, TranslationService, UtilsService } from '../../services';
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
    private actionSheetController: ActionSheetController,
    private projectService: ProjectService,
    private taskService: TaskService,
    private notificationService: NotificationService,
    private translation: TranslationService,
    private utils: UtilsService
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
    return this.utils.isOverdue(task.dueDate, task.completed);
  }

  isDueToday(task: Task): boolean {
    return this.utils.isToday(task.dueDate);
  }

  getPriorityColor(priority: string): string {
    return this.utils.getPriorityColor(priority);
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

    // Criar botões para cada projeto
    const buttons: any[] = this.projects.map(project => ({
      text: project.name,
      handler: async () => {
        await this.createTask(project.id);
      }
    }));

    // Adicionar botão de cancelar no final
    buttons.push({
      text: this.translation.common('cancel'),
      role: 'cancel',
      cssClass: 'action-sheet-cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: this.translation.task('selectProject'),
      subHeader: this.translation.task('selectProjectMessage'),
      buttons: buttons,
      cssClass: 'project-selection-sheet'
    });

    await actionSheet.present();
    
    // Injetar estilos diretamente no shadow DOM
    setTimeout(() => {
      this.injectActionSheetStyles(actionSheet, 'project-selection-sheet');
    }, 100);
  }

  async createTask(projectId: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Criar ActionSheet para seleção de prioridade
    const priorityButtons: any[] = [
      {
        text: `🔴 ${this.translation.task('priorityHigh')}`,
        handler: async () => {
          await this.showTaskForm(projectId, 'high', tomorrow);
        }
      },
      {
        text: `🟡 ${this.translation.task('priorityMedium')}`,
        handler: async () => {
          await this.showTaskForm(projectId, 'medium', tomorrow);
        }
      },
      {
        text: `🟢 ${this.translation.task('priorityLow')}`,
        handler: async () => {
          await this.showTaskForm(projectId, 'low', tomorrow);
        }
      },
      {
        text: this.translation.common('cancel'),
        role: 'cancel',
        cssClass: 'action-sheet-cancel'
      }
    ];

    const prioritySheet = await this.actionSheetController.create({
      header: this.translation.task('selectPriority'),
      subHeader: this.translation.task('selectPriorityMessage'),
      buttons: priorityButtons,
      cssClass: 'priority-selection-sheet'
    });

    await prioritySheet.present();
    
    // Injetar estilos diretamente no shadow DOM
    setTimeout(() => {
      this.injectActionSheetStyles(prioritySheet, 'priority-selection-sheet');
    }, 100);
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

  private injectActionSheetStyles(actionSheet: HTMLIonActionSheetElement, cssClass: string): void {
    // Aguardar o ActionSheet ser totalmente renderizado
    setTimeout(() => {
      const hostElement = document.querySelector('ion-action-sheet');
      if (!hostElement) return;

      // Tentar acessar o shadowRoot
      const shadowRoot = (hostElement as any).shadowRoot;
      if (shadowRoot) {
        const style = document.createElement('style');
        style.textContent = `
          .action-sheet-container {
            background: #3D4A5C !important;
            border-radius: 16px 16px 0 0 !important;
            border-top: 3px solid #E68A2E !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-bottom: none !important;
            box-shadow: none !important;
          }
          
          .action-sheet-title {
            color: #F7FAFC !important;
            font-weight: 700 !important;
            font-size: 18px !important;
            padding: 20px 20px 12px !important;
            background: transparent !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          
          .action-sheet-title::before {
            display: none !important;
          }
          
          .action-sheet-sub-title {
            color: #A0AEC0 !important;
            font-size: 14px !important;
            padding: 0 20px 16px !important;
            font-weight: 400 !important;
            line-height: 1.5 !important;
          }
          
          .action-sheet-button {
            color: #F7FAFC !important;
            font-weight: 600 !important;
            font-size: 15px !important;
            padding: 16px 20px !important;
            min-height: 56px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            background: transparent !important;
            border-left: 3px solid transparent !important;
            transition: all 0.2s ease !important;
            margin: 0 12px 6px !important;
            border-radius: 12px !important;
            position: relative !important;
            text-align: left !important;
            white-space: normal !important;
            line-height: 1.5 !important;
          }
          
          .action-sheet-button:last-of-type:not(.action-sheet-cancel) {
            border-bottom: none !important;
            margin-bottom: 8px !important;
          }
          
          .action-sheet-button:hover {
            background: rgba(255, 255, 255, 0.05) !important;
            border-left-color: #E68A2E !important;
          }
          
          .action-sheet-button:active {
            background: rgba(255, 255, 255, 0.08) !important;
            border-left-color: #D4740F !important;
            transform: scale(0.98) !important;
          }
          
          .action-sheet-button.action-sheet-cancel {
            background: #4A5568 !important;
            color: #CBD5E0 !important;
            font-weight: 600 !important;
            margin: 16px 12px 12px !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-radius: 12px !important;
            border-left: none !important;
            padding: 16px 20px !important;
            font-size: 15px !important;
            box-shadow: none !important;
            text-align: center !important;
          }
          
          .action-sheet-button.action-sheet-cancel:hover {
            background: #5A6575 !important;
          }
          
          .action-sheet-button.action-sheet-cancel:active {
            background: #4A5568 !important;
            transform: scale(0.98) !important;
          }
        `;
        shadowRoot.appendChild(style);
      } else {
        // Fallback: aplicar estilos globalmente se shadowRoot não estiver acessível
        const styleId = `action-sheet-styles-${cssClass}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `
            ion-action-sheet.${cssClass} .action-sheet-container {
              background: #3D4A5C !important;
              border-radius: 16px 16px 0 0 !important;
              border-top: 3px solid #E68A2E !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              border-bottom: none !important;
              box-shadow: none !important;
            }
            
            ion-action-sheet.${cssClass} .action-sheet-title {
              color: #F7FAFC !important;
              font-weight: 700 !important;
              font-size: 18px !important;
              padding: 20px 20px 12px !important;
            }
            
            ion-action-sheet.${cssClass} .action-sheet-sub-title {
              color: #A0AEC0 !important;
              font-size: 14px !important;
              padding: 0 20px 16px !important;
            }
            
            ion-action-sheet.${cssClass} .action-sheet-button {
              color: #F7FAFC !important;
              font-weight: 600 !important;
              font-size: 15px !important;
              padding: 16px 20px !important;
              min-height: 56px !important;
              background: transparent !important;
            }
            
            ion-action-sheet.${cssClass} .action-sheet-button.action-sheet-cancel {
              background: #4A5568 !important;
              color: #CBD5E0 !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
    }, 200);
  }
}
