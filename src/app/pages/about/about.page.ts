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
  appVersion = '1.0.0';
  currentYear = new Date().getFullYear();

  constructor() { }
}
