/**
 * Página de Gestão de Categorias
 * Permite adicionar, editar e eliminar categorias de projetos
 */
import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { CategoryService, ProjectService } from '../../services';
import { Category } from '../../models';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
  standalone: false
})
export class CategoriesPage implements OnInit {
  /** Lista de categorias */
  categories: Category[] = [];

  /** Ícones disponíveis para categorias */
  availableIcons: string[] = [
    'school-outline', 'briefcase-outline', 'person-outline', 'home-outline',
    'heart-outline', 'star-outline', 'flag-outline', 'bookmark-outline',
    'folder-outline', 'document-outline', 'cart-outline', 'car-outline',
    'airplane-outline', 'fitness-outline', 'game-controller-outline', 'musical-notes-outline'
  ];

  /** Cores disponíveis para categorias */
  availableColors: string[] = [
    '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
    '#E91E63', '#00BCD4', '#FF5722', '#795548',
    '#607D8B', '#3F51B5', '#009688', '#CDDC39'
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private categoryService: CategoryService,
    private projectService: ProjectService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCategories();
  }

  /**
   * Recarrega categorias quando a página fica visível
   */
  async ionViewWillEnter(): Promise<void> {
    await this.loadCategories();
  }

  /**
   * Carrega todas as categorias
   */
  async loadCategories(): Promise<void> {
    this.categories = await this.categoryService.getAll();
  }

  /**
   * Abre modal para adicionar nova categoria
   */
  async addCategory(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Nova Categoria',
      inputs: [
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nome da categoria'
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
            if (data.name && data.name.trim()) {
              await this.categoryService.create({
                name: data.name.trim(),
                color: this.availableColors[Math.floor(Math.random() * this.availableColors.length)],
                icon: this.availableIcons[Math.floor(Math.random() * this.availableIcons.length)]
              });
              await this.loadCategories();
              this.showToast('Categoria criada com sucesso!');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Abre modal para editar categoria
   * @param category - Categoria a editar
   */
  async editCategory(category: Category): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Editar Categoria',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: category.name,
          placeholder: 'Nome da categoria'
        }
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
              await this.categoryService.update(category.id, {
                name: data.name.trim()
              });
              await this.loadCategories();
              this.showToast('Categoria atualizada!');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Altera a cor de uma categoria
   * @param category - Categoria a editar
   */
  async changeColor(category: Category): Promise<void> {
    const buttons = this.availableColors.map(color => ({
      text: '',
      cssClass: 'color-button',
      handler: async () => {
        await this.categoryService.update(category.id, { color });
        await this.loadCategories();
      }
    }));

    // Criar HTML para mostrar cores
    const colorButtons = this.availableColors.map(color => 
      `<div class="color-option" style="background-color: ${color};" onclick="this.closest('ion-alert').dismiss('${color}')"></div>`
    ).join('');

    const alert = await this.alertController.create({
      header: 'Escolher Cor',
      message: `<div class="color-grid">${colorButtons}</div>`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }]
    });

    alert.onDidDismiss().then(async (result) => {
      if (result.data && result.data !== 'cancel') {
        await this.categoryService.update(category.id, { color: result.data });
        await this.loadCategories();
      }
    });

    await alert.present();
  }

  /**
   * Altera o ícone de uma categoria
   * @param category - Categoria a editar
   */
  async changeIcon(category: Category): Promise<void> {
    const iconButtons = this.availableIcons.map(icon => 
      `<ion-icon name="${icon}" class="icon-option" onclick="this.closest('ion-alert').dismiss('${icon}')"></ion-icon>`
    ).join('');

    const alert = await this.alertController.create({
      header: 'Escolher Ícone',
      message: `<div class="icon-grid">${iconButtons}</div>`,
      buttons: [{ text: 'Cancelar', role: 'cancel' }]
    });

    alert.onDidDismiss().then(async (result) => {
      if (result.data && result.data !== 'cancel') {
        await this.categoryService.update(category.id, { icon: result.data });
        await this.loadCategories();
      }
    });

    await alert.present();
  }

  /**
   * Elimina uma categoria após confirmação
   * @param category - Categoria a eliminar
   */
  async deleteCategory(category: Category): Promise<void> {
    // Verificar se existem projetos nesta categoria
    const projects = await this.projectService.getByCategory(category.id);
    
    let message = `Tens a certeza que queres eliminar a categoria "${category.name}"?`;
    if (projects.length > 0) {
      message += ` Esta categoria tem ${projects.length} projeto(s) associado(s) que também serão eliminados.`;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar Categoria',
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
            // Eliminar projetos associados primeiro
            await this.projectService.deleteByCategory(category.id);
            // Eliminar categoria
            await this.categoryService.delete(category.id);
            await this.loadCategories();
            this.showToast('Categoria eliminada!');
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Navega para projetos da categoria
   * @param categoryId - ID da categoria
   */
  goToProjects(categoryId: string): void {
    this.router.navigate(['/projects/category', categoryId]);
  }

  /**
   * Volta para a página anterior
   */
  goBack(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Mostra uma mensagem toast
   * @param message - Mensagem a mostrar
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
