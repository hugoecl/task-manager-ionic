/**
 * Service para gestão de Categorias
 * Implementa operações CRUD com persistência via Ionic Storage
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  /** Chave usada para armazenar categorias no Storage */
  private readonly STORAGE_KEY = 'categories';
  
  /** Instância do Storage inicializada */
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  /**
   * Inicializa o Ionic Storage
   * Deve ser chamado antes de qualquer operação
   */
  async init(): Promise<void> {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  /**
   * Gera um ID único para novas categorias
   * @returns String com ID único baseado em timestamp
   */
  private generateId(): string {
    return 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtém todas as categorias
   * @returns Promise com array de categorias
   */
  async getAll(): Promise<Category[]> {
    await this.init();
    const categories = await this._storage?.get(this.STORAGE_KEY);
    return categories || [];
  }

  /**
   * Obtém uma categoria pelo ID
   * @param id - ID da categoria a procurar
   * @returns Promise com a categoria encontrada ou undefined
   */
  async getById(id: string): Promise<Category | undefined> {
    const categories = await this.getAll();
    return categories.find(cat => cat.id === id);
  }

  /**
   * Cria uma nova categoria
   * @param category - Dados da categoria (sem id e createdAt)
   * @returns Promise com a categoria criada
   */
  async create(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const categories = await this.getAll();
    
    const newCategory: Category = {
      ...category,
      id: this.generateId(),
      createdAt: new Date()
    };
    
    categories.push(newCategory);
    await this._storage?.set(this.STORAGE_KEY, categories);
    
    return newCategory;
  }

  /**
   * Atualiza uma categoria existente
   * @param id - ID da categoria a atualizar
   * @param updates - Campos a atualizar
   * @returns Promise com a categoria atualizada ou undefined se não encontrada
   */
  async update(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const categories = await this.getAll();
    const index = categories.findIndex(cat => cat.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    categories[index] = { ...categories[index], ...updates };
    await this._storage?.set(this.STORAGE_KEY, categories);
    
    return categories[index];
  }

  /**
   * Elimina uma categoria
   * @param id - ID da categoria a eliminar
   * @returns Promise com boolean indicando sucesso
   */
  async delete(id: string): Promise<boolean> {
    const categories = await this.getAll();
    const filteredCategories = categories.filter(cat => cat.id !== id);
    
    if (filteredCategories.length === categories.length) {
      return false; // Categoria não encontrada
    }
    
    await this._storage?.set(this.STORAGE_KEY, filteredCategories);
    return true;
  }

  /**
   * Carrega dados iniciais de um ficheiro JSON
   * Só carrega se não existirem categorias
   * @param initialData - Array de categorias iniciais
   */
  async loadInitialData(initialData: Category[]): Promise<void> {
    const existing = await this.getAll();
    if (existing.length === 0) {
      await this._storage?.set(this.STORAGE_KEY, initialData);
    }
  }
}

