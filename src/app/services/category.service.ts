/**
 * Service para gestão de Categorias
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly STORAGE_KEY = 'categories';
  private categories: Category[] = [];

  constructor(private storage: Storage) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.storage.create();
  }

  async getCategories(): Promise<Category[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    this.categories = stored || [];
    return this.categories;
  }

  async getAll(): Promise<Category[]> {
    return this.getCategories();
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const categories = await this.getCategories();
    return categories.find(c => c.id === id);
  }

  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const newCategory: Category = {
      ...category,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    const categories = await this.getCategories();
    categories.push(newCategory);
    await this.storage.set(this.STORAGE_KEY, categories);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const categories = await this.getAll();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) return undefined;
    
    categories[index] = { ...categories[index], ...updates };
    await this.storage.set(this.STORAGE_KEY, categories);
    return categories[index];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const categories = await this.getAll();
    const filtered = categories.filter(c => c.id !== id);
    
    if (filtered.length === categories.length) return false;
    
    await this.storage.set(this.STORAGE_KEY, filtered);
    return true;
  }

  async setCategories(categories: Category[]): Promise<void> {
    await this.storage.set(this.STORAGE_KEY, categories);
    this.categories = categories;
  }

  private generateId(): string {
    return 'cat-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
