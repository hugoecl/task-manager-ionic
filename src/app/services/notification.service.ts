/**
 * Service para gestão de Notificações Locais
 * Agenda e cancela notificações para tarefas em atraso e próximas do deadline
 */
import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Platform } from '@ionic/angular';
import { Task } from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly ENABLED_KEY = 'notifications_enabled';
  
  constructor(private platform: Platform) {
    this.initializeNotifications();
  }

  /**
   * Inicializa as permissões de notificação
   */
  async initializeNotifications(): Promise<void> {
    if (this.platform.is('capacitor')) {
      try {
        // Solicitar permissão para notificações
        const permissionStatus = await LocalNotifications.checkPermissions();
        
        if (permissionStatus.display !== 'granted') {
          const requestResult = await LocalNotifications.requestPermissions();
          if (requestResult.display === 'granted') {
            console.log('Permissão de notificações concedida');
          } else {
            console.log('Permissão de notificações negada');
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar notificações:', error);
      }
    }
  }

  /**
   * Agenda uma notificação para uma tarefa
   * @param task Tarefa para a qual agendar notificação
   * @param hoursBefore Horas antes do deadline (ex: 24 para notificar 1 dia antes)
   */
  async scheduleTaskNotification(task: Task, hoursBefore: number = 24): Promise<void> {
    if (!this.platform.is('capacitor') || task.completed) {
      return;
    }

    try {
      const dueDate = new Date(task.dueDate);
      const notificationTime = new Date(dueDate.getTime() - hoursBefore * 60 * 60 * 1000);
      const now = new Date();

      // Não agendar se a data já passou
      if (notificationTime <= now) {
        return;
      }

      // Criar ID único baseado no taskId e horas antes
      const notificationId = this.getNotificationId(task.id, hoursBefore);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: `⏰ Tarefa: ${task.title}`,
            body: hoursBefore === 0 
              ? 'Esta tarefa está em atraso!'
              : `A tarefa expira em ${hoursBefore}h`,
            id: notificationId,
            schedule: { at: notificationTime },
            sound: 'default',
            attachments: undefined,
            actionTypeId: 'TASK_NOTIFICATION',
            extra: {
              taskId: task.id,
              type: hoursBefore === 0 ? 'overdue' : 'reminder'
            }
          }
        ]
      });

      console.log(`Notificação agendada para tarefa ${task.id} em ${notificationTime}`);
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
    }
  }

  /**
   * Agenda múltiplas notificações para uma tarefa
   * @param task Tarefa para a qual agendar notificações
   */
  async scheduleTaskNotifications(task: Task): Promise<void> {
    if (task.completed) {
      return;
    }

    // Cancelar notificações anteriores desta tarefa
    await this.cancelTaskNotifications(task.id);

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    // Se a tarefa já está em atraso, agendar notificação imediata
    if (dueDate < now && !task.completed) {
      await this.scheduleTaskNotification(task, 0);
    } else {
      // Agendar notificações: 1 dia antes, 6 horas antes, 1 hora antes
      await this.scheduleTaskNotification(task, 24);
      await this.scheduleTaskNotification(task, 6);
      await this.scheduleTaskNotification(task, 1);
    }
  }

  /**
   * Cancela todas as notificações de uma tarefa
   * @param taskId ID da tarefa
   */
  async cancelTaskNotifications(taskId: string): Promise<void> {
    if (!this.platform.is('capacitor')) {
      return;
    }

    try {
      // IDs de notificação para esta tarefa: 24h, 6h, 1h, 0h (overdue)
      const notificationIds = [
        this.getNotificationId(taskId, 24),
        this.getNotificationId(taskId, 6),
        this.getNotificationId(taskId, 1),
        this.getNotificationId(taskId, 0)
      ];

      await LocalNotifications.cancel({ notifications: notificationIds.map(id => ({ id })) });
      console.log(`Notificações canceladas para tarefa ${taskId}`);
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }

  /**
   * Verifica tarefas em atraso e agenda notificações
   * @param tasks Lista de tarefas a verificar
   */
  async checkOverdueTasks(tasks: Task[]): Promise<void> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const task of tasks) {
      if (task.completed) {
        continue;
      }

      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      // Se está em atraso, agendar notificação imediata
      if (dueDate < now) {
        await this.scheduleTaskNotification(task, 0);
      } else {
        // Caso contrário, agendar notificações normais
        await this.scheduleTaskNotifications(task);
      }
    }
  }

  /**
   * Cancela todas as notificações pendentes
   */
  async cancelAllNotifications(): Promise<void> {
    if (!this.platform.is('capacitor')) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [] });
      console.log('Todas as notificações foram canceladas');
    } catch (error) {
      console.error('Erro ao cancelar todas as notificações:', error);
    }
  }

  /**
   * Gera um ID único para a notificação baseado no taskId e horas antes
   */
  private getNotificationId(taskId: string, hoursBefore: number): number {
    // Converter taskId para hash numérico simples
    let hash = 0;
    for (let i = 0; i < taskId.length; i++) {
      const char = taskId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Combinar hash com hoursBefore para criar ID único
    // Usar range 100000-999999 para evitar conflitos
    const baseId = Math.abs(hash) % 100000;
    return baseId * 10 + hoursBefore;
  }
}
