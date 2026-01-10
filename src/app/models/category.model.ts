/**
 * Interface que representa uma Categoria de Projetos
 * As categorias servem para agrupar projetos por tipo (Ex: Escola, Trabalho, Pessoal)
 */
export interface Category {
  /** Identificador único da categoria */
  id: string;
  
  /** Nome da categoria */
  name: string;
  
  /** Cor associada à categoria (em formato hexadecimal) */
  color: string;
  
  /** Ícone da categoria (nome do ícone Ionic) */
  icon: string;
  
  /** Data de criação */
  createdAt: Date;
}

