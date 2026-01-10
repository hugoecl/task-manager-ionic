/**
 * Service para gestão de Projetos
 * Implementa operações CRUD com persistência via Ionic Storage
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Project } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  /** Chave usada para armazenar projetos no Storage */
  private readonly STORAGE_KEY = 'projects';
  
  /** Instância do Storage inicializada */
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  /**
   * Inicializa o Ionic Storage
   */
  async init(): Promise<void> {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  /**
   * Gera um ID único para novos projetos
   * @returns String com ID único
   */
  private generateId(): string {
    return 'proj_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtém todos os projetos
   * @returns Promise com array de projetos
   */
  async getAll(): Promise<Project[]> {
    await this.init();
    const projects = await this._storage?.get(this.STORAGE_KEY);
    return projects || [];
  }

  /**
   * Obtém um projeto pelo ID
   * @param id - ID do projeto
   * @returns Promise com o projeto ou undefined
   */
  async getById(id: string): Promise<Project | undefined> {
    const projects = await this.getAll();
    return projects.find(proj => proj.id === id);
  }

  /**
   * Obtém projetos filtrados por categoria
   * @param categoryId - ID da categoria para filtrar
   * @returns Promise com array de projetos da categoria
   */
  async getByCategory(categoryId: string): Promise<Project[]> {
    const projects = await this.getAll();
    return projects.filter(proj => proj.categoryId === categoryId);
  }

  /**
   * Cria um novo projeto
   * @param project - Dados do projeto (sem id, createdAt, updatedAt)
   * @returns Promise com o projeto criado
   */
  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const projects = await this.getAll();
    const now = new Date();
    
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    projects.push(newProject);
    await this._storage?.set(this.STORAGE_KEY, projects);
    
    return newProject;
  }

  /**
   * Atualiza um projeto existente
   * @param id - ID do projeto
   * @param updates - Campos a atualizar
   * @returns Promise com o projeto atualizado ou undefined
   */
  async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const projects = await this.getAll();
    const index = projects.findIndex(proj => proj.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date()
    };
    await this._storage?.set(this.STORAGE_KEY, projects);
    
    return projects[index];
  }

  /**
   * Elimina um projeto
   * @param id - ID do projeto a eliminar
   * @returns Promise com boolean indicando sucesso
   */
  async delete(id: string): Promise<boolean> {
    const projects = await this.getAll();
    const filteredProjects = projects.filter(proj => proj.id !== id);
    
    if (filteredProjects.length === projects.length) {
      return false;
    }
    
    await this._storage?.set(this.STORAGE_KEY, filteredProjects);
    return true;
  }

  /**
   * Elimina todos os projetos de uma categoria
   * @param categoryId - ID da categoria
   * @returns Promise com número de projetos eliminados
   */
  async deleteByCategory(categoryId: string): Promise<number> {
    const projects = await this.getAll();
    const filteredProjects = projects.filter(proj => proj.categoryId !== categoryId);
    const deletedCount = projects.length - filteredProjects.length;
    
    await this._storage?.set(this.STORAGE_KEY, filteredProjects);
    return deletedCount;
  }

  /**
   * Carrega dados iniciais
   * @param initialData - Array de projetos iniciais
   */
  async loadInitialData(initialData: Project[]): Promise<void> {
    const existing = await this.getAll();
    if (existing.length === 0) {
      await this._storage?.set(this.STORAGE_KEY, initialData);
    }
  }
}


