/**
 * Service de Inicialização de Dados
 * Carrega dados iniciais do ficheiro JSON quando a aplicação inicia
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from './category.service';
import { ProjectService } from './project.service';
import { TaskService } from './task.service';

/** Interface para os dados iniciais do JSON */
interface InitialData {
  categories: any[];
  projects: any[];
  tasks: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DataInitService {
  /** Flag para controlar se já foi inicializado */
  private initialized = false;

  constructor(
    private http: HttpClient,
    private categoryService: CategoryService,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  /**
   * Inicializa os dados da aplicação
   * Carrega dados do ficheiro JSON se não existirem dados guardados
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Carregar dados do ficheiro JSON
      const data = await firstValueFrom(
        this.http.get<InitialData>('assets/data/initial-data.json')
      );

      // Carregar dados iniciais em cada service
      if (data.categories) {
        await this.categoryService.loadInitialData(data.categories);
      }
      if (data.projects) {
        await this.projectService.loadInitialData(data.projects);
      }
      if (data.tasks) {
        await this.taskService.loadInitialData(data.tasks);
      }

      this.initialized = true;
      console.log('Dados iniciais carregados com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  }
}


