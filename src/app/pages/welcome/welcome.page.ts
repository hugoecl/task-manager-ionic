/**
 * Página de Boas-Vindas (Landing Page)
 * Primeira página que o utilizador vê ao abrir a app
 */
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false
})
export class WelcomePage {

  constructor(private router: Router) { }

  /**
   * Navega para a página principal (dashboard)
   */
  goToApp(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Navega para o calendário
   */
  goToCalendar(): void {
    this.router.navigate(['/calendar']);
  }
}
