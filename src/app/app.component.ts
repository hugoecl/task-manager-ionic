/**
 * Componente Principal da Aplicação
 * Inicializa os dados, gere o side menu e configura orientação do dispositivo
 */
import { Component, OnInit } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { ScreenOrientation } from '@capacitor/screen-orientation';
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
    private platform: Platform,
    private dataInitService: DataInitService
  ) {
    this.initializeApp();
  }

  /**
   * Inicializa configurações da aplicação
   */
  async initializeApp(): Promise<void> {
    // Aguarda a plataforma estar pronta
    await this.platform.ready();
    
    // Bloqueia orientação em portrait (apenas em dispositivos nativos)
    if (this.platform.is('capacitor')) {
      await this.lockOrientation();
    }
  }

  /**
   * Bloqueia a orientação do ecrã em portrait
   * Impede rotação para landscape
   */
  async lockOrientation(): Promise<void> {
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
      console.log('Orientação bloqueada em portrait');
    } catch (error) {
      console.log('Não foi possível bloquear orientação:', error);
    }
  }

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
