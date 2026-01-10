/**
 * Página de Gestão de Projetos
 * Permite criar, editar e eliminar projetos
 * Pode filtrar por categoria
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { CategoryService, ProjectService, TaskService } from '../../services';
import { Category, Project } from '../../models';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: false
})
export class ProjectsPage implements OnInit {
  /** Lista de projetos */
  projects: Project[] = [];
  
  /** Lista de categorias (para o select) */
  categories: Category[] = [];
  
  /** Categoria selecionada para filtro */
  selectedCategoryId: string | null = null;
  selectedCategory: Category | null = null;
  
  /** Contadores de tarefas por projeto */
  taskCounts: Map<string, { total: number; completed: number }> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private categoryService: CategoryService,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  async ngOnInit(): Promise<void> {
    // Verificar se há um categoryId nos parâmetros da rota
    this.route.params.subscribe(async params => {
      this.selectedCategoryId = params['categoryId'] || null;
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
   * Carrega projetos e categorias
   */
  async loadData(): Promise<void> {
    // Carregar categorias
    this.categories = await this.categoryService.getAll();
    
    // Carregar categoria selecionada
    if (this.selectedCategoryId) {
      this.selectedCategory = this.categories.find(c => c.id === this.selectedCategoryId) || null;
      this.projects = await this.projectService.getByCategory(this.selectedCategoryId);
    } else {
      this.selectedCategory = null;
      this.projects = await this.projectService.getAll();
    }

    // Carregar contadores de tarefas
    await this.loadTaskCounts();
  }

  /**
   * Carrega contadores de tarefas para cada projeto
   */
  async loadTaskCounts(): Promise<void> {
    this.taskCounts.clear();
    for (const project of this.projects) {
      const tasks = await this.taskService.getByProject(project.id);
      this.taskCounts.set(project.id, {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length
      });
    }
  }

  /**
   * Obtém contador de tarefas de um projeto
   */
  getTaskCount(projectId: string): { total: number; completed: number } {
    return this.taskCounts.get(projectId) || { total: 0, completed: 0 };
  }

  /**
   * Obtém nome da categoria de um projeto
   */
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  }

  /**
   * Obtém cor da categoria de um projeto
   */
  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.color || '#666';
  }

  /**
   * Abre modal para criar novo projeto
   */
  async addProject(): Promise<void> {
    const categoryInputs = this.categories.map(cat => ({
      name: 'category',
      type: 'radio' as const,
      label: cat.name,
      value: cat.id,
      checked: cat.id === this.selectedCategoryId
    }));

    const alert = await this.alertController.create({
      header: 'Novo Projeto',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nome do projeto'
        },
        {
          name: 'description',
          type: 'textarea',
          placeholder: 'Descrição (opcional)'
        },
        ...categoryInputs
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Criar',
          handler: async (data) => {
            if (data.name && data.name.trim() && data.category) {
              await this.projectService.create({
                name: data.name.trim(),
                description: data.description?.trim() || '',
                categoryId: data.category
              });
              await this.loadData();
              this.showToast('Projeto criado com sucesso!');
            } else if (!data.category) {
              this.showToast('Seleciona uma categoria!', 'warning');
              return false;
            }
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Abre modal para editar projeto
   */
  async editProject(project: Project, event: Event): Promise<void> {
    event.stopPropagation();
    
    const categoryInputs = this.categories.map(cat => ({
      name: 'category',
      type: 'radio' as const,
      label: cat.name,
      value: cat.id,
      checked: cat.id === project.categoryId
    }));

    const alert = await this.alertController.create({
      header: 'Editar Projeto',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: project.name,
          placeholder: 'Nome do projeto'
        },
        {
          name: 'description',
          type: 'textarea',
          value: project.description,
          placeholder: 'Descrição (opcional)'
        },
        ...categoryInputs
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.name && data.name.trim()) {
              await this.projectService.update(project.id, {
                name: data.name.trim(),
                description: data.description?.trim() || '',
                categoryId: data.category
              });
              await this.loadData();
              this.showToast('Projeto atualizado!');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Elimina um projeto após confirmação
   */
  async deleteProject(project: Project, event: Event): Promise<void> {
    event.stopPropagation();
    
    const taskCount = this.getTaskCount(project.id);
    let message = `Tens a certeza que queres eliminar o projeto "${project.name}"?`;
    if (taskCount.total > 0) {
      message += ` Este projeto tem ${taskCount.total} tarefa(s) que também serão eliminadas.`;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar Projeto',
      message: message,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            // Eliminar tarefas do projeto
            await this.taskService.deleteByProject(project.id);
            // Eliminar projeto
            await this.projectService.delete(project.id);
            await this.loadData();
            this.showToast('Projeto eliminado!');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Navega para as tarefas do projeto
   */
  goToTasks(projectId: string): void {
    this.router.navigate(['/tasks', projectId]);
  }

  /**
   * Muda o filtro de categoria
   */
  async onCategoryChange(categoryId: string | null): Promise<void> {
    if (categoryId) {
      this.router.navigate(['/projects/category', categoryId]);
    } else {
      this.router.navigate(['/projects']);
    }
  }

  /**
   * Limpa o filtro de categoria
   */
  clearFilter(): void {
    this.router.navigate(['/projects']);
  }

  /**
   * Mostra uma mensagem toast
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
