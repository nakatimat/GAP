import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  // This expects gap_inventory.db to exist or be created by tauri
  db = await Database.load('sqlite:gap_inventory.db');
  return db;
}

export async function initDb() {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        item_type TEXT NOT NULL,
        description TEXT,
        acquisition_date TEXT NOT NULL,
        status TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        desk_number TEXT,
        location TEXT,
        possession_date TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        assignment_date TEXT NOT NULL,
        FOREIGN KEY(asset_id) REFERENCES assets(id),
        FOREIGN KEY(employee_id) REFERENCES employees(id)
    )
  `);
}

export async function getAssets(): Promise<any[]> {
  const db = await getDb();
  return await db.select('SELECT * FROM assets ORDER BY id DESC');
}

export async function getEmployees(): Promise<any[]> {
  const db = await getDb();
  return await db.select('SELECT * FROM employees ORDER BY id DESC');
}

export async function getUnifiedSearch(query: string = ""): Promise<any[]> {
  const db = await getDb();
  let sql = `
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
  `;
  if (query) {
    const q = `%${query}%`;
    sql += ` AND (a.code LIKE $1 OR a.item_type LIKE $1 OR a.description LIKE $1 OR e.name LIKE $1)`;
    return await db.select(sql, [q]);
  }
  return await db.select(sql);
}

export async function getStats(): Promise<any> {
    const db = await getDb();
    const totalResult: any[] = await db.select('SELECT COUNT(*) as count FROM assets');
    const assignedResult: any[] = await db.select('SELECT COUNT(*) as count FROM assets WHERE status = "Em Uso"');
    const availableResult: any[] = await db.select('SELECT COUNT(*) as count FROM assets WHERE status = "Disponível"');
    const defectiveResult: any[] = await db.select('SELECT COUNT(*) as count FROM assets WHERE status = "Com Defeito"');
    
    const total = totalResult[0].count;
    const assigned = assignedResult[0].count;
    const available = availableResult[0].count;
    const defective = defectiveResult[0].count;
    const rateNum = total > 0 ? ((assigned / total) * 100) : 0;
    const rate = rateNum.toFixed(1);
    
    return {
        total,
        assigned,
        available,
        defective,
        usage_rate: `${rate}%`,
        usage_rate_num: rateNum
    };
}

export async function addAsset(asset: { code: string, item_type: string, description: string, acquisition_date: string }) {
    const db = await getDb();
    await db.execute(
        'INSERT INTO assets (code, item_type, description, acquisition_date, status) VALUES ($1, $2, $3, $4, $5)',
        [asset.code, asset.item_type, asset.description, asset.acquisition_date, 'Disponível']
    );
}

export async function addEmployee(emp: { name: string, desk_number: string, location: string, possession_date: string }) {
    const db = await getDb();
    await db.execute(
        'INSERT INTO employees (name, desk_number, location, possession_date) VALUES ($1, $2, $3, $4)',
        [emp.name, emp.desk_number, emp.location, emp.possession_date]
    );
}

export async function deleteEmployee(id: number) {
    const db = await getDb();
    // Libera ativos antes de deletar
    await db.execute('UPDATE assets SET status = "Disponível" WHERE id IN (SELECT asset_id FROM assignments WHERE employee_id = $1)', [id]);
    await db.execute('DELETE FROM assignments WHERE employee_id = $1', [id]);
    await db.execute('DELETE FROM employees WHERE id = $1', [id]);
}

export async function getAvailableAssets(): Promise<any[]> {
    const db = await getDb();
    return await db.select('SELECT * FROM assets WHERE status = "Disponível" ORDER BY id DESC');
}

export async function getEmployeeAssets(employeeId: number): Promise<any[]> {
    const db = await getDb();
    return await db.select(`
        SELECT a.id, a.code, a.item_type, a.description 
        FROM assets a
        JOIN assignments ass ON a.id = ass.asset_id
        WHERE ass.employee_id = $1
    `, [employeeId]);
}

export async function assignAsset(assetId: number, employeeId: number) {
    const db = await getDb();
    const date = new Date().toISOString().split('T')[0];
    await db.execute('INSERT INTO assignments (asset_id, employee_id, assignment_date) VALUES ($1, $2, $3)', [assetId, employeeId, date]);
    await db.execute('UPDATE assets SET status = "Em Uso" WHERE id = $1', [assetId]);
}

export async function releaseAsset(assetId: number) {
    const db = await getDb();
    await db.execute('DELETE FROM assignments WHERE asset_id = $1', [assetId]);
    await db.execute('UPDATE assets SET status = "Disponível" WHERE id = $1', [assetId]);
}

export async function markAsDefective(assetId: number) {
    const db = await getDb();
    await db.execute('DELETE FROM assignments WHERE asset_id = $1', [assetId]);
    await db.execute('UPDATE assets SET status = "Com Defeito" WHERE id = $1', [assetId]);
}

export async function restoreAsset(assetId: number) {
    const db = await getDb();
    await db.execute('UPDATE assets SET status = "Disponível" WHERE id = $1', [assetId]);
}

export async function getDefectiveAssets(): Promise<any[]> {
    const db = await getDb();
    return await db.select('SELECT * FROM assets WHERE status = "Com Defeito" ORDER BY id DESC');
}

export async function deleteAsset(assetId: number) {
    const db = await getDb();
    // Verify if it is in use
    const result: any[] = await db.select('SELECT status FROM assets WHERE id = $1', [assetId]);
    if (result.length > 0 && result[0].status === 'Em Uso') {
        throw new Error('Não é possível excluir um ativo que está em uso.');
    }
    // Delete assignment if exists (just in case, though it shouldn't if it's not in use)
    await db.execute('DELETE FROM assignments WHERE asset_id = $1', [assetId]);
    await db.execute('DELETE FROM assets WHERE id = $1', [assetId]);
}

export async function deleteMultipleAssets(assetIds: number[]) {
    if (assetIds.length === 0) return;
    const db = await getDb();
    const placeholders = assetIds.map((_, i) => `$${i + 1}`).join(',');
    
    // Verify if any is in use
    const result: any[] = await db.select(`SELECT status FROM assets WHERE id IN (${placeholders}) AND status = 'Em Uso'`, assetIds);
    if (result.length > 0) {
        throw new Error('Um ou mais ativos selecionados estão em uso e não podem ser excluídos.');
    }

    await db.execute(`DELETE FROM assignments WHERE asset_id IN (${placeholders})`, assetIds);
    await db.execute(`DELETE FROM assets WHERE id IN (${placeholders})`, assetIds);
}

