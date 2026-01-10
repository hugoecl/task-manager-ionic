/**
 * Página de Gestão de Projetos
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { CategoryService, ProjectService, TaskService } from '../../services';
import { Category, Project, Task } from '../../models';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: false
})
export class ProjectsPage implements OnInit {
  projects: Project[] = [];
  categories: Category[] = [];
  selectedCategoryId: string | null = null;
  selectedCategory: Category | null = null;
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
    this.route.params.subscribe(async params => {
      this.selectedCategoryId = params['categoryId'] || null;
      await this.loadData();
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.categories = await this.categoryService.getAll();
    
    if (this.selectedCategoryId) {
      this.selectedCategory = this.categories.find(c => c.id === this.selectedCategoryId) || null;
      this.projects = await this.projectService.getByCategory(this.selectedCategoryId);
    } else {
      this.selectedCategory = null;
      this.projects = await this.projectService.getAll();
    }

    await this.loadTaskCounts();
  }

  async loadTaskCounts(): Promise<void> {
    this.taskCounts.clear();
    for (const project of this.projects) {
      const tasks = await this.taskService.getByProject(project.id);
      this.taskCounts.set(project.id, {
        total: tasks.length,
        completed: tasks.filter((t: Task) => t.completed).length
      });
    }
  }

  getTaskCount(projectId: string): { total: number; completed: number } {
    return this.taskCounts.get(projectId) || { total: 0, completed: 0 };
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.color || '#666';
  }

  async addProject(): Promise<void> {
    // Mapear categorias para labels mais descritivos
    const categoryLabels: { [key: string]: string } = {
      'Escola': '🏫 Escola - Projetos académicos e escolares',
      'Trabalho': '💼 Trabalho - Projetos profissionais e do trabalho',
      'Pessoal': '👤 Pessoal - Projetos pessoais e hobbies',
      'Outros': '📁 Outros - Outras categorias'
    };
    
    const getCategoryLabel = (catName: string): string => {
      return categoryLabels[catName] || `📁 ${catName} - Categoria de projetos`;
    };
    
    const categoryInputs = this.categories.map(cat => ({
      name: 'category',
      type: 'radio' as const,
      label: getCategoryLabel(cat.name),
      value: cat.id,
      checked: cat.id === this.selectedCategoryId
    }));

    if (this.categories.length === 0) {
      this.showToast('Cria uma categoria primeiro!', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Novo Projeto',
      message: 'Preenche os dados abaixo para criar um novo projeto.\n\nSeleciona uma categoria para organizar o teu projeto.',
      inputs: [
        { 
          name: 'name', 
          type: 'text', 
          placeholder: 'Ex: Desenvolvimento Web App',
          attributes: { required: true, maxlength: 100, autocomplete: 'off' }
        },
        { 
          name: 'description', 
          type: 'textarea', 
          placeholder: 'Descreve o objetivo e detalhes do projeto (opcional)',
          attributes: { rows: 4, maxlength: 300 }
        },
        ...categoryInputs
      ],
      cssClass: 'custom-alert professional-form',
      buttons: [
        { 
          text: 'Cancelar', 
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Criar Projeto',
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            if (data.name && data.name.trim() && data.category) {
              await this.projectService.create({
                name: data.name.trim(),
                description: data.description?.trim() || '',
                categoryId: data.category
              });
              await this.loadData();
              this.showToast('Projeto criado com sucesso!');
              return true;
            } else {
              this.showToast('Nome e categoria são obrigatórios!', 'warning');
              return false;
            }
          }
        }
      ]
    });
    
    await alert.present();
    
    // Adicionar labels visuais e melhorar apresentação após o alert ser apresentado
    setTimeout(() => {
      const alertWrapper = document.querySelector('.professional-form .alert-wrapper');
      if (!alertWrapper) return;
      
      const inputGroup = alertWrapper.querySelector('.alert-input-group');
      if (!inputGroup) return;
      
      // Garantir que todos os inputs tenham labels
      const inputWrappers = inputGroup.querySelectorAll('.alert-input-wrapper');
      inputWrappers.forEach((wrapper) => {
        const input = wrapper.querySelector('input[type="text"], textarea');
        if (input) {
          const name = (input as HTMLInputElement).name;
          let labelText = '';
          
          if (name === 'name') {
            labelText = '📋 NOME DO PROJETO *';
          } else if (name === 'description') {
            labelText = '📄 DESCRIÇÃO (OPCIONAL)';
          }
          
          if (labelText && !wrapper.querySelector('.field-label')) {
            const labelElement = document.createElement('div');
            labelElement.className = 'field-label';
            labelElement.textContent = labelText;
            labelElement.style.cssText = 'color: #E68A2E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px; padding-left: 4px; display: block;';
            (wrapper as HTMLElement).insertBefore(labelElement, wrapper.firstChild);
          }
        }
      });
      
      // Adicionar label para o grupo de categorias
      const radioGroups = inputGroup.querySelectorAll('.alert-radio-group');
      radioGroups.forEach((radioGroup) => {
        if (!radioGroup.querySelector('.category-section-label')) {
          const labelElement = document.createElement('div');
          labelElement.className = 'category-section-label';
          labelElement.textContent = '🏷️ SELECIONA A CATEGORIA *';
          labelElement.style.cssText = 'color: #E68A2E; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 16px; padding-left: 4px; display: block;';
          (radioGroup as HTMLElement).insertBefore(labelElement, radioGroup.firstChild);
        }
        
        // Melhorar apresentação dos labels das categorias
        const radioLabels = radioGroup.querySelectorAll('.alert-radio-label');
        radioLabels.forEach((labelElement) => {
          const label = labelElement as HTMLElement;
          const originalText = label.textContent?.trim() || '';
          
          // Se o label tem formato "emoji Nome - Descrição", formatar
          if (originalText.includes(' - ')) {
            const parts = originalText.split(' - ');
            const emojiAndName = parts[0].trim();
            const description = parts[1]?.trim() || '';
            
            if (description) {
              label.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px; width: 100%;">
                  <span style="font-weight: 600; font-size: 16px; color: inherit; line-height: 1.3; display: block;">${emojiAndName}</span>
                  <span style="font-size: 13px; color: #A0AEC0; font-weight: 400; line-height: 1.4; display: block; opacity: 0.9;">${description}</span>
                </div>
              `;
              label.style.cssText = 'padding: 0 !important; margin: 0 !important; display: block !important; flex: 1 !important; min-height: auto !important; width: 100% !important;';
            }
          } else if (originalText && !label.querySelector('div')) {
            // Se não tem descrição, garantir que o texto apareça
            label.innerHTML = `<span style="font-weight: 600; font-size: 16px; color: inherit;">${originalText}</span>`;
            label.style.cssText = 'padding: 0 !important; margin: 0 !important; display: block !important; flex: 1 !important;';
          }
        });
      });
      
      // Garantir que o campo de nome esteja visível (pode estar escondido por CSS)
      const nameInput = inputGroup.querySelector('input[name="name"]') as HTMLInputElement;
      if (nameInput) {
        const nameWrapper = nameInput.closest('.alert-input-wrapper') as HTMLElement;
        if (nameWrapper) {
          nameWrapper.style.display = 'block';
          nameWrapper.style.visibility = 'visible';
          nameWrapper.style.opacity = '1';
          nameInput.style.display = 'block';
          nameInput.style.visibility = 'visible';
          nameInput.style.opacity = '1';
        }
      }
    }, 300);
  }

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
        { name: 'name', type: 'text', value: project.name, placeholder: 'Nome' },
        { name: 'description', type: 'textarea', value: project.description, placeholder: 'Descrição' },
        ...categoryInputs
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
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

  async deleteProject(project: Project, event: Event): Promise<void> {
    event.stopPropagation();
    
    const alert = await this.alertController.create({
      header: 'Eliminar Projeto',
      message: `Eliminar "${project.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            await this.taskService.deleteByProject(project.id);
            await this.projectService.delete(project.id);
            await this.loadData();
            this.showToast('Projeto eliminado!');
          }
        }
      ]
    });
    await alert.present();
  }

  goToTasks(projectId: string): void {
    this.router.navigate(['/tasks', projectId]);
  }

  async onCategoryChange(categoryId: string | null): Promise<void> {
    if (categoryId) {
      this.router.navigate(['/projects/category', categoryId]);
    } else {
      this.router.navigate(['/tabs/projects']);
    }
  }

  clearFilter(): void {
    this.router.navigate(['/tabs/projects']);
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
