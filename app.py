import streamlit as st
import datetime
import os
import pandas as pd
import database as db
import excel_exporter as exp
import styles as sty

# Initialize DB structure on startup
db.init_db()
db.seed_db()

# Theme Choice selection in Sidebar
st.sidebar.markdown(
    "<div class='sidebar-brand-card'>"
    "🏢 <span class='sidebar-brand-title'>GAP - Gestão de Ativos</span><br>"
    "</div>", 
    unsafe_allow_html=True
)

st.sidebar.markdown("### 🎨 Configurações")
theme_choice = st.sidebar.selectbox(
    "Tema do Painel:", 
    ["Escuro 🌙", "Claro ☀️"],
    key="app_theme_mode"
)

# Apply dynamic custom CSS styling based on theme
st.markdown(sty.get_custom_css(theme_choice), unsafe_allow_html=True)

# Navigation Menu
st.sidebar.markdown("### 🗺️ Navegação")
menu = st.sidebar.radio(
    "Ir para o painel:",
    ["📊 Dashboard Geral", "📦 Gestor de Ativos (Lote)", "👥 Colaboradores", "🔍 Busca & Filtros"],
    label_visibility="collapsed",
    key="navigation_menu"
)

# Sidebar Quick Excel Exporter Card (Fulfills: "ele precisa ter um botão para extrair tudo para excel!")
st.sidebar.markdown("---")
st.sidebar.markdown("### 📥 Relatórios Rápidos")
try:
    excel_data = exp.generate_excel_report()
    st.sidebar.download_button(
        label="📊 Exportar Tudo para Excel",
        data=excel_data,
        file_name=f"GAP_Ativos_Consolidado_{datetime.date.today().strftime('%d_%m_%Y')}.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        use_container_width=True
    )
except Exception as e:
    st.sidebar.error(f"Erro ao preparar relatório: {e}")

# Sidebar Seeding Reset Tool
st.sidebar.markdown("---")
st.sidebar.markdown("### 🛠️ Depuração & Teste")
if st.sidebar.button("Redefinir com Dados de Teste", use_container_width=True):
    db.seed_db(force=True)
    st.sidebar.success("Banco de dados restaurado!")
    st.rerun()

# ---------------------------------------------------------
# View 1: Dashboard Geral
# ---------------------------------------------------------
if menu == "📊 Dashboard Geral":
    st.markdown("<div class='section-header'>📊 Dashboard Geral de Ativos</div>", unsafe_allow_html=True)
    
    # Load Real-time metrics
    stats = db.get_dashboard_stats()
    
    # 4 Glassmorphic Metrics Columns
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(
            f"<div class='metric-card'>"
            f"<div class='metric-label'>Total de Ativos</div>"
            f"<div class='metric-value'>{stats['total_assets']}</div>"
            f"<div class='metric-subtext'>Cadastrados</div>"
            f"</div>", 
            unsafe_allow_html=True
        )
    with col2:
        st.markdown(
            f"<div class='metric-card'>"
            f"<div class='metric-label'>Em Uso</div>"
            f"<div class='metric-value'>{stats['assigned_assets']}</div>"
            f"<div class='metric-subtext'>Com Colaboradores</div>"
            f"</div>", 
            unsafe_allow_html=True
        )
    with col3:
        st.markdown(
            f"<div class='metric-card'>"
            f"<div class='metric-label'>Disponíveis</div>"
            f"<div class='metric-value'>{stats['available_assets']}</div>"
            f"<div class='metric-subtext'>No Almoxarifado</div>"
            f"</div>", 
            unsafe_allow_html=True
        )
    with col4:
        st.markdown(
            f"<div class='metric-card'>"
            f"<div class='metric-label'>Taxa de Ocupação</div>"
            f"<div class='metric-value'>{stats['utilization_rate']:.1f}%</div>"
            f"<div class='metric-subtext'>Utilização Geral</div>"
            f"</div>", 
            unsafe_allow_html=True
        )

# ---------------------------------------------------------
# View 2: Gestor de Ativos (Lote e Novo Equipamento)
# ---------------------------------------------------------
elif menu == "📦 Gestor de Ativos (Lote)":
    st.markdown("<div class='section-header'>📦 Editor de Ativos & Equipamentos</div>", unsafe_allow_html=True)
    
    # Fulfills: "como faço para cadastrar um novo equipamento?"
    with st.expander("🆕 Cadastrar Novo Ativo / Equipamento", expanded=False):
        st.markdown("Preencha as informações do novo equipamento a ser adicionado ao estoque geral:")
        with st.form("new_asset_form", clear_on_submit=True):
            f_code = st.text_input("Código do Ativo (Até 4 dígitos, ex: 122 ou 0122)", placeholder="Ex: 0122")
            f_type = st.selectbox(
                "Tipo de Equipamento:",
                ["Monitor", "CPU", "Desk", "Chair", "Keyboard", "Mouse", "Headset", "Nobreak", "Acessório"]
            )
            f_desc = st.text_area("Descrição Técnica/Configuração:", placeholder="Ex: Dell Optiplex Core i5, 8GB RAM, SSD 256GB")
            f_date = st.date_input("Data de Aquisição:", datetime.date.today())
            
            submit_asset = st.form_submit_button("➕ Salvar e Registrar Equipamento")
            if submit_asset:
                if not f_code or not f_code.strip():
                    st.error("O código exclusivo do ativo é obrigatório.")
                else:
                    success, msg = db.create_asset(f_code.strip(), f_type, f_desc, f_date)
                    if success:
                        st.success(f"🎉 {msg}")
                        st.rerun()
                    else:
                        st.error(f"❌ {msg}")
                        
    st.markdown("### Planilha Integrada (Edição em Lote)")
    st.markdown("""
    Gerencie seus ativos de forma rápida. Você pode **editar** descrições, tipos e datas diretamente nas células, 
    **adicionar novos itens** (no botão '+' abaixo da tabela) ou **remover itens** selecionando as linhas e pressionando Delete.
    """)
    
    # Load assets
    df_assets = db.get_all_assets_df()
    # Convert acquisition_date strings to datetime.date objects for st.data_editor compatibility
    df_assets["acquisition_date"] = pd.to_datetime(df_assets["acquisition_date"], errors="coerce").dt.date
    
    # Interactive data editor
    edited_df = st.data_editor(
        df_assets,
        column_config={
            "id": st.column_config.NumberColumn("ID Interno", disabled=True),
            "code": st.column_config.TextColumn("Código Único", max_chars=4, required=True),
            "item_type": st.column_config.SelectboxColumn(
                "Tipo de Ativo",
                options=["Monitor", "CPU", "Desk", "Chair", "Keyboard", "Mouse", "Headset", "Nobreak", "Acessório"],
                required=True
            ),
            "description": st.column_config.TextColumn("Descrição Técnica/Configuração", width="large"),
            "acquisition_date": st.column_config.DateColumn("Data de Aquisição"),
            "status": st.column_config.SelectboxColumn("Status", options=["Available", "Assigned"])
        },
        num_rows="dynamic",
        key="bulk_asset_editor",
        use_container_width=True
    )
    
    # Save button
    st.markdown("<div class='secondary-btn'>", unsafe_allow_html=True)
    if st.button("💾 Salvar Alterações em Lote"):
        editor_state = st.session_state.get("bulk_asset_editor")
        if editor_state:
            success, msg = db.save_bulk_assets(df_assets, editor_state)
            if success:
                st.success(f"🎉 {msg}")
                st.balloons()
                st.rerun()
            else:
                st.error(msg)
        else:
            st.info("Altere alguma célula acima para habilitar o salvamento.")
    st.markdown("</div>", unsafe_allow_html=True)

# ---------------------------------------------------------
# View 3: Colaboradores
# ---------------------------------------------------------
elif menu == "👥 Colaboradores":
    st.markdown("<div class='section-header'>👥 Vínculo de Posse e Colaboradores</div>", unsafe_allow_html=True)
    
    # Load list of employees
    employees = db.get_all_employees()
    
    col_left, col_right = st.columns([1, 2])
    
    with col_left:
        st.markdown("### Selecionar Colaborador")
        if employees:
            emp_options = {emp["id"]: f"{emp['name']} (Mesa {emp['desk_number'] or '-'})" for emp in employees}
            selected_emp_id = st.selectbox(
                "Selecione o funcionário:",
                options=list(emp_options.keys()),
                format_func=lambda x: emp_options[x]
            )
            
            # Fetch active details
            selected_emp = next(emp for emp in employees if emp["id"] == selected_emp_id)
            
            st.markdown(
                f"<div class='info-card'>"
                f"<h4>📁 Informações Básicas</h4>"
                f"<strong>Nome:</strong> {selected_emp['name']}<br>"
                f"<strong>Mesa:</strong> {selected_emp['desk_number'] or '-'}<br>"
                f"<strong>Localização:</strong> {selected_emp['location'] or '-'}<br>"
                f"<strong>Data de Onboarding:</strong> {selected_emp['possession_date'] or '-'}"
                f"</div>",
                unsafe_allow_html=True
            )
            
            # Delete employee button
            st.markdown("<div class='secondary-btn'>", unsafe_allow_html=True)
            if st.button("🗑️ Remover Cadastro de Colaborador", use_container_width=True):
                success, msg = db.delete_employee(selected_emp_id)
                if success:
                    st.success(msg)
                    st.rerun()
                else:
                    st.error(f"Erro: {msg}")
            st.markdown("</div>", unsafe_allow_html=True)
        else:
            st.info("Nenhum colaborador cadastrado.")
            selected_emp_id = None
            
        # Add new Employee block (Fulfills: "Caso eu crie um colaborador novo ele vai salvar?")
        with st.expander("🆕 Cadastrar Novo Colaborador", expanded=(len(employees) == 0)):
            st.markdown("Insira os dados cadastrais do novo funcionário:")
            with st.form("new_employee_form", clear_on_submit=True):
                f_name = st.text_input("Nome do Colaborador:", placeholder="Ex: Mariana Costa")
                f_desk = st.text_input("Mesa / Posição:", placeholder="Ex: 05A")
                f_loc = st.selectbox(
                    "Localização / Regional:",
                    ["São Paulo - Sede Paulista", "Rio Hub - Espaço Aberto", "Belo Horizonte - Filial", "Home Office"]
                )
                f_date = st.date_input("Data de Início (Posse):", datetime.date.today())
                
                submit_emp = st.form_submit_button("➕ Salvar e Criar Colaborador")
                if submit_emp:
                    if not f_name or not f_name.strip():
                        st.error("O nome do colaborador é obrigatório.")
                    else:
                        success, msg = db.create_employee(f_name.strip(), f_desk.strip(), f_loc, f_date)
                        if success:
                            st.success(f"🎉 {msg}")
                            st.rerun()
                        else:
                            st.error(f"❌ {msg}")

    with col_right:
        if selected_emp_id:
            emp_name = selected_emp["name"]
            st.markdown(f"### Ativos sob posse de {emp_name}")
            
            # Fetch assigned items
            assigned_assets = db.get_employee_assets(selected_emp_id)
            
            if assigned_assets:
                for asset in assigned_assets:
                    with st.container():
                        st.markdown(
                            f"<div class='info-card' style='padding: 0.9rem; margin-bottom: 0.6rem;'>"
                            f"<strong>{asset['item_type']} (Cód. {asset['code']})</strong> - {asset['description'] or 'Sem descrição'}"
                            f"</div>", 
                            unsafe_allow_html=True
                        )
                        col_rel1, col_rel2 = st.columns([5, 1.5])
                        with col_rel2:
                            if st.button("🔗 Liberar", key=f"rel_{asset['id']}", use_container_width=True):
                                success, msg = db.release_asset(asset["id"])
                                if success:
                                    st.success(msg)
                                    st.rerun()
                                else:
                                    st.error(msg)
            else:
                st.info("Este colaborador não possui nenhum equipamento vinculado no momento.")
                
            # Quick Link forms
            st.markdown("---")
            tab_quick, tab_legacy = st.tabs(["⚡ Vínculo Rápido (Disponíveis)", "🧠 Importação Inteligente (Texto Legado)"])
            
            with tab_quick:
                st.markdown("Selecione um ativo atualmente disponível no inventário para atribuir a este colaborador:")
                available_assets = db.get_available_assets()
                if available_assets:
                    asset_options = {asset["id"]: f"{asset['item_type']} ({asset['code']}) - {asset['description'][:40] if asset['description'] else ''}" for asset in available_assets}
                    selected_avail_id = st.selectbox(
                        "Selecione o equipamento:",
                        options=list(asset_options.keys()),
                        format_func=lambda x: asset_options[x],
                        key="avail_sel"
                    )
                    
                    if st.button("🔗 Atribuir Equipamento", use_container_width=True):
                        success, msg = db.assign_asset(selected_avail_id, selected_emp_id)
                        if success:
                            st.success(msg)
                            st.rerun()
                        else:
                            st.error(msg)
                else:
                    st.warning("Não há equipamentos livres/disponíveis no inventário no momento.")
                    
            with tab_legacy:
                st.markdown("""
                Insira strings copiadas da planilha Excel de migração. O sistema irá decodificar os códigos, 
                padronizar para 4 dígitos, auto-criar equipamentos inexistentes e reatribuir proprietários se necessário.
                """)
                legacy_str = st.text_area(
                    "Cole a String de Itens Vinculados:", 
                    placeholder="Ex: Monitor(104), CPU(103), Desk(122)",
                    help="Formato esperado: Tipo(Código), Tipo(Código)"
                )
                
                if st.button("🚀 Processar e Importar", use_container_width=True):
                    success, logs = db.parse_and_assign_assets(selected_emp_id, legacy_str)
                    
                    # Display transaction logs nicely
                    st.markdown("#### 📓 Registro da Transação:")
                    for log in logs:
                        st.markdown(log)
                    
                    if success:
                        st.toast("Importação concluída!", icon="🎉")
                        st.rerun()
        else:
            st.info("Cadastre ou selecione um colaborador para gerenciar seus ativos.")

# ---------------------------------------------------------
# View 4: Busca & Filtros
# ---------------------------------------------------------
elif menu == "🔍 Busca & Filtros":
    st.markdown("<div class='section-header'>🔍 Central de Busca Avançada</div>", unsafe_allow_html=True)
    st.markdown("Pesquise dados consolidados em tempo real no inventário do GAP:")
    
    search_query = st.text_input(
        "🔍 Buscar por Código, Tipo de Ativo, Descrição Técnica ou Nome do Colaborador:", 
        placeholder="Digite o termo de pesquisa..."
    )
    
    df_search = db.get_unified_search_df(search_query)
    
    if not df_search.empty:
        # Style Status column with colored labels
        def format_status(val):
            if val == "Available":
                return "🟢 Disponível"
            elif val == "Assigned":
                return "🔵 Vinculado"
            return val
            
        df_search["Status"] = df_search["Status"].map(format_status)
        
        # Fill empty values nicely for display
        df_search["Responsável"] = df_search["Responsável"].fillna("Almoxarifado (Livre)")
        df_search["Localização"] = df_search["Localização"].fillna("Sede Central")
        df_search["Mesa"] = df_search["Mesa"].fillna("-")
        
        st.dataframe(df_search, use_container_width=True, hide_index=True)
    else:
        st.warning("Nenhum registro encontrado para o termo de pesquisa.")
