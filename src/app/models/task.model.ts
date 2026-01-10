/**
 * Interface que representa uma Tarefa
 * As tarefas pertencem a um projeto e têm uma data limite
 */
export interface Task {
  /** Identificador único da tarefa */
  id: string;
  
  /** Título da tarefa */
  title: string;
  
  /** Descrição detalhada da tarefa */
  description: string;
  
  /** Data limite para conclusão */
  dueDate: Date;
  
  /** ID do projeto a que pertence */
  projectId: string;
  
  /** Indica se a tarefa está concluída */
  completed: boolean;
  
  /** URL ou path da imagem associada (opcional) */
  imageUrl?: string;
  
  /** Prioridade da tarefa */
  priority: 'low' | 'medium' | 'high';
  
  /** Ordem da tarefa dentro do projeto (para ordenação) */
  order: number;
  
  /** Data de criação */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}

