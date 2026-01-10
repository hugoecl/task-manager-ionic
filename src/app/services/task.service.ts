/**
 * Service para gestão de Tarefas
 */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Task } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'tasks';

  constructor(private storage: Storage) {
    this.init();
  }

  private async init(): Promise<void> {
    await this.storage.create();
  }

  async getTasks(): Promise<Task[]> {
    const stored = await this.storage.get(this.STORAGE_KEY);
    return stored || [];
  }

  async getAll(): Promise<Task[]> {
    return this.getTasks();
  }

  async getById(id: string): Promise<Task | undefined> {
    const tasks = await this.getTasks();
    return tasks.find(t => t.id === id);
  }

  async getByProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks.filter(t => t.projectId === projectId).sort((a, b) => a.order - b.order);
  }

  async getByDate(date: Date): Promise<Task[]> {
    const tasks = await this.getTasks();
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(t => {
      const taskDate = new Date(t.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  }

  async getOverdue(): Promise<Task[]> {
    const tasks = await this.getTasks();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return tasks.filter(t => {
      if (t.completed) return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < now;
    });
  }

  async create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Task> {
    const now = new Date();
    const tasks = await this.getTasks();
    const projectTasks = tasks.filter(t => t.projectId === task.projectId);
    const maxOrder = projectTasks.length > 0 ? Math.max(...projectTasks.map(t => t.order)) : 0;
    
    const newTask: Task = {
      ...task,
      id: this.generateId(),
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };
    
    tasks.push(newTask);
    await this.storage.set(this.STORAGE_KEY, tasks);
    return newTask;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) return undefined;
    
    tasks[index] = { 
      ...tasks[index], 
      ...updates,
      updatedAt: new Date()
    };
    await this.storage.set(this.STORAGE_KEY, tasks);
    return tasks[index];
  }

  async toggleComplete(id: string): Promise<Task | undefined> {
    const task = await this.getById(id);
    if (!task) return undefined;
    return this.update(id, { completed: !task.completed });
  }

  async delete(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    
    if (filtered.length === tasks.length) return false;
    
    await this.storage.set(this.STORAGE_KEY, filtered);
    return true;
  }

  async deleteByProject(projectId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.projectId !== projectId);
    await this.storage.set(this.STORAGE_KEY, filtered);
  }

  async moveToProject(taskId: string, newProjectId: string): Promise<Task | undefined> {
    return this.update(taskId, { projectId: newProjectId });
  }

  async reorder(projectId: string, taskIds: string[]): Promise<void> {
    const tasks = await this.getTasks();
    taskIds.forEach((id, index) => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        task.order = index + 1;
      }
    });
    await this.storage.set(this.STORAGE_KEY, tasks);
  }

  async setTasks(tasks: Task[]): Promise<void> {
    await this.storage.set(this.STORAGE_KEY, tasks);
  }

  private generateId(): string {
    return 'task-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
