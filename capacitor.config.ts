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
      backgroundColor: '#3880ff'
    },
    
    // Configuração do splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: false
    }
  }
};

export default config;
