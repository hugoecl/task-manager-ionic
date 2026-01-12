/**
 * Página de Gestão de Projetos
 */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { CategoryService, ProjectService, TaskService, TranslationService } from '../../services';
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
    private actionSheetController: ActionSheetController,
    private categoryService: CategoryService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private translation: TranslationService
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
    if (this.categories.length === 0) {
      this.showToast(this.translation.category('createCategoryFirst'), 'warning');
      return;
    }

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

    // Criar botões para cada categoria
    const categoryButtons: any[] = this.categories.map(category => ({
      text: getCategoryLabel(category.name),
      handler: async () => {
        await this.showProjectForm(category.id);
      }
    }));

    // Adicionar botão de cancelar
    categoryButtons.push({
      text: this.translation.common('cancel'),
      role: 'cancel',
      cssClass: 'action-sheet-cancel'
    });

    const categorySheet = await this.actionSheetController.create({
      header: this.translation.project('selectCategory'),
      subHeader: this.translation.project('selectCategoryMessage'),
      buttons: categoryButtons,
      cssClass: 'category-selection-sheet'
    });

    await categorySheet.present();
    
    // Injetar estilos diretamente no shadow DOM
    setTimeout(() => {
      this.injectActionSheetStyles(categorySheet, 'category-selection-sheet');
    }, 100);
  }

  private async showProjectForm(categoryId: string): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translation.project('newProject'),
      message: this.translation.project('createProjectForm'),
      inputs: [
        { 
          name: 'name', 
          type: 'text', 
          placeholder: this.translation.placeholder('projectName'),
          attributes: { required: true, maxlength: 100, autocomplete: 'off' }
        },
        { 
          name: 'description', 
          type: 'textarea', 
          placeholder: this.translation.placeholder('projectDescription'),
          attributes: { rows: 4, maxlength: 300 }
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
          text: this.translation.project('newProject'),
          cssClass: 'alert-button-confirm',
          handler: async (data) => {
            if (data.name && data.name.trim()) {
              await this.projectService.create({
                name: data.name.trim(),
                description: data.description?.trim() || '',
                categoryId: categoryId
              });
              await this.loadData();
              this.showToast(this.translation.project('projectCreated'));
              return true;
            } else {
              this.showToast(this.translation.category('nameRequired'), 'warning');
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
            labelText = `${this.translation.label('projectNameLabel')} *`;
          } else if (name === 'description') {
            labelText = this.translation.label('projectDescriptionLabel');
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
      
      // Categorias agora são selecionadas via ActionSheet antes do formulário
      // Garantir que o campo de nome esteja visível
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
    
    // Mapear categorias para labels mais descritivos
    const categoryLabels: { [key: string]: string } = {
      'Escola': '🏫 Escola',
      'Trabalho': '💼 Trabalho',
      'Pessoal': '👤 Pessoal',
      'Outros': '📁 Outros'
    };
    
    const getCategoryLabel = (catName: string): string => {
      return categoryLabels[catName] || `📁 ${catName}`;
    };

    // Criar botões para cada categoria
    const categoryButtons: any[] = this.categories.map(category => ({
      text: getCategoryLabel(category.name),
      handler: async () => {
        await this.showEditProjectForm(project, category.id);
      }
    }));

    // Adicionar botão de cancelar
    categoryButtons.push({
      text: 'Cancelar',
      role: 'cancel',
      cssClass: 'action-sheet-cancel'
    });

    const categorySheet = await this.actionSheetController.create({
      header: 'Selecionar Categoria',
      subHeader: 'Escolhe a categoria para o projeto',
      buttons: categoryButtons,
      cssClass: 'category-selection-sheet'
    });

    await categorySheet.present();
    
    // Injetar estilos diretamente no shadow DOM
    setTimeout(() => {
      this.injectActionSheetStyles(categorySheet, 'category-selection-sheet');
    }, 100);
  }

  private async showEditProjectForm(project: Project, categoryId: string): Promise<void> {
    const selectedCategory = this.categories.find(c => c.id === categoryId);
    const categoryName = selectedCategory?.name || 'Sem categoria';
    
    const alert = await this.alertController.create({
      header: 'Editar Projeto',
      message: `Categoria: ${categoryName}`,
      inputs: [
        { name: 'name', type: 'text', value: project.name, placeholder: 'Nome' },
        { name: 'description', type: 'textarea', value: project.description, placeholder: 'Descrição' }
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
                categoryId: categoryId
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
