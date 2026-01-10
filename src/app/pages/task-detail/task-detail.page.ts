/**
 * Página de Detalhes da Tarefa
 * Permite visualizar e editar todos os detalhes de uma tarefa
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { ProjectService, TaskService } from '../../services';
import { Project, Task } from '../../models';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: false
})
export class TaskDetailPage implements OnInit {
  /** ID da tarefa */
  taskId: string = '';
  
  /** Tarefa atual */
  task: Task | null = null;
  
  /** Projeto da tarefa */
  project: Project | null = null;
  
  /** Todos os projetos (para mover tarefa) */
  allProjects: Project[] = [];
  
  /** Modo de edição */
  editMode = false;
  
  /** Dados do formulário */
  formData = {
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      this.taskId = params['taskId'];
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
   * Carrega tarefa e projeto
   */
  async loadData(): Promise<void> {
    if (this.taskId) {
      this.task = await this.taskService.getById(this.taskId) || null;
      if (this.task) {
        this.project = await this.projectService.getById(this.task.projectId) || null;
        this.allProjects = await this.projectService.getAll();
        this.initFormData();
      }
    }
  }

  /**
   * Inicializa dados do formulário
   */
  initFormData(): void {
    if (this.task) {
      this.formData = {
        title: this.task.title,
        description: this.task.description,
        dueDate: new Date(this.task.dueDate).toISOString(),
        priority: this.task.priority
      };
    }
  }

  /**
   * Verifica se a tarefa está em atraso
   */
  isOverdue(): boolean {
    if (!this.task || this.task.completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueDate = new Date(this.task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }

  /**
   * Obtém cor da prioridade
   */
  getPriorityColor(): string {
    if (!this.task) return 'medium';
    switch (this.task.priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  /**
   * Obtém texto da prioridade
   */
  getPriorityText(): string {
    if (!this.task) return '';
    switch (this.task.priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return '';
    }
  }

  /**
   * Alterna modo de edição
   */
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.initFormData(); // Reset form if canceling
    }
  }

  /**
   * Guarda alterações
   */
  async saveChanges(): Promise<void> {
    if (this.formData.title.trim()) {
      await this.taskService.update(this.taskId, {
        title: this.formData.title.trim(),
        description: this.formData.description.trim(),
        dueDate: new Date(this.formData.dueDate),
        priority: this.formData.priority
      });
      await this.loadData();
      this.editMode = false;
      this.showToast('Tarefa atualizada!');
    }
  }

  /**
   * Alterna estado de conclusão
   */
  async toggleComplete(): Promise<void> {
    if (this.task) {
      await this.taskService.toggleComplete(this.taskId);
      await this.loadData();
      const message = this.task.completed ? 'Tarefa reaberta' : 'Tarefa concluída!';
      this.showToast(message);
    }
  }

  /**
   * Mostra opções adicionais
   */
  async showOptions(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Opções',
      buttons: [
        {
          text: 'Mover para outro projeto',
          icon: 'arrow-forward-outline',
          handler: () => {
            this.moveToProject();
          }
        },
        {
          text: 'Eliminar tarefa',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.deleteTask();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * Move tarefa para outro projeto
   */
  async moveToProject(): Promise<void> {
    const otherProjects = this.allProjects.filter(p => p.id !== this.task?.projectId);
    
    if (otherProjects.length === 0) {
      this.showToast('Não há outros projetos disponíveis', 'warning');
      return;
    }

    const inputs = otherProjects.map(proj => ({
      name: 'project',
      type: 'radio' as const,
      label: proj.name,
      value: proj.id
    }));

    const alert = await this.alertController.create({
      header: 'Mover para',
      inputs: inputs,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Mover',
          handler: async (data) => {
            if (data) {
              await this.taskService.moveToProject(this.taskId, data);
              await this.loadData();
              this.showToast('Tarefa movida!');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Elimina a tarefa
   */
  async deleteTask(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Tarefa',
      message: `Tens a certeza que queres eliminar a tarefa "${this.task?.title}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            await this.taskService.delete(this.taskId);
            this.showToast('Tarefa eliminada!');
            this.router.navigate(['/tasks', this.task?.projectId]);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Volta para a lista de tarefas
   */
  goBack(): void {
    if (this.task) {
      this.router.navigate(['/tasks', this.task.projectId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  /**
   * Mostra toast
   */
  private async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}
