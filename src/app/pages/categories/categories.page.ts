/**
 * Página de Categorias
 */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
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
    const inputs = colors.map(color => ({
      name: 'color',
      type: 'radio' as const,
      label: color,
      value: color,
      checked: color === category.color
    }));

    const alert = await this.alertController.create({
      header: 'Escolher Cor',
      inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aplicar',
          handler: async (color) => {
            if (color) {
              await this.categoryService.updateCategory(category.id, { color });
              await this.loadData();
              this.showToast('Cor atualizada!');
            }
          }
        }
      ]
    });
    await alert.present();
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
