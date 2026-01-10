/**
 * Página de Gestão de Tarefas
 * Mostra e gere as tarefas de um projeto específico
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ItemReorderEventDetail } from '@ionic/angular';
import { ProjectService, TaskService } from '../../services';
import { Project, Task } from '../../models';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: false
})
export class TasksPage implements OnInit {
  /** ID do projeto */
  projectId: string = '';
  
  /** Projeto atual */
  project: Project | null = null;
  
  /** Lista de tarefas */
  tasks: Task[] = [];
  
  /** Modo de reordenação */
  reorderEnabled = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      this.projectId = params['projectId'];
      await this.loadData();
    });
  }

  /**
   * Recarrega dados quando a página fica visível
   */
  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  /**
   * Carrega projeto e tarefas
   */
  async loadData(): Promise<void> {
    if (this.projectId) {
      this.project = await this.projectService.getById(this.projectId) || null;
      this.tasks = await this.taskService.getByProject(this.projectId);
    }
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
   * Verifica se uma tarefa vence hoje
   */
  isDueToday(task: Task): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === now.getTime();
  }

  /**
   * Obtém cor baseada na prioridade
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
   * Alterna o estado de conclusão da tarefa
   */
  async toggleComplete(task: Task): Promise<void> {
    await this.taskService.toggleComplete(task.id);
    await this.loadData();
    const message = task.completed ? 'Tarefa reaberta' : 'Tarefa concluída!';
    this.showToast(message);
  }

  /**
   * Abre modal para criar nova tarefa
   */
  async addTask(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split('T')[0];

    const alert = await this.alertController.create({
      header: 'Nova Tarefa',
      inputs: [
        {
          name: 'title',
          type: 'text',
          placeholder: 'Título da tarefa'
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Descrição (opcional)'
        },
        {
          name: 'dueDate',
          type: 'date',
          value: defaultDate,
          min: new Date().toISOString().split('T')[0]
        },
        {
          name: 'priority',
          type: 'radio',
          label: '🔴 Alta',
          value: 'high'
        },
        {
          name: 'priority',
          type: 'radio',
          label: '🟡 Média',
          value: 'medium',
          checked: true
        },
        {
          name: 'priority',
          type: 'radio',
          label: '🟢 Baixa',
          value: 'low'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: async (data) => {
            if (data.title && data.title.trim()) {
              await this.taskService.create({
                title: data.title.trim(),
                description: data.description?.trim() || '',
                dueDate: new Date(data.dueDate),
                projectId: this.projectId,
                completed: false,
                priority: data.priority || 'medium'
              });
              await this.loadData();
              this.showToast('Tarefa criada com sucesso!');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Navega para detalhes da tarefa
   */
  goToTaskDetail(taskId: string): void {
    this.router.navigate(['/task-detail', taskId]);
  }

  /**
   * Elimina uma tarefa
   */
  async deleteTask(task: Task, event: Event): Promise<void> {
    event.stopPropagation();

    const alert = await this.alertController.create({
      header: 'Eliminar Tarefa',
      message: `Tens a certeza que queres eliminar a tarefa "${task.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            await this.taskService.delete(task.id);
            await this.loadData();
            this.showToast('Tarefa eliminada!');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ativa/desativa modo de reordenação
   */
  toggleReorder(): void {
    this.reorderEnabled = !this.reorderEnabled;
  }

  /**
   * Handler para reordenação de tarefas
   */
  async handleReorder(event: CustomEvent<ItemReorderEventDetail>): Promise<void> {
    // Reordenar array localmente
    const movedItem = this.tasks.splice(event.detail.from, 1)[0];
    this.tasks.splice(event.detail.to, 0, movedItem);
    
    // Guardar nova ordem
    const taskIds = this.tasks.map(t => t.id);
    await this.taskService.reorder(this.projectId, taskIds);
    
    // Completar animação
    event.detail.complete();
  }

  /**
   * Mostra toast
   */
  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
