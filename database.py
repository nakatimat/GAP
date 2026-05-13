import os
import sqlite3
import re
import datetime
import pandas as pd

# Global DB Path resolution relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "gap_inventory.db")

def get_db_connection():
    """Establishes connection to the SQLite database with Foreign Key support enabled."""
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Assets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        item_type TEXT NOT NULL,
        description TEXT,
        acquisition_date TEXT,
        status TEXT DEFAULT 'Available'
    );
    """)
    
    # Create Employees Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        desk_number TEXT,
        location TEXT,
        possession_date TEXT
    );
    """)
    
    # Create Assignments Table (Junction with Unique constraint on asset_id for single ownership)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assignments (
        asset_id INTEGER NOT NULL UNIQUE,
        employee_id INTEGER NOT NULL,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        PRIMARY KEY (asset_id, employee_id)
    );
    """)
    
    conn.commit()
    conn.close()

def seed_db(force=False):
    """
    Seeds the database with high-quality mockup data for demonstration.
    If force is True, tables are cleared and repopulated.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if database is already seeded
    cursor.execute("SELECT COUNT(*) FROM assets")
    asset_count = cursor.fetchone()[0]
    
    if asset_count > 0 and not force:
        conn.close()
        return False  # Already seeded
        
    # Clear tables for seeding
    cursor.execute("DELETE FROM assignments")
    cursor.execute("DELETE FROM employees")
    cursor.execute("DELETE FROM assets")
    
    # Mockup Assets
    mock_assets = [
        ("0101", "Monitor", "Dell 27' Professional P2722H IPS 1080p", "2024-01-15", "Assigned"),
        ("0102", "Monitor", "LG UltraWide 29' 29UM69G-B IPS 75Hz", "2024-02-10", "Available"),
        ("0103", "CPU", "Lenovo ThinkCentre M70q Intel i7, 16GB RAM, 512GB SSD", "2023-11-05", "Assigned"),
        ("0104", "CPU", "Lenovo ThinkCentre M70q Intel i7, 16GB RAM, 512GB SSD", "2023-11-05", "Available"),
        ("0105", "Desk", "Estação de Trabalho Ergonômica em L 140x140cm", "2022-05-18", "Assigned"),
        ("0106", "Chair", "Cadeira Ergonômica Flexform Uni Me Blue", "2022-05-18", "Assigned"),
        ("0107", "Keyboard", "Teclado Mecânico Sem Fio Keychron K2", "2024-03-01", "Assigned"),
        ("0108", "Mouse", "Mouse Sem Fio Ergonômico Logitech MX Master 3S", "2024-03-01", "Assigned"),
        ("0109", "Headset", "Headset Corporativo Jabra Evolve2 30 USB-A", "2024-01-10", "Available"),
        ("0110", "Nobreak", "Nobreak APC Easy UPS 1200VA 115V/220V", "2023-08-20", "Available"),
    ]
    cursor.executemany(
        "INSERT INTO assets (code, item_type, description, acquisition_date, status) VALUES (?, ?, ?, ?, ?)",
        mock_assets
    )
    
    # Mockup Employees
    mock_employees = [
        ("Ana Silva", "03A", "São Paulo - Sede Paulista", "2024-01-15"),
        ("Bruno Santos", "03B", "São Paulo - Sede Paulista", "2024-02-10"),
        ("Carla Dias", "08", "Rio Hub - Espaço Aberto", "2024-03-10"),
    ]
    cursor.executemany(
        "INSERT INTO employees (name, desk_number, location, possession_date) VALUES (?, ?, ?, ?)",
        mock_employees
    )
    
    # Relational Assignments (linking assets and employees)
    cursor.execute("SELECT id, code FROM assets")
    asset_map = {row["code"]: row["id"] for row in cursor.fetchall()}
    
    cursor.execute("SELECT id, name FROM employees")
    emp_map = {row["name"]: row["id"] for row in cursor.fetchall()}
    
    assignments = [
        (asset_map["0101"], emp_map["Ana Silva"]),     # Dell Monitor
        (asset_map["0103"], emp_map["Ana Silva"]),     # Lenovo CPU 1
        (asset_map["0105"], emp_map["Bruno Santos"]),  # Desk
        (asset_map["0106"], emp_map["Bruno Santos"]),  # Chair
        (asset_map["0107"], emp_map["Ana Silva"]),     # Keyboard
        (asset_map["0108"], emp_map["Ana Silva"]),     # Mouse
    ]
    cursor.executemany(
        "INSERT INTO assignments (asset_id, employee_id) VALUES (?, ?)",
        assignments
    )
    
    conn.commit()
    conn.close()
    return True

def get_dashboard_stats():
    """Fetches high-level metrics for dashboard cards."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM assets")
    total_assets = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM assets WHERE status = 'Assigned'")
    assigned_assets = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM assets WHERE status = 'Available'")
    available_assets = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM employees")
    total_employees = cursor.fetchone()[0]
    
    conn.close()
    
    utilization_rate = (assigned_assets / total_assets * 100) if total_assets > 0 else 0.0
    return {
        "total_assets": total_assets,
        "assigned_assets": assigned_assets,
        "available_assets": available_assets,
        "total_employees": total_employees,
        "utilization_rate": utilization_rate
    }

def get_assets_by_type():
    """Fetches group statistics by asset type for charts."""
    conn = get_db_connection()
    df = pd.read_sql_query(
        "SELECT item_type as 'Tipo', COUNT(*) as 'Quantidade' FROM assets GROUP BY item_type ORDER BY Quantidade DESC", 
        conn
    )
    conn.close()
    return df

def get_assets_by_location():
    """Fetches assignments grouped by geography for charts."""
    conn = get_db_connection()
    df = pd.read_sql_query("""
        SELECT e.location as 'Localização', COUNT(a.asset_id) as 'Ativos Alocados' 
        FROM assignments a
        JOIN employees e ON a.employee_id = e.id
        GROUP BY e.location
        ORDER BY [Ativos Alocados] DESC
    """, conn)
    conn.close()
    return df

def get_all_assets_df():
    """Returns a full DataFrame of assets for editor and search views."""
    conn = get_db_connection()
    df = pd.read_sql_query(
        "SELECT id, code, item_type, description, acquisition_date, status FROM assets ORDER BY code", 
        conn
    )
    conn.close()
    return df

def create_asset(code, item_type, description, acq_date, status="Available"):
    """Creates a single new asset in the inventory."""
    # Auto-pad numeric code to 4 digits
    if str(code).isdigit() and len(str(code)) < 4:
        code = str(code).zfill(4)
        
    if isinstance(acq_date, (datetime.date, datetime.datetime)):
        acq_date = acq_date.strftime("%Y-%m-%d")
    elif not acq_date:
        acq_date = datetime.date.today().strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO assets (code, item_type, description, acquisition_date, status) VALUES (?, ?, ?, ?, ?)",
            (code, item_type, description, acq_date, status)
        )
        conn.commit()
        return True, "Ativo cadastrado com sucesso!"
    except sqlite3.IntegrityError:
        return False, f"Código único '{code}' já existe no banco de dados."
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def save_bulk_assets(df_assets, editor_state):
    """
    Saves inline changes from Streamlit data_editor into the assets table transactionally.
    Handles deletions, cell edits, and insertions.
    """
    edited_rows = editor_state.get("edited_rows", {})
    added_rows = editor_state.get("added_rows", [])
    deleted_rows = editor_state.get("deleted_rows", [])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Handle Deletions
        for idx in deleted_rows:
            asset_id = int(df_assets.iloc[idx]["id"])
            cursor.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
            
        # 2. Handle Edits
        for idx_str, changes in edited_rows.items():
            idx = int(idx_str)
            asset_id = int(df_assets.iloc[idx]["id"])
            for col, val in changes.items():
                if col == "code":
                    if str(val).isdigit() and len(str(val)) < 4:
                        val = str(val).zfill(4)
                elif isinstance(val, (datetime.date, datetime.datetime)):
                    val = val.strftime("%Y-%m-%d")
                cursor.execute(f"UPDATE assets SET {col} = ? WHERE id = ?", (val, asset_id))
                
        # 3. Handle Additions
        for row in added_rows:
            code = row.get("code")
            item_type = row.get("item_type")
            description = row.get("description", "")
            acq_date = row.get("acquisition_date")
            status = row.get("status", "Available")
            
            if not code or not item_type:
                raise ValueError("Novos ativos devem possuir Código Único e Tipo de Ativo.")
                
            if str(code).isdigit() and len(str(code)) < 4:
                code = str(code).zfill(4)
                
            if isinstance(acq_date, (datetime.date, datetime.datetime)):
                acq_date = acq_date.strftime("%Y-%m-%d")
            elif not acq_date:
                acq_date = datetime.date.today().strftime("%Y-%m-%d")
                
            cursor.execute(
                "INSERT INTO assets (code, item_type, description, acquisition_date, status) VALUES (?, ?, ?, ?, ?)",
                (code, item_type, description, acq_date, status)
            )
            
        conn.commit()
        return True, "Todas as alterações foram gravadas com sucesso!"
    except sqlite3.IntegrityError as e:
        conn.rollback()
        return False, f"Erro de Integridade: Código Único duplicado. Detalhe: {e}"
    except Exception as e:
        conn.rollback()
        return False, f"Erro ao salvar alterações: {e}"
    finally:
        conn.close()

def get_all_employees():
    """Returns a list of all employees ordered by name."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, desk_number, location, possession_date FROM employees ORDER BY name")
    employees = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return employees

def create_employee(name, desk_number, location, possession_date):
    """Inserts a new employee record into the database."""
    if not name:
        return False, "O nome do colaborador é obrigatório."
        
    if isinstance(possession_date, (datetime.date, datetime.datetime)):
        possession_date = possession_date.strftime("%Y-%m-%d")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO employees (name, desk_number, location, possession_date) VALUES (?, ?, ?, ?)",
            (name, desk_number, location, possession_date)
        )
        conn.commit()
        return True, "Colaborador cadastrado com sucesso!"
    except Exception as e:
        return False, str(e)
    finally:
        conn.close()

def delete_employee(employee_id):
    """Deletes an employee from the database. Releases their assets via cascading rules."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Fetch assets assigned to this employee first to mark them 'Available'
        cursor.execute("SELECT asset_id FROM assignments WHERE employee_id = ?", (employee_id,))
        assigned_asset_ids = [row[0] for row in cursor.fetchall()]
        
        # Delete employee (assignments table cascade deletes automatically via FOREIGN KEY cascade)
        cursor.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
        
        # Mark assets as Available
        for asset_id in assigned_asset_ids:
            cursor.execute("UPDATE assets SET status = 'Available' WHERE id = ?", (asset_id,))
            
        conn.commit()
        return True, "Colaborador removido e ativos retornados ao almoxarifado!"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def get_employee_assets(employee_id):
    """Fetches list of assets assigned to an employee."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.id, a.code, a.item_type, a.description, a.acquisition_date
        FROM assets a
        JOIN assignments ass ON a.id = ass.asset_id
        WHERE ass.employee_id = ?
        ORDER BY a.item_type, a.code
    """, (employee_id,))
    assets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return assets

def get_available_assets():
    """Returns a list of available assets for quick assignment dropdown."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, code, item_type, description FROM assets WHERE status = 'Available' ORDER BY item_type, code")
    assets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return assets

def release_asset(asset_id):
    """Removes an assignment and marks the asset as Available."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM assignments WHERE asset_id = ?", (asset_id,))
        cursor.execute("UPDATE assets SET status = 'Available' WHERE id = ?", (asset_id,))
        conn.commit()
        return True, "Ativo liberado com sucesso!"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def assign_asset(asset_id, employee_id):
    """Creates a link between an asset and an employee."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if asset is already assigned
        cursor.execute("SELECT employee_id FROM assignments WHERE asset_id = ?", (asset_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Reassign by deleting existing link first
            cursor.execute("DELETE FROM assignments WHERE asset_id = ?", (asset_id,))
            
        # Create new link
        cursor.execute("INSERT INTO assignments (asset_id, employee_id) VALUES (?, ?)", (asset_id, employee_id))
        cursor.execute("UPDATE assets SET status = 'Assigned' WHERE id = ?", (asset_id,))
        conn.commit()
        return True, "Ativo vinculado com sucesso!"
    except Exception as e:
        conn.rollback()
        return False, str(e)
    finally:
        conn.close()

def parse_and_assign_assets(employee_id, text_to_parse):
    """
    Parses strings in 'Item_Type(code), Item_Type(code)' legacy format,
    auto-registering missing assets, auto-releasing existing assignments,
    and binding them transactionally to the target employee_id.
    """
    if not text_to_parse or not text_to_parse.strip():
        return False, ["Nenhum texto informado para importação."]
        
    pattern = re.compile(r'([A-Za-zÀ-ÖØ-öø-ÿ\s_]+)\s*\(\s*(\d+)\s*\)')
    items = [item.strip() for item in text_to_parse.split(',') if item.strip()]
    
    logs = []
    success_count = 0
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for idx, raw_item in enumerate(items, 1):
            match = pattern.match(raw_item)
            if not match:
                logs.append(f"❌ Item #{idx} '{raw_item}': Formato inválido. Deve ser 'Tipo(Código)'.")
                continue
                
            item_type = match.group(1).strip()
            code_raw = match.group(2).strip()
            
            # Normalize to 4 digits
            code = code_raw.zfill(4)
            
            # 1. Check if asset exists
            cursor.execute("SELECT id, item_type, status FROM assets WHERE code = ?", (code,))
            asset = cursor.fetchone()
            
            if not asset:
                # Lazy register
                cursor.execute(
                    "INSERT INTO assets (code, item_type, description, acquisition_date, status) VALUES (?, ?, ?, ?, ?)",
                    (code, item_type, f"Auto-registrado via importador de string legada", datetime.date.today().strftime("%Y-%m-%d"), "Available")
                )
                asset_id = cursor.lastrowid
                logs.append(f"🆕 Código {code} não existia. Ativo '{item_type}' auto-cadastrado no inventário.")
            else:
                asset_id = asset["id"]
                
            # 2. Check if already assigned
            cursor.execute("SELECT employee_id, name FROM assignments JOIN employees ON employee_id = id WHERE asset_id = ?", (asset_id,))
            assignment = cursor.fetchone()
            
            if assignment:
                if assignment["employee_id"] == employee_id:
                    logs.append(f"ℹ️ Código {code} ({item_type}) já se encontra sob posse deste colaborador.")
                    success_count += 1
                    continue
                else:
                    # Relational Reassignment: Delete previous relation first
                    cursor.execute("DELETE FROM assignments WHERE asset_id = ?", (asset_id,))
                    logs.append(f"🔀 Código {code} ({item_type}) foi transferido de '{assignment['name']}' para o novo colaborador.")
                    
            # 3. Insert assignment link
            cursor.execute("INSERT INTO assignments (asset_id, employee_id) VALUES (?, ?)", (asset_id, employee_id))
            cursor.execute("UPDATE assets SET status = 'Assigned' WHERE id = ?", (asset_id,))
            logs.append(f"✅ Código {code} ({item_type}) vinculado com sucesso!")
            success_count += 1
            
        conn.commit()
        return success_count > 0, logs
    except Exception as e:
        conn.rollback()
        return False, [f"💥 Erro crítico de transação no banco de dados: {e}"]
    finally:
        conn.close()

def get_unified_search_df(query=""):
    """
    Returns a unified dataframe containing details of all assets joined with
    employees, locations, and desks, supporting filtering by code, type, description or holder name.
    """
    conn = get_db_connection()
    sql = """
        SELECT 
            a.code as 'Código', 
            a.item_type as 'Tipo', 
            a.description as 'Descrição', 
            a.status as 'Status',
            e.name as 'Responsável',
            e.location as 'Localização',
            e.desk_number as 'Mesa'
        FROM assets a
        LEFT JOIN assignments ass ON a.id = ass.asset_id
        LEFT JOIN employees e ON ass.employee_id = e.id
        WHERE 1=1
    """
    
    if query:
        query_str = f"%{query}%"
        sql += """
            AND (
                a.code LIKE ? 
                OR a.item_type LIKE ? 
                OR a.description LIKE ? 
                OR e.name LIKE ?
            )
        """
        df = pd.read_sql_query(sql, conn, params=(query_str, query_str, query_str, query_str))
    else:
        df = pd.read_sql_query(sql, conn)
        
    conn.close()
    return df
