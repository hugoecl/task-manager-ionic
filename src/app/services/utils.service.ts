/**
 * Service de Utilidades
 * Métodos auxiliares reutilizáveis em toda a aplicação
 */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  /**
   * Retorna a cor do Ionic baseada na prioridade
   * @param priority Prioridade da tarefa ('low' | 'medium' | 'high')
   * @returns Nome da cor do Ionic
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  /**
   * Retorna o texto da prioridade em português
   * @param priority Prioridade da tarefa ('low' | 'medium' | 'high')
   * @returns Texto da prioridade
   */
  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return '';
    }
  }

  /**
   * Verifica se uma tarefa está em atraso
   * @param dueDate Data limite da tarefa
   * @param completed Se a tarefa está concluída
   * @returns true se a tarefa está em atraso
   */
  isOverdue(dueDate: Date, completed: boolean): boolean {
    if (completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
  }

  /**
   * Verifica se uma data é hoje
   * @param date Data a verificar
   * @returns true se a data é hoje
   */
  isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
  }

  /**
   * Formata uma data para exibição
   * @param date Data a formatar
   * @returns String formatada
   */
  formatDate(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === today.getTime()) {
      return 'Hoje';
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (checkDate.getTime() === tomorrow.getTime()) {
      return 'Amanhã';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (checkDate.getTime() === yesterday.getTime()) {
      return 'Ontem';
    }

    return checkDate.toLocaleDateString('pt-PT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }
}
