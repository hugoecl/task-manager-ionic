# 📱 Como Instalar a Nova Versão no Telemóvel

## Passo a Passo Simples

### 1️⃣ NO TERMINAL (VS Code ou PowerShell)

Abra o terminal na pasta do projeto e execute estes comandos **por ordem**:

```bash
# 1. Fazer build da aplicação
npm run build

# 2. Sincronizar com Capacitor (atualiza o projeto Android)
npx cap sync android
```

**⏱️ Tempo:** 2-5 minutos (pode demorar na primeira vez)

---

### 2️⃣ NO ANDROID STUDIO

#### Abrir o Projeto
1. Abre o **Android Studio**
2. **File** > **Open**
3. Navega até: `C:\Users\hugoe\Projeto_Pmeu\task-manager\android`
4. **IMPORTANTE**: Seleciona a pasta **`android`** (não a task-manager!)
5. Clica **OK**

#### Aguardar Sincronização
- Aparece uma barra em baixo: "Gradle Sync" ou "Indexing"
- **Aguarda terminar** (pode demorar 2-5 minutos)
- Quando aparecer "Gradle build finished" ou o botão verde ▶️, está pronto

---

### 3️⃣ LIGAR O TELEMÓVEL

1. **Liga o cabo USB** ao PC
2. **Liga o cabo USB** ao Samsung
3. No telemóvel: **Ativa "Depuração USB"** (se ainda não tiver)
   - Definições > Opções do programador > Depuração USB ✅

---

### 4️⃣ INSTALAR NO TELEMÓVEL

#### No Android Studio:
1. No topo, à direita, deve aparecer um **dropdown** com o nome do telemóvel
2. Clica no **botão verde ▶️ "Run"** (ou pressiona Shift+F10)
3. Seleciona o telemóvel na lista (se aparecer)
4. Clica **OK**

#### No Telemóvel:
- Se aparecer popup de permissão: **"Permitir"** e marca **"Sempre permitir"**
- A aplicação instala e abre sozinha! ✅

---

## ⚠️ Problemas Comuns

### ❌ "Gradle Sync Failed"
**Solução:**
```bash
# No terminal, na pasta do projeto:
cd android
./gradlew clean
cd ..
npx cap sync android
```

### ❌ "Device not found" ou telemóvel não aparece
**Solução:**
1. Desliga e liga o cabo USB
2. No telemóvel: Desativa e reativa "Depuração USB"
3. No Android Studio: **Run** > **Invalidate Caches / Restart**

### ❌ "App not installed" ou erro de instalação
**Solução:**
1. No telemóvel: Desinstala a versão antiga da app
2. Tenta instalar novamente

### ❌ Botão verde não aparece
**Solução:**
- Certifica-te que abriste a pasta **`android`** e não a `task-manager`
- Aguarda o Gradle terminar de sincronizar

---

## ✅ Verificação

Depois de instalar:
1. A app abre automaticamente
2. Os dados antigos devem estar lá (se não desinstalaste)
3. As novas funcionalidades devem estar disponíveis

---

## 🚀 Comandos Rápidos (Copiar e Colar)

```bash
# Sequência completa:
npm run build
npx cap sync android
```

Depois abre o Android Studio e clica no botão verde ▶️!

---

**Dica:** Se fizeres alterações no código, repete os passos 1 e 2 (build + sync) antes de instalar novamente.
