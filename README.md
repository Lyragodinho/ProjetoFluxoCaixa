# Feedis - Gerenciador de Fluxo de Caixa

Um sistema avançado de gerenciamento de fluxo de caixa para empresas. Permite que os usuários gerenciem saldos bancários iniciais, entradas operacionais e saídas categorizadas (operacionais, de investimento, de financiamento) para projetar os saldos de caixa finais.

## ✨ Funcionalidades

- **Assistente Passo a Passo**: Uma interface guiada para inserir todos os dados necessários para o fluxo de caixa, desde saldos iniciais até a geração do relatório final.
- **Saldos Iniciais**: Cadastre o saldo inicial para múltiplos bancos.
- **Gestão de Entradas**: Adicione receitas operacionais, especificando cliente, tipo de documento, datas e valores.
- **Gestão de Saídas**: Cadastre fornecedores e contas, classifique-os por tipo de fluxo de caixa (Operacional, Investimento, Financiamento) e lance as saídas correspondentes.
- **Importação e Exportação**: Importe dados em massa de bancos, saldos, receitas e fornecedores usando arquivos CSV. Baixe templates para facilitar o preenchimento.
- **Entrada Manual em Lote**: Interface para adicionar múltiplos registros de uma só vez sem a necessidade de um arquivo CSV.
- **Relatório Dinâmico**: Gere um relatório de fluxo de caixa direto detalhado, com projeção diária e a possibilidade de ajustar o período de visualização.
- **Persistência por URL**: Todo o seu trabalho é salvo automaticamente na URL do navegador. Basta copiar o endereço para criar um backup, compartilhar ou continuar trabalhando em outro dispositivo.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS
- **Persistência de Dados**: O estado da aplicação é comprimido e codificado diretamente na URL, eliminando a necessidade de um banco de dados externo.
- **Execução**: Módulos ES6 nativos no navegador, sem a necessidade de um passo de *build*.

## 📂 Como Executar Localmente

Como este projeto utiliza módulos ES modernos diretamente no navegador, não há um processo de compilação (*build*) complexo. Você só precisa de um servidor web local para servir os arquivos estáticos.

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd <NOME_DO_DIRETORIO>
    ```

2.  **Inicie um servidor local:**
    A maneira mais fácil é usar o `serve`, que pode ser executado com o `npx` (incluído no Node.js).
    ```bash
    npx serve
    ```
    Ou, se você tiver o Python instalado:
    ```bash
    # Python 3.x
    python -m http.server
    ```

3.  **Abra no navegador:**
    Abra seu navegador e acesse o endereço fornecido pelo servidor (geralmente `http://localhost:3000` ou `http://localhost:8000`).

**Nota:** Nenhuma configuração adicional é necessária para executar localmente. Todas as funcionalidades, incluindo a persistência de dados, funcionam diretamente no navegador.
