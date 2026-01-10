/**
 * Interface que representa um Projeto
 * Os projetos agrupam tarefas e pertencem a uma categoria
 */
export interface Project {
  /** Identificador único do projeto */
  id: string;
  
  /** Nome do projeto */
  name: string;
  
  /** Descrição do projeto */
  description: string;
  
  /** ID da categoria a que pertence */
  categoryId: string;
  
  /** Data de criação */
  createdAt: Date;
  
  /** Data da última atualização */
  updatedAt: Date;
}

