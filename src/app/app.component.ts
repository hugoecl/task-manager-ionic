/**
 * Componente Principal da Aplicação
 * Inicializa os dados e gere o side menu
 */
import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { DataInitService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  
  constructor(
    private menuController: MenuController,
    private dataInitService: DataInitService
  ) {}

  /**
   * Inicializa os dados da aplicação quando arranca
   */
  async ngOnInit(): Promise<void> {
    await this.dataInitService.initialize();
  }

  /**
   * Fecha o side menu
   */
  closeMenu(): void {
    this.menuController.close('main-menu');
  }
}
