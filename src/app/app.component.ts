/**
 * Componente Principal da Aplicação
 * Inicializa os dados, gere o side menu e configura orientação do dispositivo
 */
import { Component, OnInit } from '@angular/core';
import { MenuController, Platform } from '@ionic/angular';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { DataInitService } from './services/data-init.service';
import { NotificationService } from './services/notification.service';

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
    private dataInitService: DataInitService,
    private notificationService: NotificationService
  ) {
    this.initializeApp();
  }

  async initializeApp(): Promise<void> {
    await this.platform.ready();
    
    if (this.platform.is('capacitor')) {
      await this.lockOrientation();
      // Inicializar notificações
      await this.notificationService.initializeNotifications();
    }
  }

  async lockOrientation(): Promise<void> {
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
      console.log('Orientação bloqueada em portrait');
    } catch (error) {
      console.log('Não foi possível bloquear orientação:', error);
    }
  }

  async ngOnInit(): Promise<void> {
    await this.dataInitService.initialize();
  }

  closeMenu(): void {
    this.menuController.close('main-menu');
  }
}
