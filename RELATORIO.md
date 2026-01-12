# Relatório - Task Manager
## Aplicação Móvel para Gestão de Tarefas

---

## 1. Identificação do Autor

**Curso:** [Preencher com o nome do curso]  
**Nome:** [Preencher com o seu nome completo]  
**Número:** [Preencher com o seu número de estudante]  
**Email:** [Preencher com o seu email]

---

## 2. Diagrama da Base de Dados

A aplicação utiliza **Ionic Storage** para persistência local de dados. Embora não seja uma base de dados relacional tradicional, a estrutura de dados segue um modelo hierárquico bem definido.

### 2.1 Estrutura de Dados

```
┌─────────────────┐
│   Category      │
│─────────────────│
│ id: string      │
│ name: string    │
│ color: string   │
│ icon: string    │
│ createdAt: Date │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│    Project       │
│──────────────────│
│ id: string       │
│ name: string     │
│ description: str │
│ categoryId: str  │◄──┐
│ createdAt: Date  │   │
│ updatedAt: Date   │   │
└────────┬─────────┘   │
         │             │
         │ 1:N         │
         │             │
┌────────▼─────────┐  │
│      Task         │  │
│───────────────────│  │
│ id: string        │  │
│ title: string     │  │
│ description: str  │  │
│ dueDate: Date     │  │
│ projectId: string │──┘
│ completed: bool   │
│ imageUrl?: string │
│ priority: enum   │
│ order: number     │
│ createdAt: Date   │
│ updatedAt: Date   │
└───────────────────┘
```

### 2.2 Relacionamentos

- **Category → Project**: Relação 1:N (Uma categoria pode ter vários projetos)
- **Project → Task**: Relação 1:N (Um projeto pode ter várias tarefas)
- **Task → Project**: Relação N:1 (Uma tarefa pertence a um projeto)

### 2.3 Armazenamento

Os dados são armazenados localmente no dispositivo através do **Ionic Storage**, que utiliza:
- **Web**: IndexedDB ou LocalStorage (dependendo do browser)
- **Mobile**: SQLite (via Capacitor)

**Chaves de Armazenamento:**
- `categories`: Array de categorias
- `projects`: Array de projetos
- `tasks`: Array de tarefas

### 2.4 Modelos de Dados

#### Category
```typescript
interface Category {
  id: string;              // Identificador único
  name: string;            // Nome da categoria (ex: "Escola", "Trabalho")
  color: string;           // Cor em hexadecimal
  icon: string;            // Nome do ícone Ionic
  createdAt: Date;         // Data de criação
}
```

#### Project
```typescript
interface Project {
  id: string;              // Identificador único
  name: string;            // Nome do projeto
  description: string;      // Descrição do projeto
  categoryId: string;      // Referência à categoria
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Data da última atualização
}
```

#### Task
```typescript
interface Task {
  id: string;              // Identificador único
  title: string;           // Título da tarefa
  description: string;     // Descrição detalhada
  dueDate: Date;          // Data limite
  projectId: string;      // Referência ao projeto
  completed: boolean;     // Estado de conclusão
  imageUrl?: string;      // URL da imagem (opcional)
  priority: 'low' | 'medium' | 'high';  // Prioridade
  order: number;          // Ordem para ordenação
  createdAt: Date;         // Data de criação
  updatedAt: Date;         // Data da última atualização
}
```

---

## 3. Arquitetura do Projeto

### 3.1 Estrutura de Pastas

```
task-manager/
├── android/                    # Projeto Android (Capacitor)
├── src/
│   ├── app/
│   │   ├── models/            # Interfaces TypeScript
│   │   │   ├── category.model.ts
│   │   │   ├── project.model.ts
│   │   │   ├── task.model.ts
│   │   │   └── index.ts
│   │   ├── services/          # Lógica de negócio
│   │   │   ├── category.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── data-init.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── translation.service.ts
│   │   │   ├── utils.service.ts
│   │   │   ├── weather.service.ts
│   │   │   └── index.ts
│   │   ├── pages/             # Páginas da aplicação
│   │   │   ├── welcome/       # Página inicial
│   │   │   ├── tabs/          # Navegação por tabs
│   │   │   ├── home/          # Dashboard
│   │   │   ├── categories/    # Gestão de categorias
│   │   │   ├── projects/      # Gestão de projetos
│   │   │   ├── tasks/         # Gestão de tarefas
│   │   │   ├── task-detail/   # Detalhes/edição de tarefa
│   │   │   ├── calendar/      # Calendário
│   │   │   ├── about/         # Sobre a aplicação
│   │   │   └── faq/           # FAQ
│   │   ├── app.module.ts      # Módulo principal
│   │   ├── app-routing.module.ts  # Rotas principais
│   │   └── app.component.ts   # Componente raiz
│   ├── assets/
│   │   ├── data/              # Dados iniciais e traduções
│   │   │   ├── initial-data.json
│   │   │   └── translations.json
│   │   └── icon/              # Ícones da aplicação
│   ├── theme/
│   │   └── variables.scss     # Variáveis CSS globais
│   ├── global.scss            # Estilos globais
│   └── index.html             # HTML principal
├── capacitor.config.ts         # Configuração Capacitor
├── angular.json               # Configuração Angular
└── package.json               # Dependências
```

### 3.2 Arquitetura de Componentes

A aplicação segue o padrão **Angular NgModules** com arquitetura modular:

#### 3.2.1 Módulos
- **AppModule**: Módulo raiz que importa todos os módulos necessários
- **Feature Modules**: Cada página tem seu próprio módulo (lazy loading)
  - WelcomePageModule
  - TabsPageModule
  - HomePageModule
  - CategoriesPageModule
  - ProjectsPageModule
  - TasksPageModule
  - TaskDetailPageModule
  - CalendarPageModule

#### 3.2.2 Services (Camada de Serviços)
- **TaskService**: Gerencia todas as operações CRUD de tarefas
- **ProjectService**: Gerencia todas as operações CRUD de projetos
- **CategoryService**: Gerencia todas as operações CRUD de categorias
- **DataInitService**: Inicializa dados a partir de JSON
- **NotificationService**: Gerencia notificações locais
- **TranslationService**: Gerencia traduções e strings
- **UtilsService**: Métodos auxiliares reutilizáveis
- **WeatherService**: Integração com API externa de clima (Open-Meteo)

#### 3.2.3 Models (Camada de Dados)
- Interfaces TypeScript que definem a estrutura dos dados
- Exportadas através de barrel exports (`index.ts`)

### 3.3 Fluxo de Dados

```
┌─────────────┐
│   Component │
│   (View)    │
└──────┬──────┘
       │
       │ Chama métodos
       │
┌──────▼──────┐
│   Service   │
│  (Business  │
│   Logic)    │
└──────┬──────┘
       │
       │ Lê/Escreve
       │
┌──────▼──────┐
│   Storage   │
│  (Ionic     │
│  Storage)   │
└─────────────┘
```

### 3.4 Navegação (Routing)

A aplicação utiliza **Angular Router** com lazy loading:

```
/ (root)
├── /welcome              → WelcomePage
├── /tabs                 → TabsPage (container)
│   ├── /tabs/home        → HomePage (Dashboard)
│   ├── /tabs/categories  → CategoriesPage
│   ├── /tabs/projects    → ProjectsPage
│   ├── /tabs/tasks       → TasksPage
│   └── /tabs/calendar    → CalendarPage
├── /tasks/:projectId     → TasksPage (com projeto específico)
├── /task-detail/:taskId  → TaskDetailPage
└── /projects/category/:categoryId → ProjectsPage (filtrado)
```

### 3.5 Padrões de Design Utilizados

1. **Service Pattern**: Lógica de negócio isolada em services
2. **Repository Pattern**: Services atuam como repositórios de dados
3. **Observer Pattern**: Uso de RxJS para reatividade
4. **Module Pattern**: Organização em módulos Angular
5. **Component Pattern**: Componentes reutilizáveis

---

## 4. Tecnologias e Bibliotecas Utilizadas

### 4.1 Framework Principal

- **Ionic 8.0.0**: Framework para desenvolvimento de aplicações móveis híbridas
- **Angular 20.0.0**: Framework TypeScript para construção da aplicação
- **TypeScript 5.9.0**: Linguagem de programação

### 4.2 Capacitor (Nativo)

- **@capacitor/core 8.0.0**: Core do Capacitor
- **@capacitor/android 8.0.0**: Suporte para Android
- **@capacitor/app 8.0.0**: APIs da aplicação
- **@capacitor/camera 8.0.0**: Acesso à câmera do dispositivo
- **@capacitor/geolocation 8.0.0**: Geolocalização do dispositivo
- **@capacitor/local-notifications 8.0.0**: Notificações locais
- **@capacitor/screen-orientation 8.0.0**: Controlo de orientação
- **@capacitor/splash-screen 8.0.0**: Splash screen
- **@capacitor/status-bar 8.0.0**: Controlo da barra de estado
- **@capacitor/keyboard 8.0.0**: Controlo do teclado
- **@capacitor/haptics 8.0.0**: Feedback háptico

### 4.3 APIs Externas

- **Open-Meteo Weather API**: API gratuita de clima sem necessidade de API key
  - URL: `https://api.open-meteo.com/v1/forecast`
  - Utilizada para mostrar condições climáticas no dashboard e calendário
  - Implementada em `WeatherService`
  - **Geolocalização**: Utiliza `@capacitor/geolocation` para obter localização do dispositivo
  - Mostra clima baseado na localização atual do utilizador

### 4.4 Armazenamento

- **@ionic/storage-angular 4.0.0**: Sistema de armazenamento local (IndexedDB/SQLite)

### 4.5 UI Components

- **ionicons 7.0.0**: Biblioteca de ícones do Ionic

### 4.6 Outras Dependências

- **rxjs 7.8.0**: Biblioteca para programação reativa
- **zone.js 0.15.0**: Zone para detecção de mudanças do Angular

### 4.7 Ferramentas de Desenvolvimento

- **@angular/cli 20.0.0**: CLI do Angular
- **@ionic/angular-toolkit 12.0.0**: Ferramentas do Ionic
- **ESLint**: Linter para TypeScript
- **Karma & Jasmine**: Framework de testes

### 4.8 Fontes

- **Google Fonts - Inter**: Fonte personalizada importada

---

## 5. Manual do Utilizador

### 5.1 Primeiro Acesso

1. **Abrir a aplicação**: Ao iniciar, aparece a página de boas-vindas
2. **Começar**: Clicar no botão "Começar" para aceder à aplicação
3. **Dados iniciais**: A aplicação carrega automaticamente dados de exemplo

### 5.2 Navegação Principal

A aplicação possui **5 tabs principais** na parte inferior:

- **🏠 Home**: Dashboard com resumo de tarefas
- **📋 Tarefas**: Lista de todas as tarefas
- **📁 Projetos**: Gestão de projetos
- **📅 Calendário**: Visualização de tarefas por data
- **🏷️ Categorias**: Gestão de categorias

### 5.3 Gestão de Categorias

#### Criar Categoria
1. Aceder ao tab **Categorias**
2. Clicar no botão **+** (FAB) no canto inferior direito
3. Preencher:
   - Nome da categoria
   - Selecionar cor
   - Selecionar ícone
4. Clicar em **Criar**

#### Editar Categoria
1. Na lista de categorias, clicar no ícone de **editar** (lápis)
2. Modificar os campos desejados
3. Clicar em **Guardar**

#### Eliminar Categoria
1. Na lista de categorias, clicar no ícone de **eliminar** (lixeira)
2. Confirmar a eliminação

**⚠️ Atenção**: Ao eliminar uma categoria, os projetos associados não são eliminados, mas ficam sem categoria.

### 5.4 Gestão de Projetos

#### Criar Projeto
1. Aceder ao tab **Projetos**
2. Clicar no botão **+** (FAB)
3. Selecionar uma **categoria**
4. Preencher:
   - Nome do projeto
   - Descrição (opcional)
5. Clicar em **Criar**

#### Visualizar Projetos por Categoria
1. No tab **Projetos**, clicar numa categoria no topo
2. A lista filtra automaticamente os projetos dessa categoria

#### Editar Projeto
1. Na lista de projetos, clicar no ícone de **editar** (lápis)
2. Modificar nome, descrição ou categoria
3. Clicar em **Guardar**

#### Eliminar Projeto
1. Na lista de projetos, clicar no ícone de **eliminar** (lixeira)
2. Confirmar a eliminação

**⚠️ Atenção**: Ao eliminar um projeto, **todas as tarefas associadas são também eliminadas**.

#### Ver Tarefas de um Projeto
1. Clicar num projeto na lista
2. É redirecionado para a página de tarefas desse projeto

### 5.5 Gestão de Tarefas

#### Criar Tarefa
1. Aceder ao tab **Tarefas** ou abrir um projeto específico
2. Clicar no botão **+** (FAB)
3. Se estiver no tab geral, selecionar primeiro o projeto
4. Selecionar a **prioridade** (Alta, Média, Baixa)
5. Preencher:
   - **Título** (obrigatório)
   - Descrição (opcional)
   - Data limite
6. Clicar em **Criar Tarefa**

#### Filtrar Tarefas
No tab **Tarefas**, usar os filtros no topo:
- **Todas**: Mostra todas as tarefas
- **Pendentes**: Apenas tarefas não concluídas
- **Atraso**: Tarefas com data limite passada
- **Feitas**: Tarefas concluídas

#### Ordenar Tarefas
1. Abrir um projeto específico
2. Clicar no ícone de **ordenar** (↕️) no header
3. Arrastar as tarefas para a posição desejada
4. Clicar novamente no ícone para sair do modo ordenação

#### Marcar como Concluída
1. Clicar no **checkbox** à esquerda da tarefa
2. A tarefa fica riscada e com opacidade reduzida

#### Editar Tarefa
1. Clicar na tarefa para abrir os detalhes
2. Clicar no botão **Editar** (lápis)
3. Modificar os campos desejados
4. Clicar em **Guardar**

#### Adicionar Imagem à Tarefa
1. Abrir os detalhes da tarefa
2. Na secção **Imagem**, clicar em **Adicionar Imagem**
3. Escolher:
   - **Câmera**: Tirar foto
   - **Galeria**: Escolher foto existente
4. A imagem é associada à tarefa

#### Mover Tarefa para Outro Projeto
1. Abrir os detalhes da tarefa
2. Clicar no botão **Mover para** (↔️)
3. Selecionar o projeto de destino
4. Confirmar

#### Eliminar Tarefa
**Opção 1**: Na lista de tarefas
1. Deslizar a tarefa para a esquerda
2. Clicar no ícone de **eliminar** (lixeira)
3. Confirmar

**Opção 2**: Nos detalhes da tarefa
1. Abrir os detalhes da tarefa
2. Clicar no botão **Eliminar** (lixeira)
3. Confirmar

### 5.6 Calendário

#### Visualizar Tarefas no Calendário
1. Aceder ao tab **Calendário**
2. O calendário mostra:
   - **🔴 Laranja-vermelho**: Dias com tarefas em atraso
   - **🟠 Laranja**: Dias com tarefas pendentes
   - **🟢 Verde**: Dias apenas com tarefas concluídas
3. Clicar numa data para ver as tarefas desse dia

#### Ver Detalhes de Tarefa no Calendário
1. Selecionar uma data no calendário
2. **Clima do dia**: Aparece a previsão do tempo para a data selecionada (se for hoje ou futuro)
3. Na lista abaixo, clicar numa tarefa
4. É redirecionado para os detalhes da tarefa
5. Pode editar a tarefa, incluindo a data limite

### 5.7 Dashboard (Home)

O dashboard mostra:
- **Estatísticas gerais**: Total de tarefas e percentagem concluídas
- **Tarefas em atraso**: Lista de tarefas com data limite passada
- **Próximas tarefas**: Tarefas dos próximos 7 dias
- **Clima atual**: Widget com temperatura e condições climáticas (API Open-Meteo)

### 5.8 Notificações

A aplicação envia notificações automáticas:
- **Tarefas em atraso**: Notificação diária para tarefas atrasadas
- **Lembretes**: Notificações antes da data limite (configurável)

**Permissões**: Na primeira execução, a aplicação pede permissão para enviar notificações.

### 5.9 Menu Lateral

Aceder ao menu através do ícone ☰ no canto superior esquerdo:
- **Home**: Voltar ao dashboard
- **Sobre**: Informações sobre a aplicação
- **FAQ**: Perguntas frequentes

### 5.10 Dicas e Atalhos

- **Swipe para eliminar**: Deslizar uma tarefa para a esquerda revela opções
- **Long press**: Manter pressionado alguns elementos revela ações rápidas
- **FAB**: Botão flutuante (+) sempre disponível para criar novos itens
- **Filtros**: Use os filtros para encontrar rapidamente tarefas específicas

### 5.11 Resolução de Problemas

#### A aplicação não abre
- Verificar se tem permissões de instalação de aplicações desconhecidas ativadas
- Reinstalar a aplicação

#### Notificações não aparecem
- Verificar permissões de notificação nas definições do dispositivo
- Reiniciar a aplicação

#### Dados desaparecem
- Os dados são armazenados localmente no dispositivo
- Se desinstalar a aplicação, os dados são perdidos
- Fazer backup regularmente (exportar dados se implementado)

#### Imagens não aparecem
- Verificar permissões de câmera e galeria
- Verificar espaço de armazenamento do dispositivo

#### Clima não aparece
- Verificar permissões de localização nas definições do dispositivo
- A aplicação pede permissão na primeira vez que tenta obter o clima
- Se negar permissão, usa coordenadas padrão (Lisboa, Portugal)
- Em browser, verificar se o site tem permissão de localização

---

## 6. Funcionalidades Implementadas

### 6.1 Funcionalidades Obrigatórias ✅

- ✅ Gestão completa de categorias (CRUD)
- ✅ Gestão completa de projetos (CRUD)
- ✅ Visualização de projetos por categoria
- ✅ Identificação visual de tarefas em atraso
- ✅ Gestão completa de tarefas (CRUD)
- ✅ Ordenação de tarefas (drag & drop)
- ✅ Movimentação de tarefas entre projetos
- ✅ Service dedicado para tarefas (TaskService)
- ✅ Calendário com visualização de datas limite
- ✅ Edição de tarefas a partir do calendário

### 6.2 Funcionalidades Opcionais ✅

- ✅ Notificações locais para tarefas em atraso
- ✅ Suporte a imagens nas tarefas (câmera/galeria)
- ✅ Bloqueio de orientação (apenas portrait)
- ✅ Ícone e splash screen customizados
- ✅ Fonte personalizada (Inter)
- ✅ Service de traduções (strings isoladas)
- ✅ Dashboard com estatísticas
- ✅ **API Externa de Clima (Open-Meteo)**: Mostra condições climáticas no dashboard e calendário
  - Utiliza geolocalização do dispositivo para mostrar clima local
  - Funciona em browser (HTML5 Geolocation) e dispositivos móveis (Capacitor)

---

## 7. Conclusão

A aplicação **Task Manager** foi desenvolvida com sucesso, implementando todas as funcionalidades obrigatórias solicitadas no enunciado, bem como várias funcionalidades opcionais que valorizam a experiência do utilizador.

A arquitetura modular do Angular, combinada com os componentes do Ionic e as capacidades nativas do Capacitor, resultou numa aplicação robusta, responsiva e fácil de utilizar.

O projeto demonstra conhecimentos sólidos em:
- Desenvolvimento móvel híbrido (Ionic + Angular)
- Arquitetura de software (Services, Modules, Components)
- Persistência de dados (Ionic Storage)
- Integração com APIs nativas (Capacitor)
- Design de interfaces (UI/UX)
- Programação reativa (RxJS)

---

**Data de Conclusão:** [Preencher com a data]  
**Versão:** 1.0.0
