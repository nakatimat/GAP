# 🏢 GAP - Gestão de Ativos e Patrimônio

O **GAP** é um software monolítico e local-first desenvolvido para centralizar o controle de equipamentos e o vínculo com colaboradores. Ele substitui planilhas estáticas por um sistema interativo, seguro e totalmente offline.

---

## ✨ Funcionalidades Principais

* **📦 Gestão de Ativos:** Cadastro detalhado de itens (Código, Configuração, Data de Aquisição).
* **👥 Vínculo de Colaboradores:** Controle de quem detém a posse de cada equipamento e localização (mesas/salas).
* **🔄 Edição em Tempo Real:** Tabelas interativas que permitem alterar dados com um clique.
* **📂 Exportação Inteligente:** Gere relatórios em Excel (.xlsx) instantaneamente para auditorias.
* **🔒 Local-First:** Seus dados permanecem na sua máquina em um banco SQLite. Zero latência, zero custo de nuvem.

---

## 🛠️ Tecnologias

* **Python 3.10+**
* **Streamlit** (Interface Web Local)
* **SQLite** (Banco de dados relacional leve)
* **Pandas** (Tratamento de dados e exportação)

---

## 🚀 Como Rodar o Projeto

### Método 1: Execução Automática (Um Clique - Windows) 💻
Se você estiver no Windows, basta dar um **duplo clique** no arquivo executável:
*   **`Iniciar_GAP.bat`**

Isso abrirá o terminal, iniciará o servidor local do Streamlit e abrirá o sistema no seu navegador automaticamente!

### Método 2: Execução Manual (Terminal) 🛠️
1.  **Instale as dependências (apenas na primeira vez):**
    ```bash
    pip install streamlit pandas openpyxl
    ```
2.  **Execute o sistema:**
    ```bash
    streamlit run app.py
    ```

---

## 📋 Estrutura do Banco de Dados
O sistema utiliza duas tabelas principais baseadas no inventário atual:
1.  **Patrimônio:** Referência única por código e descrição técnica.
2.  **Funcionários:** Nome, número da mesa e itens vinculados.

---

## 💾 Backup e Segurança
Como o sistema é local, o banco de dados é o arquivo `gap_inventory.db`. Para fazer backup, basta copiar este arquivo para um local seguro, nuvem ou pendrive.