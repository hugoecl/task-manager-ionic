/**
 * Página de Detalhes da Tarefa
 * Permite visualizar, editar e adicionar imagens a uma tarefa
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController, Platform } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
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
    private platform: Platform,
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
      this.initFormData();
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

  // ========== FUNCIONALIDADES DE IMAGEM ==========

  /**
   * Mostra opções para adicionar imagem
   */
  async showImageOptions(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Adicionar Imagem',
      buttons: [
        {
          text: 'Tirar Foto',
          icon: 'camera-outline',
          handler: () => {
            this.takePicture(CameraSource.Camera);
          }
        },
        {
          text: 'Escolher da Galeria',
          icon: 'images-outline',
          handler: () => {
            this.takePicture(CameraSource.Photos);
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
   * Captura ou seleciona imagem
   * @param source - Fonte da imagem (câmara ou galeria)
   */
  async takePicture(source: CameraSource): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 800,
        height: 800
      });

      if (image.dataUrl) {
        // Guardar imagem na tarefa
        await this.taskService.update(this.taskId, {
          imageUrl: image.dataUrl
        });
        await this.loadData();
        this.showToast('Imagem adicionada!');
      }
    } catch (error: any) {
      // Utilizador cancelou ou erro
      if (error.message !== 'User cancelled photos app') {
        console.error('Erro ao capturar imagem:', error);
        this.showToast('Erro ao capturar imagem', 'danger');
      }
    }
  }

  /**
   * Remove imagem da tarefa
   */
  async removeImage(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Remover Imagem',
      message: 'Tens a certeza que queres remover a imagem?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          cssClass: 'danger',
          handler: async () => {
            await this.taskService.update(this.taskId, {
              imageUrl: undefined
            });
            await this.loadData();
            this.showToast('Imagem removida!');
          }
        }
      ]
    });
    await alert.present();
  }

  // ========== OUTRAS OPÇÕES ==========

  /**
   * Mostra opções adicionais
   */
  async showOptions(): Promise<void> {
    const buttons: any[] = [
      {
        text: 'Adicionar/Alterar Imagem',
        icon: 'camera-outline',
        handler: () => {
          this.showImageOptions();
        }
      }
    ];

    // Opção de remover imagem (se existir)
    if (this.task?.imageUrl) {
      buttons.push({
        text: 'Remover Imagem',
        icon: 'trash-outline',
        handler: () => {
          this.removeImage();
        }
      });
    }

    buttons.push(
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
    );

    const actionSheet = await this.actionSheetController.create({
      header: 'Opções',
      buttons: buttons
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
        { text: 'Cancelar', role: 'cancel' },
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
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            await this.taskService.delete(this.taskId);
            this.showToast('Tarefa eliminada!');
            this.router.navigate(['/tabs/tasks']);
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
    this.router.navigate(['/tabs/tasks']);
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
