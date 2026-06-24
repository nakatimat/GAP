import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Search, Download, Save, Upload, Plus, Menu, Users, AlertTriangle, Trash2 } from 'lucide-react';
import { 
  initDb, getStats, getAssets, getUnifiedSearch, addAsset,
  getEmployees, getAvailableAssets, getEmployeeAssets, addEmployee, deleteEmployee, assignAsset, releaseAsset, getDb,
  markAsDefective, restoreAsset, getDefectiveAssets, deleteAsset, deleteMultipleAssets
} from './lib/db';
import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import * as ExcelJS from 'exceljs';

import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Paper,
  InputAdornment,
  TextField,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Checkbox
} from '@mui/material';

const drawerWidth = 260;

function App() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [stats, setStats] = useState({ total: 0, assigned: 0, available: 0, defective: 0, usage_rate: '0%', usage_rate_num: 0 });
  const [assets, setAssets] = useState<any[]>([]);
  const [defectiveAssets, setDefectiveAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Selection state
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  
  // Employee details states
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeAssets, setEmployeeAssets] = useState<any[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);

  // Modals
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Forms
  const [newAsset, setNewAsset] = useState({ code: '', item_type: 'Monitor', description: '', acquisition_date: '' });
  const [newEmployee, setNewEmployee] = useState({ name: '', desk_number: '', location: 'Sede Principal', possession_date: '' });
  const [selectedAssetToAssign, setSelectedAssetToAssign] = useState('');

  useEffect(() => {
    async function load() {
      await initDb();
      await loadData();
    }
    load();
    setSelectedAssets([]);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'search') {
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  async function loadData() {
    const s = await getStats();
    setStats(s);
    
    if (activeTab === 'assets') {
      setAssets(await getAssets());
    } else if (activeTab === 'employees') {
      setEmployees(await getEmployees());
      if (selectedEmployee) {
        await handleSelectEmployee(selectedEmployee.id);
      }
    } else if (activeTab === 'search') {
      await handleSearch(searchQuery);
    } else if (activeTab === 'defective') {
      setDefectiveAssets(await getDefectiveAssets());
    }
  }

  async function handleSearch(q: string) {
    if (q.length > 0 && q.length < 2) return;
    const res = await getUnifiedSearch(q);
    setSearchResults(res);
  }

  // --- Actions: Assets ---
  async function handleSaveAsset() {
    try {
      await addAsset(newAsset);
      setAssetModalOpen(false);
      setNewAsset({ code: '', item_type: 'Monitor', description: '', acquisition_date: '' });
      alert('Ativo cadastrado com sucesso!');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar ativo. Verifique se o código já existe.');
    }
  }

  async function handleMarkDefective(assetId: number) {
    if (window.confirm('Tem certeza que deseja marcar este item como com defeito? Ele será desvinculado de qualquer colaborador.')) {
      await markAsDefective(assetId);
      alert('Ativo marcado com defeito e enviado para manutenção.');
      if (selectedEmployee) await handleSelectEmployee(selectedEmployee.id);
      loadData();
    }
  }

  async function handleRestoreDefective(assetId: number) {
    if (window.confirm('O item foi consertado e pode voltar ao estoque?')) {
      await restoreAsset(assetId);
      alert('Ativo restaurado para Disponível.');
      loadData();
    }
  }

  async function handleDeleteSingleAsset(id: number) {
    if (window.confirm('Deseja realmente excluir este ativo permanentemente?')) {
      try {
        await deleteAsset(id);
        alert('Ativo excluído com sucesso.');
        setSelectedAssets(selectedAssets.filter(sid => sid !== id));
        loadData();
      } catch (e: any) {
        alert(e.message || 'Erro ao excluir ativo.');
      }
    }
  }

  async function handleDeleteSelectedAssets() {
    if (selectedAssets.length === 0) return;
    if (window.confirm(`Deseja realmente excluir os ${selectedAssets.length} ativos selecionados permanentemente?`)) {
      try {
        await deleteMultipleAssets(selectedAssets);
        alert('Ativos excluídos com sucesso.');
        setSelectedAssets([]);
        loadData();
      } catch (e: any) {
        alert(e.message || 'Erro ao excluir ativos.');
      }
    }
  }

  function handleSelectAllClick(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.checked) {
      const newSelected = assets.filter(a => a.status !== 'Em Uso').map(a => a.id);
      setSelectedAssets(newSelected);
      return;
    }
    setSelectedAssets([]);
  }

  function handleSelectClick(id: number) {
    const selectedIndex = selectedAssets.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedAssets, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedAssets.slice(1));
    } else if (selectedIndex === selectedAssets.length - 1) {
      newSelected = newSelected.concat(selectedAssets.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedAssets.slice(0, selectedIndex),
        selectedAssets.slice(selectedIndex + 1),
      );
    }
    setSelectedAssets(newSelected);
  }

  // --- Actions: Employees ---
  async function handleSaveEmployee() {
    try {
      await addEmployee(newEmployee);
      setEmpModalOpen(false);
      setNewEmployee({ name: '', desk_number: '', location: 'Sede Principal', possession_date: '' });
      alert('Colaborador cadastrado com sucesso!');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao cadastrar colaborador.');
    }
  }

  async function handleDeleteEmployee(id: number) {
    if (window.confirm('Deseja excluir este colaborador? Os ativos voltarão para Disponível.')) {
      await deleteEmployee(id);
      setSelectedEmployee(null);
      loadData();
    }
  }

  async function handleSelectEmployee(id: number) {
    const emps = await getEmployees();
    const emp = emps.find(e => e.id === id);
    if (emp) {
      setSelectedEmployee(emp);
      const assetsList = await getEmployeeAssets(id);
      setEmployeeAssets(assetsList);
    }
  }

  async function handleOpenAssignModal() {
    const avail = await getAvailableAssets();
    setAvailableAssets(avail);
    setSelectedAssetToAssign('');
    setAssignModalOpen(true);
  }

  async function handleAssignAsset() {
    if (!selectedAssetToAssign) return alert('Selecione um ativo');
    await assignAsset(Number(selectedAssetToAssign), selectedEmployee.id);
    setAssignModalOpen(false);
    alert('Equipamento vinculado com sucesso!');
    handleSelectEmployee(selectedEmployee.id);
    loadData();
  }

  async function handleReleaseAsset(assetId: number) {
    await releaseAsset(assetId);
    handleSelectEmployee(selectedEmployee.id);
    loadData();
  }

  // --- Exports / Backups ---
  async function handleExportExcel() {
    const filePath = await save({
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      defaultPath: 'inventario.xlsx'
    });
    if (!filePath) return;

    try {
      const data = await getUnifiedSearch("");
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Inventário');

      if (data.length > 0) {
        sheet.columns = Object.keys(data[0]).map(key => ({ header: key, key: key, width: 20 }));
        data.forEach(row => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      // Using browser download as fallback for tauri write
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split(/[/\\]/).pop() || 'inventario.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      alert('Planilha exportada com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar planilha.');
    }
  }

  async function handleBackup() {
    const filePath = await save({
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      defaultPath: 'gap_backup.json'
    });
    if (!filePath) return;
    
    try {
      const db = await getDb();
      const backupAssets = await db.select('SELECT * FROM assets');
      const backupEmployees = await db.select('SELECT * FROM employees');
      const backupAssignments = await db.select('SELECT * FROM assignments');
      
      const backupData = JSON.stringify({ assets: backupAssets, employees: backupEmployees, assignments: backupAssignments }, null, 2);
      await writeTextFile(filePath, backupData);
      alert('Backup realizado com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao realizar backup');
    }
  }

  async function handleRestore() {
    const selectedPath = await open({
      filters: [{ name: 'JSON Backup', extensions: ['json'] }],
      multiple: false
    });
    if (!selectedPath) return;
    const filePath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;
    
    try {
      const content = await readTextFile(filePath);
      const data = JSON.parse(content);
      
      if (!data.assets || !data.employees || !data.assignments) throw new Error("Invalid backup file");
      
      const db = await getDb();
      await db.execute('DELETE FROM assignments');
      await db.execute('DELETE FROM assets');
      await db.execute('DELETE FROM employees');
      
      for (const a of data.assets) {
        await db.execute('INSERT INTO assets (id, code, item_type, description, acquisition_date, status) VALUES ($1, $2, $3, $4, $5, $6)', [a.id, a.code, a.item_type, a.description, a.acquisition_date, a.status]);
      }
      for (const e of data.employees) {
        await db.execute('INSERT INTO employees (id, name, desk_number, location, possession_date) VALUES ($1, $2, $3, $4, $5)', [e.id, e.name, e.desk_number, e.location, e.possession_date]);
      }
      for (const ass of data.assignments) {
        await db.execute('INSERT INTO assignments (id, asset_id, employee_id, assignment_date) VALUES ($1, $2, $3, $4)', [ass.id, ass.asset_id, ass.employee_id, ass.assignment_date]);
      }
      
      alert('Restauração concluída com sucesso!');
      loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao restaurar backup');
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'assets', label: 'Ativos', icon: <Package size={20} /> },
    { id: 'employees', label: 'Colaboradores', icon: <Users size={20} /> },
    { id: 'search', label: 'Busca Global', icon: <Search size={20} /> },
    { id: 'defective', label: 'Com Defeito', icon: <AlertTriangle size={20} /> },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      
      {/* Sidebar Navigation */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? drawerWidth : 72,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : 72,
            transition: 'width 0.2s ease-in-out',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #E8EDF2',
            overflowX: 'hidden'
          },
        }}
      >
        <Box sx={{ px: drawerOpen ? 3 : 2, display: 'flex', alignItems: 'center', justifyContent: drawerOpen ? 'flex-start' : 'center', gap: 2, height: '64px', boxSizing: 'border-box' }}>
          <img src="/LOGO.png" alt="GAP" style={{ height: 32, objectFit: 'contain' }} />
          {drawerOpen && (
            <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 600 }}>
              GAP
              <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5, display: 'block', lineHeight: 1.1 }}>
                Gestão De Ativos e Patrimônio
              </Typography>
            </Typography>
          )}
        </Box>

        <Divider sx={{ borderColor: '#E8EDF2' }} />

        <Box sx={{ p: drawerOpen ? 2 : 1, pt: 3 }}>
          {drawerOpen && (
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, ml: 2, mb: 1, display: 'block', letterSpacing: '0.05em' }}>
              NAVEGAÇÃO
            </Typography>
          )}
          
          <List sx={{ px: 1 }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => setActiveTab(item.id)}
                    sx={{
                      borderRadius: '8px',
                      py: 1,
                      px: drawerOpen ? 2 : 1.5,
                      justifyContent: drawerOpen ? 'initial' : 'center',
                      backgroundColor: isActive ? 'rgba(30, 58, 138, 0.04)' : 'transparent',
                      borderLeft: isActive ? '4px solid #1E3A8A' : '4px solid transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(30, 58, 138, 0.04)',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ 
                      minWidth: 0, 
                      mr: drawerOpen ? 2 : 'auto', 
                      justifyContent: 'center',
                      color: isActive ? 'primary.main' : 'text.secondary' 
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {drawerOpen && (
                      <ListItemText 
                        primary={
                          <Typography sx={{
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? 'primary.main' : 'text.secondary',
                            fontSize: '0.875rem'
                          }}>
                            {item.label}
                          </Typography>
                        } 
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid #E8EDF2', color: 'text.primary' }}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(!drawerOpen)}>
              <Menu size={20} />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Scrollable Content */}
        <Box sx={{ p: 4, overflow: 'auto', flexGrow: 1 }}>
          
          {/* Header Area */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
                {navItems.find(i => i.id === activeTab)?.label}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {activeTab === 'dashboard' && 'Acompanhamento em tempo real dos ativos da empresa.'}
                {activeTab === 'assets' && 'Gerencie o inventário de equipamentos.'}
                {activeTab === 'employees' && 'Vincule equipamentos aos responsáveis.'}
                {activeTab === 'search' && 'Pesquisa unificada em todo o banco de dados.'}
                {activeTab === 'defective' && 'Controle de ativos que aguardam manutenção.'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
               {activeTab === 'assets' && selectedAssets.length > 0 && (
                 <Button variant="contained" color="error" startIcon={<Trash2 size={16} />} sx={{ px: 3 }} onClick={handleDeleteSelectedAssets}>
                   Excluir Selecionados ({selectedAssets.length})
                 </Button>
               )}
               {activeTab === 'assets' && (
                 <Button variant="contained" color="primary" startIcon={<Plus size={16} />} sx={{ px: 3 }} onClick={() => setAssetModalOpen(true)}>
                   Novo Ativo
                 </Button>
               )}
               {activeTab === 'employees' && (
                 <Button variant="contained" color="primary" startIcon={<Plus size={16} />} sx={{ px: 3 }} onClick={() => setEmpModalOpen(true)}>
                   Novo Colaborador
                 </Button>
               )}
               <Button variant="outlined" color="primary" startIcon={<Upload size={16} />} onClick={handleRestore}>
                 Restaurar
               </Button>
               <Button variant="outlined" color="primary" startIcon={<Save size={16} />} onClick={handleBackup}>
                 Backup
               </Button>
               <Button variant="outlined" color="primary" startIcon={<Download size={16} />} onClick={handleExportExcel}>
                 Exportar Excel
               </Button>
            </Box>
          </Box>

          <Paper sx={{ p: 3, borderRadius: 4 }}>
            
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <Box>
                <Box sx={{ mb: 4, bgcolor: '#F8FAFC', p: 3, borderRadius: 3, border: '1px solid #E8EDF2' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Taxa de Utilização do Inventário</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>{stats.usage_rate}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.usage_rate_num} 
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: 'primary.main' } }} 
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>Resumo de Ativos</Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#F1F5F9', color: '#1E3A8A', width: 40, height: 40 }}>
                            <Package size={20} />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Total Cadastrado</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, ml: 1 }}>{stats.total}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#F3E8FF', color: '#8B5CF6', width: 40, height: 40 }}>
                            <Package size={20} />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Em Uso</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, ml: 1 }}>{stats.assigned}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#D1FAE5', color: '#10B981', width: 40, height: 40 }}>
                            <Package size={20} />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Disponíveis</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, ml: 1 }}>{stats.available}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#FEF2F2', color: '#EF4444', width: 40, height: 40 }}>
                            <AlertTriangle size={20} />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Com Defeito</Typography>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, ml: 1 }}>{stats.defective}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          indeterminate={selectedAssets.length > 0 && selectedAssets.length < assets.filter(a => a.status !== 'Em Uso').length}
                          checked={assets.filter(a => a.status !== 'Em Uso').length > 0 && selectedAssets.length === assets.filter(a => a.status !== 'Em Uso').length}
                          onChange={handleSelectAllClick}
                        />
                      </TableCell>
                      <TableCell>Código</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell>Aquisição</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assets.map((a) => {
                      const isItemSelected = selectedAssets.indexOf(a.id) !== -1;
                      const isEmUso = a.status === 'Em Uso';
                      return (
                      <TableRow 
                        key={a.id} 
                        hover
                        role="checkbox"
                        aria-checked={isItemSelected}
                        selected={isItemSelected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            disabled={isEmUso}
                            onChange={() => handleSelectClick(a.id)}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{a.code}</TableCell>
                        <TableCell>{a.item_type}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{a.description || '-'}</TableCell>
                        <TableCell>{a.acquisition_date}</TableCell>
                        <TableCell>
                          <Chip 
                            label={a.status} 
                            size="small" 
                            color={a.status === 'Disponível' ? 'success' : (a.status === 'Com Defeito' ? 'error' : 'secondary')} 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              color="error" 
                              disabled={isEmUso || a.status === 'Com Defeito'}
                              onClick={() => handleMarkDefective(a.id)}
                            >
                              Defeito
                            </Button>
                            <IconButton 
                              color="error" 
                              size="small" 
                              disabled={isEmUso}
                              onClick={() => handleDeleteSingleAsset(a.id)}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )})}
                    {assets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Nenhum ativo cadastrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Employees Tab */}
            {activeTab === 'employees' && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ border: '1px solid #E8EDF2', borderRadius: 3, overflow: 'hidden' }}>
                    <List disablePadding>
                      {employees.map((emp) => (
                        <ListItemButton 
                          key={emp.id} 
                          onClick={() => handleSelectEmployee(emp.id)}
                          selected={selectedEmployee?.id === emp.id}
                          sx={{ 
                            borderBottom: '1px solid #E8EDF2',
                            '&.Mui-selected': { bgcolor: 'rgba(30, 58, 138, 0.04)', borderLeft: '4px solid #1E3A8A' }
                          }}
                        >
                          <ListItemText 
                            primary={<Typography sx={{ fontWeight: 600 }}>{emp.name}</Typography>}
                            secondary={`📍 ${emp.location} | 🪑 ${emp.desk_number || '-'}`} 
                          />
                        </ListItemButton>
                      ))}
                      {employees.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>Nenhum colaborador.</Box>
                      )}
                    </List>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  {selectedEmployee ? (
                    <Box sx={{ p: 3, border: '1px solid #E8EDF2', borderRadius: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>{selectedEmployee.name}</Typography>
                          <Chip label={`Desde ${selectedEmployee.possession_date}`} size="small" color="primary" variant="outlined" sx={{ mt: 1 }} />
                        </Box>
                        <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteEmployee(selectedEmployee.id)}>
                          Excluir
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 4 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>Equipamentos Vinculados</Typography>
                        <Button variant="contained" size="small" startIcon={<Plus size={16}/>} onClick={handleOpenAssignModal}>
                          Vincular Novo
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {employeeAssets.length > 0 ? employeeAssets.map(a => (
                          <Card key={a.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2, pb: '16px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>{a.item_type} ({a.code})</Typography>
                                <Typography variant="body2" color="text.secondary">{a.description || 'Sem descrição'}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button variant="outlined" size="small" color="error" onClick={() => handleMarkDefective(a.id)}>
                                  Defeito
                                </Button>
                                <Button variant="outlined" size="small" color="inherit" onClick={() => handleReleaseAsset(a.id)}>
                                  Devolver
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        )) : (
                          <Box sx={{ p: 4, textAlign: 'center', border: '1px dashed #E8EDF2', borderRadius: 2, color: 'text.secondary' }}>
                            Nenhum equipamento vinculado.
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 6, textAlign: 'center', border: '1px dashed #E8EDF2', borderRadius: 3, color: 'text.secondary' }}>
                      <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                      <Typography>Selecione um colaborador para gerenciar seus ativos.</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}

            {/* Defectives Tab */}
            {activeTab === 'defective' && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {defectiveAssets.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{a.code}</TableCell>
                        <TableCell>{a.item_type}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{a.description || '-'}</TableCell>
                        <TableCell>
                          <Chip label={a.status} size="small" color="error" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Button variant="contained" size="small" color="success" onClick={() => handleRestoreDefective(a.id)}>
                            Restaurar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {defectiveAssets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Nenhum ativo com defeito no momento.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <Box>
                <TextField
                  fullWidth
                  placeholder="Digite para buscar ativos, responsáveis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start"><Search size={20} color="#94A3B8" /></InputAdornment> }
                  }}
                  sx={{ mb: 4 }}
                />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Responsável</TableCell>
                        <TableCell>Localização</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((row, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row['Código']}</TableCell>
                          <TableCell>{row['Tipo']}</TableCell>
                          <TableCell sx={{ color: 'text.secondary' }}>{row['Descrição'] || '-'}</TableCell>
                          <TableCell>
                            <Chip label={row['Status']} size="small" color={row['Status'] === 'Disponível' ? 'success' : 'secondary'} variant="outlined" />
                          </TableCell>
                          <TableCell sx={{ color: row['Responsável'] ? 'secondary.main' : 'text.secondary', fontWeight: row['Responsável'] ? 600 : 400 }}>
                            {row['Responsável'] || 'Livre no Estoque'}
                          </TableCell>
                          <TableCell>{row['Localização'] || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {searchResults.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            Nenhum resultado encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

          </Paper>

          {/* Dialog Cadastrar Ativo */}
          <Dialog open={assetModalOpen} onClose={() => setAssetModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, color: 'primary.main' }}>Cadastrar Ativo</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <TextField label="Código" fullWidth size="small" required value={newAsset.code} onChange={(e) => setNewAsset({ ...newAsset, code: e.target.value })} />
                <FormControl fullWidth size="small" required>
                  <InputLabel>Tipo</InputLabel>
                  <Select label="Tipo" value={newAsset.item_type} onChange={(e) => setNewAsset({ ...newAsset, item_type: e.target.value })}>
                    <MenuItem value="Monitor">Monitor</MenuItem>
                    <MenuItem value="CPU">CPU</MenuItem>
                    <MenuItem value="Notebook">Notebook</MenuItem>
                    <MenuItem value="Acessório">Acessório</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Descrição" fullWidth size="small" multiline rows={3} value={newAsset.description} onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })} />
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>Data de Aquisição *</Typography>
                  <TextField type="date" fullWidth size="small" required value={newAsset.acquisition_date} onChange={(e) => setNewAsset({ ...newAsset, acquisition_date: e.target.value })} />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setAssetModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
              <Button onClick={handleSaveAsset} variant="contained" color="primary">Salvar</Button>
            </DialogActions>
          </Dialog>

          {/* Dialog Cadastrar Colaborador */}
          <Dialog open={empModalOpen} onClose={() => setEmpModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, color: 'primary.main' }}>Novo Colaborador</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <TextField label="Nome" fullWidth size="small" required value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
                <TextField label="Mesa" fullWidth size="small" value={newEmployee.desk_number} onChange={(e) => setNewEmployee({ ...newEmployee, desk_number: e.target.value })} />
                <FormControl fullWidth size="small" required>
                  <InputLabel>Localização</InputLabel>
                  <Select label="Localização" value={newEmployee.location} onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}>
                    <MenuItem value="Sede Principal">Sede Principal</MenuItem>
                    <MenuItem value="Home Office">Home Office</MenuItem>
                  </Select>
                </FormControl>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>Data de Posse *</Typography>
                  <TextField type="date" fullWidth size="small" required value={newEmployee.possession_date} onChange={(e) => setNewEmployee({ ...newEmployee, possession_date: e.target.value })} />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setEmpModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
              <Button onClick={handleSaveEmployee} variant="contained" color="primary">Cadastrar</Button>
            </DialogActions>
          </Dialog>

          {/* Dialog Vincular Equipamento */}
          <Dialog open={assignModalOpen} onClose={() => setAssignModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 600, color: 'primary.main' }}>Vincular Equipamento</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Selecionar Ativo Disponível</InputLabel>
                  <Select label="Selecionar Ativo Disponível" value={selectedAssetToAssign} onChange={(e) => setSelectedAssetToAssign(e.target.value)}>
                    {availableAssets.length === 0 && <MenuItem disabled value="">Nenhum ativo disponível</MenuItem>}
                    {availableAssets.map(a => (
                      <MenuItem key={a.id} value={a.id}>{a.item_type} (Cód. {a.code}) - {a.description || 'S/ Desc'}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setAssignModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Cancelar</Button>
              <Button onClick={handleAssignAsset} variant="contained" color="primary" disabled={!selectedAssetToAssign}>Vincular</Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Box>
    </Box>
  );
}

export default App;
