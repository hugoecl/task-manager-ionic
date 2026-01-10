/**
 * Página de Gestão de Tarefas
 * Mostra tarefas de um projeto específico OU todas as tarefas (tab)
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
  /** ID do projeto (opcional - se vazio mostra todas) */
  projectId: string = '';
  
  /** Projeto atual (se estiver a ver um projeto específico) */
  project: Project | null = null;
  
  /** Lista de projetos (para mostrar nomes) */
  projects: Project[] = [];
  
  /** Lista de tarefas */
  tasks: Task[] = [];
  
  /** Tarefas filtradas */
  filteredTasks: Task[] = [];
  
  /** Filtro atual */
  filter: 'all' | 'pending' | 'completed' | 'overdue' = 'all';
  
  /** Modo de reordenação */
  reorderEnabled = false;
  
  /** Modo: tab (todas) ou projeto específico */
  isTabMode = false;

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
      this.projectId = params['projectId'] || '';
      this.isTabMode = !this.projectId;
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
    // Carregar todos os projetos (para nomes)
    this.projects = await this.projectService.getAll();
    
    if (this.projectId) {
      // Modo: projeto específico
      this.project = await this.projectService.getById(this.projectId) || null;
      this.tasks = await this.taskService.getByProject(this.projectId);
    } else {
      // Modo: todas as tarefas (tab)
      this.tasks = await this.taskService.getAll();
    }
    
    this.applyFilter();
  }

  /**
   * Aplica o filtro selecionado
   */
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
    
    // Ordenar: em atraso primeiro, depois por data
    this.filteredTasks.sort((a, b) => {
      if (this.isOverdue(a) && !this.isOverdue(b)) return -1;
      if (!this.isOverdue(a) && this.isOverdue(b)) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  /**
   * Muda o filtro
   */
  setFilter(filter: 'all' | 'pending' | 'completed' | 'overdue'): void {
    this.filter = filter;
    this.applyFilter();
  }

  /**
   * Obtém nome do projeto
   */
  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : '';
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
    // Se estamos no modo tab, primeiro escolher projeto
    if (this.isTabMode && this.projects.length > 0) {
      await this.selectProjectAndAddTask();
      return;
    }
    
    await this.createTask(this.projectId);
  }

  /**
   * Seleciona projeto e depois cria tarefa
   */
  async selectProjectAndAddTask(): Promise<void> {
    const inputs = this.projects.map((p, index) => ({
      name: 'project',
      type: 'radio' as const,
      label: p.name,
      value: p.id,
      checked: index === 0
    }));

    const alert = await this.alertController.create({
      header: 'Selecionar Projeto',
      inputs: inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Continuar',
          handler: async (projectId) => {
            if (projectId) {
              await this.createTask(projectId);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Cria uma nova tarefa
   */
  async createTask(projectId: string): Promise<void> {
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
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: async (data) => {
            if (data.title && data.title.trim()) {
              await this.taskService.create({
                title: data.title.trim(),
                description: data.description?.trim() || '',
                dueDate: new Date(data.dueDate),
                projectId: projectId,
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
        { text: 'Cancelar', role: 'cancel' },
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
    const movedItem = this.filteredTasks.splice(event.detail.from, 1)[0];
    this.filteredTasks.splice(event.detail.to, 0, movedItem);
    
    if (this.projectId) {
      const taskIds = this.filteredTasks.map(t => t.id);
      await this.taskService.reorder(this.projectId, taskIds);
    }
    
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
