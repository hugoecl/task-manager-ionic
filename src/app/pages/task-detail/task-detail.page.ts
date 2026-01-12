/**
 * Página de Detalhes da Tarefa
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController, Platform } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ProjectService, TaskService, NotificationService, UtilsService } from '../../services';
import { Project, Task } from '../../models';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: false
})
export class TaskDetailPage implements OnInit {
  taskId: string = '';
  task: Task | null = null;
  project: Project | null = null;
  allProjects: Project[] = [];
  editMode = false;
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
    private taskService: TaskService,
    private notificationService: NotificationService,
    private utils: UtilsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async params => {
      this.taskId = params['taskId'];
      await this.loadData();
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

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

  isOverdue(): boolean {
    if (!this.task) return false;
    return this.utils.isOverdue(this.task.dueDate, this.task.completed);
  }

  getPriorityColor(): string {
    if (!this.task) return 'medium';
    return this.utils.getPriorityColor(this.task.priority);
  }

  getPriorityText(): string {
    if (!this.task) return '';
    return this.utils.getPriorityLabel(this.task.priority);
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) this.initFormData();
  }

  async saveChanges(): Promise<void> {
    if (this.formData.title.trim()) {
      await this.taskService.update(this.taskId, {
        title: this.formData.title.trim(),
        description: this.formData.description.trim(),
        dueDate: new Date(this.formData.dueDate),
        priority: this.formData.priority
      });
      // Atualizar notificações após atualizar a tarefa
      const updatedTask = await this.taskService.getById(this.taskId);
      if (updatedTask) {
        await this.notificationService.scheduleTaskNotifications(updatedTask);
      }
      await this.loadData();
      this.editMode = false;
      this.showToast('Tarefa atualizada!');
    }
  }

  async toggleComplete(): Promise<void> {
    if (this.task) {
      await this.taskService.toggleComplete(this.taskId);
      const updatedTask = await this.taskService.getById(this.taskId);
      await this.loadData();
      
      // Se a tarefa foi marcada como concluída, cancelar notificações
      // Se foi reaberta, reagendar notificações
      if (updatedTask) {
        if (updatedTask.completed) {
          await this.notificationService.cancelTaskNotifications(this.taskId);
        } else {
          await this.notificationService.scheduleTaskNotifications(updatedTask);
        }
      }
      
      this.showToast(updatedTask?.completed ? 'Tarefa concluída! Notificações canceladas.' : 'Tarefa reaberta! Notificações reagendadas.');
    }
  }

  async showImageOptions(): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Adicionar Imagem',
      buttons: [
        { text: 'Tirar Foto', icon: 'camera-outline', handler: () => this.takePicture(CameraSource.Camera) },
        { text: 'Escolher da Galeria', icon: 'images-outline', handler: () => this.takePicture(CameraSource.Photos) },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async takePicture(source: CameraSource): Promise<void> {
    try {
      const image = await Camera.getPhoto({
        quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl, source, width: 800, height: 800
      });
      if (image.dataUrl) {
        await this.taskService.update(this.taskId, { imageUrl: image.dataUrl });
        await this.loadData();
        this.showToast('Imagem adicionada!');
      }
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        this.showToast('Erro ao capturar imagem', 'danger');
      }
    }
  }

  async removeImage(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Remover Imagem',
      message: 'Tens a certeza?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Remover', cssClass: 'danger', handler: async () => {
          await this.taskService.update(this.taskId, { imageUrl: undefined });
          await this.loadData();
          this.showToast('Imagem removida!');
        }}
      ]
    });
    await alert.present();
  }

  async showOptions(): Promise<void> {
    const buttons: any[] = [
      { text: 'Adicionar/Alterar Imagem', icon: 'camera-outline', handler: () => this.showImageOptions() }
    ];
    if (this.task?.imageUrl) {
      buttons.push({ text: 'Remover Imagem', icon: 'trash-outline', handler: () => this.removeImage() });
    }
    buttons.push(
      { text: 'Mover para outro projeto', icon: 'arrow-forward-outline', handler: () => this.moveToProject() },
      { text: 'Eliminar tarefa', icon: 'trash-outline', role: 'destructive', handler: () => this.deleteTask() },
      { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }
    );

    const actionSheet = await this.actionSheetController.create({ header: 'Opções', buttons });
    await actionSheet.present();
  }

  async moveToProject(): Promise<void> {
    const otherProjects = this.allProjects.filter(p => p.id !== this.task?.projectId);
    if (otherProjects.length === 0) {
      this.showToast('Não há outros projetos', 'warning');
      return;
    }

    const inputs = otherProjects.map(proj => ({
      name: 'project', type: 'radio' as const, label: proj.name, value: proj.id
    }));

    const alert = await this.alertController.create({
      header: 'Mover para',
      inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Mover', handler: async (data) => {
          if (data) {
            await this.taskService.moveToProject(this.taskId, data);
            await this.loadData();
            this.showToast('Tarefa movida!');
          }
        }}
      ]
    });
    await alert.present();
  }

  async deleteTask(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Eliminar Tarefa',
      message: `Eliminar "${this.task?.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', cssClass: 'danger', handler: async () => {
          // Cancelar notificações antes de deletar
          if (this.taskId) {
            await this.notificationService.cancelTaskNotifications(this.taskId);
          }
          await this.taskService.delete(this.taskId);
          this.showToast('Tarefa eliminada!');
          this.router.navigate(['/tabs/tasks']);
        }}
      ]
    });
    await alert.present();
  }

  goBack(): void {
    this.router.navigate(['/tabs/tasks']);
  }

  private async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 2000, position: 'bottom', color });
    await toast.present();
  }
}
