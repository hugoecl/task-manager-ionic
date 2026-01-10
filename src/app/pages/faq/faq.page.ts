/**
 * Página de Perguntas Frequentes (FAQ)
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
  faqs: FaqItem[] = [
    {
      question: 'Como criar uma nova categoria?',
      answer: 'Vai a Categorias e clica no botão "+" no canto inferior direito.',
      expanded: false
    },
    {
      question: 'Como adicionar uma tarefa a um projeto?',
      answer: 'Primeiro seleciona o projeto, depois clica no botão "+" para adicionar.',
      expanded: false
    },
    {
      question: 'Como ver as tarefas em atraso?',
      answer: 'As tarefas em atraso aparecem no Dashboard com fundo vermelho.',
      expanded: false
    },
    {
      question: 'Os dados são guardados onde?',
      answer: 'Os dados são guardados localmente no dispositivo.',
      expanded: false
    }
  ];

  constructor() { }

  toggleFaq(faq: FaqItem): void {
    faq.expanded = !faq.expanded;
  }
}
