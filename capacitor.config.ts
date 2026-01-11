/**
 * Configuração do Capacitor
 * Define as configurações nativas da aplicação
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ID único da aplicação
  appId: 'com.hugoleite.taskmanager',
  
  // Nome da aplicação
  appName: 'Task Manager',
  
  // Diretório de build web
  webDir: 'www',
  
  // Configurações do servidor (desenvolvimento)
  server: {
    androidScheme: 'https'
  },
  
  // Configurações de plugins
  plugins: {
    // Configuração da barra de estado
    StatusBar: {
      style: 'dark',
      backgroundColor: '#2D3748'
    },
    
    // Configuração do splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2D3748',
      showSpinner: false
    },
    
    // Configuração de notificações locais
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#D4740F',
      sound: 'beep.wav'
    }
  }
};

export default config;
