/**
 * Página Sobre
 * Informações sobre a aplicação
 */
import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  standalone: false
})
export class AboutPage {

  /** Versão da aplicação */
  appVersion = '1.0.0';
  
  /** Ano atual */
  currentYear = new Date().getFullYear();

  constructor() { }

}
