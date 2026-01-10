/**
 * Componente Principal da Aplicação
 * Inicializa os dados quando a app arranca
 */
import { Component, OnInit } from '@angular/core';
import { DataInitService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  
  constructor(private dataInitService: DataInitService) {}

  /**
   * Inicializa os dados da aplicação quando arranca
   */
  async ngOnInit(): Promise<void> {
    await this.dataInitService.initialize();
  }
}
