# Feedis - Gerenciador de Fluxo de Caixa

## 🗄️ Integração com Supabase

O aplicativo agora está integrado com o Supabase para armazenamento de dados na nuvem, proporcionando maior segurança e acessibilidade.

### **📋 Estrutura do Banco de Dados**

#### **Tabelas Criadas:**

1. **`users`** - Informações dos usuários
   - `id` (UUID, Primary Key)
   - `email` (VARCHAR, Unique)
   - `name` (VARCHAR)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **`user_settings`** - Configurações do usuário
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key)
   - `start_date` (DATE)
   - `preferences` (JSONB)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

3. **`cash_flow_data`** - Dados do fluxo de caixa
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key)
   - `data_type` (VARCHAR) - 'balances', 'revenues', 'receipts', 'suppliers', 'outflows'
   - `item_id` (VARCHAR) - ID do item no frontend
   - `item_data` (JSONB) - Dados completos do item
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### **🔐 Segurança**

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** restritas por usuário
- **Autenticação** via email (demo version)
- **Isolamento de dados** entre usuários

### **💾 Como Funciona o Salvamento**

#### **1. Carregamento Automático**
```javascript
// Prioridade: Supabase → LocalStorage
await loadSavedData();
```

#### **2. Salvamento Manual**
```javascript
// Salva em ambos: Supabase + LocalStorage (backup)
await quickSave();
```

#### **3. Exportação de Dados**
```javascript
// Exporta do Supabase ou fallback local
await quickExport();
```

### **🔄 Fluxo de Dados**

```
Frontend (app.html)
    ↓
Supabase Client (supabase-client.js)
    ↓
Supabase REST API
    ↓
PostgreSQL Database
```

### **📊 Status da Conexão**

O aplicativo exibe o status da conexão em tempo real:

- 🟢 **Verde**: Conectado e funcionando
- 🟡 **Amarelo**: Carregando/processando
- 🔴 **Vermelho**: Erro de conexão
- ⚪ **Cinza**: Desconectado

### **🛡️ Backup e Recuperação**

#### **Backup Automático:**
- Dados são salvos automaticamente no localStorage
- Fallback caso Supabase esteja indisponível
- Recuperação automática ao abrir o aplicativo

#### **Exportação Manual:**
- Botão "📤 Exportar" na barra superior
- Formato JSON com data no nome
- Download direto para o dispositivo

### **🔧 Configuração**

#### **Variáveis de Ambiente:**
```javascript
const SUPABASE_URL = 'https://casaxluielarrbfwbdmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

#### **Arquivos:**
- `supabase-client.js` - Cliente de conexão
- `app.html` - Aplicativo principal
- Tabelas criadas via migrações SQL

### **📱 Uso do Aplicativo**

1. **Abrir**: `http://localhost:3001/app.html`
2. **Status**: Verificar indicador de conexão
3. **Salvar**: Clicar em "💾 Salvar" após alterações
4. **Exportar**: Clicar em "📤 Exportar" para backup

### **⚠️ Limitações Atuais**

- **Autenticação simplificada** (demo version)
- **Usuário único** (demo@feedis.com)
- **Sem sincronização multi-dispositivo**
- **Sem autenticação real** (em desenvolvimento)

### **🚀 Próximos Passos**

1. Implementar autenticação real com Supabase Auth
2. Adicionar suporte a múltiplos usuários
3. Implementar sincronização em tempo real
4. Adicionar histórico de alterações
5. Implementar backup automático agendado

### **🔍 Debug e Monitoramento**

- Console logs detalhados
- Status visual da conexão
- Fallback automático para localStorage
- Tratamento de erros robusto

---

**Desenvolvido com ❤️ usando Supabase + Tailwind CSS + Vanilla JavaScript**
