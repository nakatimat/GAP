const API_URL = 'http://127.0.0.1:5000/api';
let employees = [];
let assets = [];
let selectedEmployee = null;

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
        
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');

        if (targetId === 'dashboard') loadDashboard();
        if (targetId === 'assets') loadAssets();
        if (targetId === 'employees') loadEmployees();
        if (targetId === 'search') document.getElementById('search-input').value = '';
    });
});

function openModal(id) {
    document.getElementById(id).classList.add('show');
    if (id === 'assign-modal') loadAvailableAssets();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.borderLeft = `4px solid ${type === 'success' ? 'var(--success)' : 'var(--danger)'}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

async function apiFetch(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (error) {
        showToast('Erro de conexão com o servidor', 'error');
        return null;
    }
}

async function loadDashboard() {
    const data = await apiFetch('/stats');
    if (!data) return;
    document.getElementById('stat-total').innerText = data.total_assets;
    document.getElementById('stat-assigned').innerText = data.assigned_assets;
    document.getElementById('stat-available').innerText = data.available_assets;
    document.getElementById('stat-rate').innerText = data.utilization_rate.toFixed(1) + '%';
}

async function loadAssets() {
    assets = await apiFetch('/assets') || [];
    const tbody = document.getElementById('assets-table-body');
    tbody.innerHTML = assets.map(asset => `
        <tr>
            <td><strong>${asset.code}</strong></td>
            <td>${asset.item_type}</td>
            <td><span style="color: var(--text-secondary)">${asset.description || '-'}</span></td>
            <td>${asset.acquisition_date}</td>
            <td><span class="status-badge ${asset.status === 'Available' ? 'status-available' : 'status-assigned'}">${asset.status}</span></td>
        </tr>
    `).join('');
}

async function saveAsset(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const result = await apiFetch('/assets', { method: 'POST', body: JSON.stringify(data) });
    if (result && result.success) {
        showToast(result.message); closeModal('asset-modal'); loadAssets(); loadDashboard(); e.target.reset();
    }
}

async function loadEmployees() {
    employees = await apiFetch('/employees') || [];
    const list = document.getElementById('employee-list');
    list.innerHTML = employees.map(emp => `
        <div class="employee-card ${selectedEmployee?.id === emp.id ? 'active' : ''}" onclick="selectEmployee(${emp.id})">
            <div class="employee-name">${emp.name}</div>
            <div class="employee-meta">📍 ${emp.location} | 🪑 ${emp.desk_number || '-'}</div>
        </div>
    `).join('');
}

async function selectEmployee(id) {
    selectedEmployee = employees.find(e => e.id === id);
    loadEmployees(); 
    const empAssets = await apiFetch(`/employees/${id}/assets`) || [];
    const details = document.getElementById('employee-details');
    details.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
            <div>
                <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem">${selectedEmployee.name}</h2>
                <span class="status-badge status-assigned">Desde ${selectedEmployee.possession_date}</span>
            </div>
            <button class="btn btn-danger btn-sm glass-button" onclick="deleteEmployee(${id})">Excluir</button>
        </div>
        <div style="margin-top: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="font-size: 1.2rem; color: var(--text-secondary)">Equipamentos Vinculados</h3>
                <button class="btn btn-primary btn-sm glass-button" onclick="openAssignModal(${id})">➕ Vincular Novo</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${empAssets.length ? empAssets.map(asset => `
                    <div class="glass-panel" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                        <div>
                            <strong style="color: #60a5fa">${asset.item_type} (${asset.code})</strong>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">${asset.description || 'Sem descrição'}</div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="releaseAsset(${asset.id})">Devolver</button>
                    </div>
                `).join('') : '<div class="empty-state" style="padding: 3rem 0; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed var(--border-color);"><p>Nenhum equipamento vinculado a este colaborador.</p></div>'}
            </div>
        </div>
    `;
}

async function saveEmployee(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const result = await apiFetch('/employees', { method: 'POST', body: JSON.stringify(data) });
    if (result && result.success) {
        showToast(result.message); closeModal('employee-modal'); loadEmployees(); e.target.reset();
    }
}

async function deleteEmployee(id) {
    if (!confirm('Deseja excluir este colaborador? Os ativos voltarão para Disponível.')) return;
    const result = await apiFetch(`/employees/${id}`, { method: 'DELETE' });
    if (result && result.success) {
        showToast(result.message); selectedEmployee = null; loadEmployees(); loadDashboard();
        document.getElementById('employee-details').innerHTML = '<div class="empty-state"><span class="empty-icon">👥</span><p>Selecione um colaborador para gerenciar seus ativos.</p></div>';
    }
}

function openAssignModal(empId) { document.getElementById('assign-emp-id').value = empId; openModal('assign-modal'); }

async function loadAvailableAssets() {
    const available = await apiFetch('/assets/available') || [];
    const select = document.getElementById('available-assets-select');
    select.innerHTML = available.map(a => `<option value="${a.id}">${a.item_type} (Cód. ${a.code}) - ${a.description || 'S/ Desc'}</option>`).join('');
    if(available.length === 0) select.innerHTML = '<option disabled selected>Nenhum ativo disponível</option>';
}

async function submitAssignment(e) {
    e.preventDefault();
    const assetId = document.getElementById('available-assets-select').value;
    const empId = document.getElementById('assign-emp-id').value;
    if(!assetId) return showToast('Selecione um ativo', 'error');
    const result = await apiFetch('/assignments', { method: 'POST', body: JSON.stringify({ asset_id: assetId, employee_id: empId }) });
    if (result && result.success) { showToast(result.message); closeModal('assign-modal'); selectEmployee(parseInt(empId)); loadDashboard(); }
}

async function releaseAsset(assetId) {
    const result = await apiFetch('/assignments/release', { method: 'POST', body: JSON.stringify({ asset_id: assetId }) });
    if (result && result.success) { showToast(result.message); selectEmployee(selectedEmployee.id); loadDashboard(); }
}

document.getElementById('search-input').addEventListener('input', async (e) => {
    const q = e.target.value;
    if(q.length < 2 && q.length > 0) return;
    const results = await apiFetch(`/search?q=${encodeURIComponent(q)}`) || [];
    document.getElementById('search-table-body').innerHTML = results.map(row => `
        <tr>
            <td><strong>${row.Código}</strong></td>
            <td>${row.Tipo}</td>
            <td><span style="color: var(--text-secondary)">${row.Descrição || '-'}</span></td>
            <td><span class="status-badge ${row.Status === 'Available' ? 'status-available' : 'status-assigned'}">${row.Status}</span></td>
            <td>${row.Responsável ? `<span style="color: #a78bfa; font-weight: 500;">${row.Responsável}</span>` : '<span style="color: var(--text-secondary)">Livre no Estoque</span>'}</td>
            <td>${row.Localização || '-'}</td>
        </tr>
    `).join('');
});

window.onload = loadDashboard;
