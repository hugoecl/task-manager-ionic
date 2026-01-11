/**
 * Service para gestão de traduções e strings da aplicação
 * Isola todas as strings em ficheiros JSON para facilitar manutenção e internacionalização
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Translations {
  common: { [key: string]: string };
  tasks: { [key: string]: string | { [key: string]: string } };
  projects: { [key: string]: string };
  categories: { [key: string]: string };
  calendar: { [key: string]: string };
  home: { [key: string]: string };
  welcome: { [key: string]: string };
  notifications: { [key: string]: string };
  placeholders: { [key: string]: string };
  labels: { [key: string]: string };
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: Translations | null = null;
  private readonly TRANSLATIONS_PATH = 'assets/data/translations.json';

  constructor(private http: HttpClient) {}

  /**
   * Carrega as traduções do ficheiro JSON
   */
  async loadTranslations(): Promise<void> {
    if (this.translations) {
      return; // Já carregadas
    }

    try {
      this.translations = await firstValueFrom(
        this.http.get<Translations>(this.TRANSLATIONS_PATH)
      );
    } catch (error) {
      console.error('Erro ao carregar traduções:', error);
      // Fallback para objeto vazio se não conseguir carregar
      this.translations = {
        common: {},
        tasks: {},
        projects: {},
        categories: {},
        calendar: {},
        home: {},
        welcome: {},
        notifications: {},
        placeholders: {},
        labels: {}
      } as Translations;
    }
  }

  /**
   * Obtém uma tradução por chave
   * @param key Caminho da chave (ex: 'tasks.title' ou 'common.cancel')
   * @param defaultValue Valor padrão se a chave não existir
   */
  get(key: string, defaultValue: string = ''): string {
    if (!this.translations) {
      console.warn('Traduções ainda não foram carregadas. Usando valor padrão.');
      return defaultValue;
    }

    const keys = key.split('.');
    let value: any = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue || key;
      }
    }

    return typeof value === 'string' ? value : defaultValue || key;
  }

  /**
   * Obtém tradução de tarefas
   */
  task(key: string, defaultValue: string = ''): string {
    return this.get(`tasks.${key}`, defaultValue);
  }

  /**
   * Obtém tradução de projetos
   */
  project(key: string, defaultValue: string = ''): string {
    return this.get(`projects.${key}`, defaultValue);
  }

  /**
   * Obtém tradução de categorias
   */
  category(key: string, defaultValue: string = ''): string {
    return this.get(`categories.${key}`, defaultValue);
  }

  /**
   * Obtém tradução comum
   */
  common(key: string, defaultValue: string = ''): string {
    return this.get(`common.${key}`, defaultValue);
  }

  /**
   * Obtém placeholder
   */
  placeholder(key: string, defaultValue: string = ''): string {
    return this.get(`placeholders.${key}`, defaultValue);
  }

  /**
   * Obtém label
   */
  label(key: string, defaultValue: string = ''): string {
    return this.get(`labels.${key}`, defaultValue);
  }

  /**
   * Obtém tradução de notificações
   */
  notification(key: string, defaultValue: string = ''): string {
    return this.get(`notifications.${key}`, defaultValue);
  }

  /**
   * Obtém tradução de calendário
   */
  calendar(key: string, defaultValue: string = ''): string {
    return this.get(`calendar.${key}`, defaultValue);
  }

  /**
   * Obtém tradução de home
   */
  home(key: string, defaultValue: string = ''): string {
    return this.get(`home.${key}`, defaultValue);
  }

  /**
   * Obtém tradução de welcome
   */
  welcome(key: string, defaultValue: string = ''): string {
    return this.get(`welcome.${key}`, defaultValue);
  }
}
