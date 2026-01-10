/**
 * Service para inicialização dos dados
 * Carrega dados iniciais do JSON se não existirem no Storage
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from './category.service';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';

interface InitialData {
  categories: any[];
  projects: any[];
  tasks: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DataInitService {
  private readonly INIT_KEY = 'data_initialized';

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private categoryService: CategoryService,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  async initialize(): Promise<void> {
    await this.storage.create();
    
    const initialized = await this.storage.get(this.INIT_KEY);
    
    if (!initialized) {
      await this.loadInitialData();
      await this.storage.set(this.INIT_KEY, true);
      console.log('Dados iniciais carregados com sucesso');
    } else {
      console.log('Dados já inicializados anteriormente');
    }
  }

  private async loadInitialData(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<InitialData>('assets/data/initial-data.json')
      );

      if (data.categories && data.categories.length > 0) {
        await this.categoryService.setCategories(data.categories);
      }

      if (data.projects && data.projects.length > 0) {
        await this.projectService.setProjects(data.projects);
      }

      if (data.tasks && data.tasks.length > 0) {
        await this.taskService.setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  }

  async resetData(): Promise<void> {
    await this.storage.remove(this.INIT_KEY);
    await this.loadInitialData();
    await this.storage.set(this.INIT_KEY, true);
    console.log('Dados reiniciados');
  }
}

