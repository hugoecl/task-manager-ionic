/**
 * Página de Categorias
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { CategoryService, ProjectService } from '../../services';
import { Category } from '../../models';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  projectCounts: Map<string, number> = new Map();

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private actionSheetController: ActionSheetController,
    private categoryService: CategoryService,
    private projectService: ProjectService
  ) { }

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.categories = await this.categoryService.getAll();
    
    this.projectCounts.clear();
    for (const category of this.categories) {
      const projects = await this.projectService.getByCategory(category.id);
      this.projectCounts.set(category.id, projects.length);
    }
  }

  getProjectCount(categoryId: string): number {
    return this.projectCounts.get(categoryId) || 0;
  }

  goToProjects(categoryId: string): void {
    this.router.navigate(['/projects/category', categoryId]);
  }

  async addCategory(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nova Categoria',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nome da categoria' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: async (data) => {
            if (data.name?.trim()) {
              const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4'];
              const icons = ['folder-outline', 'briefcase-outline', 'school-outline', 'home-outline', 'star-outline', 'heart-outline'];
              
              await this.categoryService.addCategory({
                name: data.name.trim(),
                color: colors[Math.floor(Math.random() * colors.length)],
                icon: icons[Math.floor(Math.random() * icons.length)]
              });
              await this.loadData();
              this.showToast('Categoria criada!');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editCategory(category: Category): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Editar Categoria',
      inputs: [
        { name: 'name', type: 'text', value: category.name, placeholder: 'Nome' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (data.name?.trim()) {
              await this.categoryService.updateCategory(category.id, { name: data.name.trim() });
              await this.loadData();
              this.showToast('Categoria atualizada!');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async changeColor(category: Category): Promise<void> {
    const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#E91E63', '#00BCD4', '#FF5722', '#607D8B'];
    
    // Criar botões para cada cor (o texto será substituído por círculos coloridos)
    const colorButtons: any[] = colors.map((color, index) => ({
      text: `color-${index}`, // Placeholder que será substituído
      cssClass: `color-button color-${index}`,
      handler: async () => {
        await this.categoryService.updateCategory(category.id, { color });
        await this.loadData();
        this.showToast('Cor atualizada!');
      }
    }));

    // Adicionar botão de cancelar
    colorButtons.push({
      text: 'Cancelar',
      role: 'cancel',
      cssClass: 'action-sheet-cancel'
    });

    const actionSheet = await this.actionSheetController.create({
      header: 'Escolher Cor',
      buttons: colorButtons,
      cssClass: 'color-selection-sheet'
    });

    await actionSheet.present();
    
    // Injetar círculos coloridos após o ActionSheet ser apresentado
    setTimeout(() => {
      const hostElement = document.querySelector('ion-action-sheet');
      if (!hostElement) return;

      const shadowRoot = (hostElement as any).shadowRoot;
      if (!shadowRoot) return;

      colors.forEach((color, index) => {
        const button = shadowRoot.querySelector(`.color-${index}`);
        if (!button) return;

        const isSelected = color === category.color;
        const borderWidth = isSelected ? '3px' : '2px';
        const borderColor = isSelected ? '#E68A2E' : 'rgba(255, 255, 255, 0.2)';
        const boxShadow = isSelected 
          ? '0 0 0 3px rgba(230, 138, 46, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3)' 
          : '0 2px 8px rgba(0, 0, 0, 0.3)';
        const transform = isSelected ? 'scale(1.1)' : 'scale(1)';

        // Limpar o conteúdo do botão
        button.innerHTML = '';
        button.style.cssText = `
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 20px !important;
          min-height: 80px !important;
        `;

        // Criar círculo colorido
        const colorCircle = document.createElement('div');
        colorCircle.style.cssText = `
          width: 40px !important;
          height: 40px !important;
          border-radius: 50% !important;
          background: ${color} !important;
          border: ${borderWidth} solid ${borderColor} !important;
          box-shadow: ${boxShadow} !important;
          transition: all 0.2s ease !important;
          transform: ${transform} !important;
        `;

        button.appendChild(colorCircle);

        // Atualizar quando clicado
        button.addEventListener('click', () => {
          // Atualizar todos os botões
          colors.forEach((c, i) => {
            const btn = shadowRoot.querySelector(`.color-${i}`);
            if (btn && btn.querySelector('div')) {
              const circle = btn.querySelector('div');
              if (circle) {
                const isSelectedNow = c === color;
                circle.style.borderColor = isSelectedNow ? '#E68A2E' : 'rgba(255, 255, 255, 0.2)';
                circle.style.borderWidth = isSelectedNow ? '3px' : '2px';
                circle.style.boxShadow = isSelectedNow 
                  ? '0 0 0 3px rgba(230, 138, 46, 0.2), 0 2px 8px rgba(0, 0, 0, 0.3)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.3)';
                circle.style.transform = isSelectedNow ? 'scale(1.1)' : 'scale(1)';
              }
            }
          });
        });
      });
    }, 200);
  }

  async deleteCategory(category: Category): Promise<void> {
    const count = this.getProjectCount(category.id);
    const message = count > 0 
      ? `Eliminar "${category.name}"? Isto também eliminará ${count} projeto(s).`
      : `Eliminar "${category.name}"?`;

    const alert = await this.alertController.create({
      header: 'Eliminar Categoria',
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          cssClass: 'danger',
          handler: async () => {
            await this.categoryService.deleteCategory(category.id);
            await this.loadData();
            this.showToast('Categoria eliminada!');
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message, duration: 2000, position: 'bottom', color: 'success'
    });
    await toast.present();
  }
}
