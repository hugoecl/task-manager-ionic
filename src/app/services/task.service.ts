/**
 * Service para gestão de Tarefas
 * Implementa operações CRUD com persistência via Ionic Storage
 * Inclui funcionalidades para identificar tarefas em atraso
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Task } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  /** Chave usada para armazenar tarefas no Storage */
  private readonly STORAGE_KEY = 'tasks';
  
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
   * Gera um ID único para novas tarefas
   * @returns String com ID único
   */
  private generateId(): string {
    return 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Obtém todas as tarefas
   * @returns Promise com array de tarefas
   */
  async getAll(): Promise<Task[]> {
    await this.init();
    const tasks = await this._storage?.get(this.STORAGE_KEY);
    return tasks || [];
  }

  /**
   * Obtém uma tarefa pelo ID
   * @param id - ID da tarefa
   * @returns Promise com a tarefa ou undefined
   */
  async getById(id: string): Promise<Task | undefined> {
    const tasks = await this.getAll();
    return tasks.find(task => task.id === id);
  }

  /**
   * Obtém tarefas de um projeto específico
   * @param projectId - ID do projeto
   * @returns Promise com array de tarefas ordenadas
   */
  async getByProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks
      .filter(task => task.projectId === projectId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Obtém tarefas em atraso (data limite passou e não concluídas)
   * @returns Promise com array de tarefas em atraso
   */
  async getOverdue(): Promise<Task[]> {
    const tasks = await this.getAll();
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Início do dia atual
    
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return !task.completed && dueDate < now;
    });
  }

  /**
   * Obtém tarefas por data (para o calendário)
   * @param date - Data para filtrar
   * @returns Promise com array de tarefas dessa data
   */
  async getByDate(date: Date): Promise<Task[]> {
    const tasks = await this.getAll();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === targetDate.getTime();
    });
  }

  /**
   * Obtém todas as datas que têm tarefas (para marcar no calendário)
   * @returns Promise com array de datas únicas
   */
  async getDatesWithTasks(): Promise<Date[]> {
    const tasks = await this.getAll();
    const datesMap = new Map<string, Date>();
    
    tasks.forEach(task => {
      const date = new Date(task.dueDate);
      date.setHours(0, 0, 0, 0);
      datesMap.set(date.toISOString(), date);
    });
    
    return Array.from(datesMap.values());
  }

  /**
   * Cria uma nova tarefa
   * @param task - Dados da tarefa
   * @returns Promise com a tarefa criada
   */
  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Task> {
    const tasks = await this.getAll();
    const projectTasks = tasks.filter(t => t.projectId === task.projectId);
    const maxOrder = projectTasks.reduce((max, t) => Math.max(max, t.order), -1);
    const now = new Date();
    
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };
    
    tasks.push(newTask);
    await this._storage?.set(this.STORAGE_KEY, tasks);
    
    return newTask;
  }

  /**
   * Atualiza uma tarefa existente
   * @param id - ID da tarefa
   * @param updates - Campos a atualizar
   * @returns Promise com a tarefa atualizada ou undefined
   */
  async update(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const tasks = await this.getAll();
    const index = tasks.findIndex(task => task.id === id);
    
    if (index === -1) {
      return undefined;
    }
    
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date()
    };
    await this._storage?.set(this.STORAGE_KEY, tasks);
    
    return tasks[index];
  }

  /**
   * Alterna o estado de conclusão de uma tarefa
   * @param id - ID da tarefa
   * @returns Promise com a tarefa atualizada
   */
  async toggleComplete(id: string): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;
    
    return this.update(id, { completed: !task.completed });
  }

  /**
   * Move uma tarefa para outro projeto
   * @param taskId - ID da tarefa
   * @param newProjectId - ID do novo projeto
   * @returns Promise com a tarefa atualizada
   */
  async moveToProject(taskId: string, newProjectId: string): Promise<Task | undefined> {
    const tasks = await this.getAll();
    const projectTasks = tasks.filter(t => t.projectId === newProjectId);
    const maxOrder = projectTasks.reduce((max, t) => Math.max(max, t.order), -1);
    
    return this.update(taskId, {
      projectId: newProjectId,
      order: maxOrder + 1
    });
  }

  /**
   * Reordena tarefas dentro de um projeto
   * @param projectId - ID do projeto
   * @param taskIds - Array de IDs na nova ordem
   */
  async reorder(projectId: string, taskIds: string[]): Promise<void> {
    const tasks = await this.getAll();
    
    taskIds.forEach((taskId, index) => {
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].order = index;
        tasks[taskIndex].updatedAt = new Date();
      }
    });
    
    await this._storage?.set(this.STORAGE_KEY, tasks);
  }

  /**
   * Elimina uma tarefa
   * @param id - ID da tarefa
   * @returns Promise com boolean indicando sucesso
   */
  async delete(id: string): Promise<boolean> {
    const tasks = await this.getAll();
    const filteredTasks = tasks.filter(task => task.id !== id);
    
    if (filteredTasks.length === tasks.length) {
      return false;
    }
    
    await this._storage?.set(this.STORAGE_KEY, filteredTasks);
    return true;
  }

  /**
   * Elimina todas as tarefas de um projeto
   * @param projectId - ID do projeto
   * @returns Promise com número de tarefas eliminadas
   */
  async deleteByProject(projectId: string): Promise<number> {
    const tasks = await this.getAll();
    const filteredTasks = tasks.filter(task => task.projectId !== projectId);
    const deletedCount = tasks.length - filteredTasks.length;
    
    await this._storage?.set(this.STORAGE_KEY, filteredTasks);
    return deletedCount;
  }

  /**
   * Carrega dados iniciais
   * @param initialData - Array de tarefas iniciais
   */
  async loadInitialData(initialData: Task[]): Promise<void> {
    const existing = await this.getAll();
    if (existing.length === 0) {
      await this._storage?.set(this.STORAGE_KEY, initialData);
    }
  }
}

