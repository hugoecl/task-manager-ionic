/**
 * Service para gestão de Projetos
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Project } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly STORAGE_KEY = 'projects';

  constructor(private storage: Storage) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.storage.create();
  }

  async getAll(): Promise<Project[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    return stored || [];
  }

  async getById(id: string): Promise<Project | undefined> {
    const projects = await this.getAll();
    return projects.find(p => p.id === id);
  }

  async getByCategory(categoryId: string): Promise<Project[]> {
    const projects = await this.getAll();
    return projects.filter(p => p.categoryId === categoryId);
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };
    
    const projects = await this.getAll();
    projects.push(newProject);
    await this.storage.set(this.STORAGE_KEY, projects);
    return newProject;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const projects = await this.getAll();
    const index = projects.findIndex(p => p.id === id);
    
    if (index === -1) return undefined;
    
    projects[index] = { 
      ...projects[index], 
      ...updates,
      updatedAt: new Date()
    };
    await this.storage.set(this.STORAGE_KEY, projects);
    return projects[index];
  }

  async delete(id: string): Promise<boolean> {
    const projects = await this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    
    if (filtered.length === projects.length) return false;
    
    await this.storage.set(this.STORAGE_KEY, filtered);
    return true;
  }

  async setProjects(projects: Project[]): Promise<void> {
    await this.storage.set(this.STORAGE_KEY, projects);
  }

  private generateId(): string {
    return 'proj-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
