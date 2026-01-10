/**
 * Página de Perguntas Frequentes (FAQ)
 * Ajuda e dúvidas sobre a aplicação
 */
import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.page.html',
  styleUrls: ['./faq.page.scss'],
  standalone: false
})
export class FaqPage {

  /** Lista de perguntas frequentes */
  faqs: FaqItem[] = [
    {
      question: 'Como criar uma nova categoria?',
      answer: 'Vai a Categorias e clica no botão "+" no canto inferior direito. Introduz o nome da categoria e ela será criada com uma cor e ícone aleatórios que podes alterar depois.',
      expanded: false
    },
    {
      question: 'Como adicionar uma tarefa a um projeto?',
      answer: 'Primeiro seleciona o projeto na lista de projetos, depois clica no botão "+" para adicionar uma nova tarefa. Preenche o título, descrição, data limite e prioridade.',
      expanded: false
    },
    {
      question: 'Como ver as tarefas em atraso?',
      answer: 'As tarefas em atraso aparecem destacadas no Dashboard (página inicial) com fundo vermelho. Também podes ver no calendário, onde os dias com tarefas em atraso estão marcados a vermelho.',
      expanded: false
    },
    {
      question: 'Como mover uma tarefa para outro projeto?',
      answer: 'Abre os detalhes da tarefa, clica nos três pontos (⋮) no canto superior direito e seleciona "Mover para outro projeto".',
      expanded: false
    },
    {
      question: 'Como reordenar tarefas?',
      answer: 'Na lista de tarefas de um projeto, clica no ícone de reordenar no header. Depois arrasta as tarefas para a ordem desejada.',
      expanded: false
    },
    {
      question: 'Os dados são guardados onde?',
      answer: 'Os dados são guardados localmente no dispositivo usando Ionic Storage. Não são enviados para nenhum servidor externo.',
      expanded: false
    },
    {
      question: 'Como eliminar uma categoria?',
      answer: 'Na lista de categorias, desliza o item para a esquerda para ver as opções. Clica no ícone de eliminar (lixo). Atenção: eliminar uma categoria também elimina todos os projetos e tarefas associados!',
      expanded: false
    }
  ];

  constructor() { }

  /**
   * Expande/colapsa uma pergunta
   */
  toggleFaq(faq: FaqItem): void {
    faq.expanded = !faq.expanded;
  }

}
