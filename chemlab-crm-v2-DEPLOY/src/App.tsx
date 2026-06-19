import React, { useState, useEffect } from 'react';
import {
  Building2, LayoutDashboard, Briefcase,
  UserPlus, RefreshCcw,
  NotebookTabs, ArrowLeftRight,
  Menu, X, Sparkles, LogOut
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import OngoingServices from './components/OngoingServices';
import ServiceTracker from './components/ServiceTracker';
import NewClient from './components/NewClient';
import ServiceCatalog from './components/ServiceCatalog';
import Incentives from './components/Incentives';
import SalesEmployees from './components/SalesEmployees';
import LoginPage from './components/LoginPage';

import {
  INITIAL_SERVICES, INITIAL_CLIENTS, INITIAL_PROJECTS,
  INITIAL_INCENTIVES, INITIAL_SALES_EMPLOYEES
} from './data/mockData';
import {
  getServicesFromDb, getClientsFromDb, getProjectsFromDb,
  getIncentivesFromDb, getSalesEmployeesFromDb,
  dbAddService, dbUpdateService, dbDeleteService,
  dbAddClient, dbDeleteClient,
  dbAddProject, dbDeleteProject,
  dbAddIncentive,
  dbAddSalesEmployee, dbUpdateSalesEmployee, dbDeleteSalesEmployee,
  dbResetToStandard,
  onAuthChange, signOutUser
} from './lib/firebase';

import { Service, Client, Project, Incentive, SalesEmployee, ActivityNote, ProjectStatus } from './types';
import { User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'dashboard'|'ongoing'|'tracker'|'clients'|'catalog'|'incentives'|'sales'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [employees, setEmployees] = useState<SalesEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return unsub;
  }, []);

  // Load data when user is logged in
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setIsLoading(true);
      try {
        const [srv, cli, proj, inc, emp] = await Promise.all([
          getServicesFromDb(), getClientsFromDb(), getProjectsFromDb(),
          getIncentivesFromDb(), getSalesEmployeesFromDb()
        ]);
        setServices(srv); setClients(cli); setProjects(proj);
        setIncentives(inc); setEmployees(emp);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Show nothing while checking auth
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login if not authenticated
  if (user === null) return <LoginPage />;

  // --- CRUDS ---
  const handleAddService = async (newService: Omit<Service, 'id'>) => {
    const srv: Service = { ...newService, id: `s-${Date.now()}` };
    setServices(p => [...p, srv]);
    try { await dbAddService(srv); } catch (e) { console.error(e); }
  };
  const handleUpdateService = async (id: string, u: Partial<Service>) => {
    setServices(p => p.map(s => s.id === id ? { ...s, ...u } : s));
    try { await dbUpdateService(id, u); } catch (e) { console.error(e); }
  };
  const handleDeleteService = async (id: string) => {
    setServices(p => p.filter(s => s.id !== id));
    try { await dbDeleteService(id); } catch (e) { console.error(e); }
  };

  const handleAddClient = async (newClient: Omit<Client, 'id'|'createdAt'|'activityNotes'>) => {
    const cli: Client = {
      ...newClient, id: `c-${Date.now()}`,
      createdAt: new Date().toISOString(),
      activityNotes: [{ id: `act-${Date.now()}`, date: new Date().toISOString().split('T')[0], note: `Lead baru dibuat dengan status: ${newClient.status}.`, author: newClient.assignedSales }]
    };
    setClients(p => [...p, cli]);
    try { await dbAddClient(cli); } catch (e) { console.error(e); }
  };
  const handleUpdateClient = async (id: string, u: Partial<Client>) => {
    let target: Client | undefined;
    setClients(p => p.map(c => {
      if (c.id !== id) return c;
      const next = { ...c, ...u };
      if (u.status && u.status !== c.status) {
        next.activityNotes = [...next.activityNotes, { id: `act-${Date.now()}`, date: new Date().toISOString().split('T')[0], note: `Status berganti dari ${c.status} menjadi ${u.status}.`, author: 'Sistem CRM' }];
      }
      target = next; return next;
    }));
    try { if (target) await dbAddClient(target); } catch (e) { console.error(e); }
  };
  const handleDeleteClient = async (id: string) => {
    setClients(p => p.filter(c => c.id !== id));
    try { await dbDeleteClient(id); } catch (e) { console.error(e); }
  };
  const handleAddActivityNote = async (clientId: string, noteData: Omit<ActivityNote, 'id'|'date'>) => {
    let target: Client | undefined;
    setClients(p => p.map(c => {
      if (c.id !== clientId) return c;
      const next = { ...c, activityNotes: [...c.activityNotes, { id: `note-${Date.now()}`, date: new Date().toISOString().split('T')[0], ...noteData }] };
      target = next; return next;
    }));
    try { if (target) await dbAddClient(target); } catch (e) { console.error(e); }
  };

  const handleAddProject = async (newProject: Omit<Project, 'id'|'quotationNumber'>) => {
    const num = projects.length + 1;
    const proj: Project = { ...newProject, id: `LAB-2026-${String(num).padStart(3,'0')}`, quotationNumber: `QT-2026-${String(100 + num).padStart(4,'0')}` };
    setProjects(p => [...p, proj]);
    try {
      await dbAddProject(proj);
      const client = clients.find(c => c.id === newProject.clientId);
      if (client && client.status !== 'Won') await handleUpdateClient(client.id, { status: 'Won' });
    } catch (e) { console.error(e); }
  };
  const handleUpdateProject = async (id: string, u: Partial<Project>) => {
    let target: Project | undefined;
    let newInc: Incentive | null = null;
    let clientUpdate: { id: string; data: Partial<Client> } | null = null;
    setProjects(p => p.map(proj => {
      if (proj.id !== id) return proj;
      const next = { ...proj, ...u }; target = next;
      const client = clients.find(c => c.id === proj.clientId);
      if (client?.isFirstTransaction) {
        const done = next.status === 'Completed' || next.status === 'Report Released';
        const paid = next.paymentStatus === 'Paid';
        if (done && paid && !incentives.some(i => i.projectId === id)) {
          newInc = { id: `inc-${Date.now()}`, projectId: id, clientName: proj.clientName, serviceName: proj.serviceName, salesName: next.assignedSales, serviceValue: next.totalPrice, incentiveValue: next.totalPrice * 0.025, paymentStatus: 'Paid', isPaid: false, createdAt: new Date().toISOString() };
          clientUpdate = { id: client.id, data: { isFirstTransaction: false } };
        }
      }
      return next;
    }));
    try {
      if (target) await dbAddProject(target);
      if (newInc) { setIncentives(p => [...p, newInc!]); await dbAddIncentive(newInc); }
      if (clientUpdate) await handleUpdateClient(clientUpdate.id, clientUpdate.data);
    } catch (e) { console.error(e); }
  };
  const handleDeleteProject = async (id: string) => {
    setProjects(p => p.filter(proj => proj.id !== id));
    try { await dbDeleteProject(id); } catch (e) { console.error(e); }
  };
  const handleUpdateProjectStatus = async (id: string, s: ProjectStatus, prog: number) => {
    await handleUpdateProject(id, { status: s, progressPercent: prog });
  };

  const handleDisburseIncentive = async (id: string) => {
    let target: Incentive | undefined;
    setIncentives(p => p.map(i => { if (i.id !== id) return i; const n = { ...i, isPaid: !i.isPaid }; target = n; return n; }));
    try { if (target) await dbAddIncentive(target); } catch (e) { console.error(e); }
  };

  const handleAddEmployee = async (newEmp: Omit<SalesEmployee, 'id'|'createdAt'|'achievedThisMonth'>) => {
    const emp: SalesEmployee = { ...newEmp, id: `sales-${Date.now()}`, achievedThisMonth: 0, createdAt: new Date().toISOString() };
    setEmployees(p => [...p, emp]);
    try { await dbAddSalesEmployee(emp); } catch (e) { console.error(e); }
  };
  const handleUpdateEmployee = async (id: string, u: Partial<SalesEmployee>) => {
    setEmployees(p => p.map(e => e.id === id ? { ...e, ...u } : e));
    try { await dbUpdateSalesEmployee(id, u); } catch (e) { console.error(e); }
  };
  const handleDeleteEmployee = async (id: string) => {
    setEmployees(p => p.filter(e => e.id !== id));
    try { await dbDeleteSalesEmployee(id); } catch (e) { console.error(e); }
  };

  const handleRevertToInitialSeeder = async () => {
    if (!confirm('Reset semua data ke data awal? Tindakan ini tidak dapat dibatalkan.')) return;
    setIsLoading(true);
    try {
      await dbResetToStandard();
      setServices(INITIAL_SERVICES); setClients(INITIAL_CLIENTS);
      setProjects(INITIAL_PROJECTS); setIncentives(INITIAL_INCENTIVES);
      setEmployees(INITIAL_SALES_EMPLOYEES);
      setActiveTab('dashboard');
    } catch (err) { console.error(err); alert('Reset gagal, coba lagi.'); }
    finally { setIsLoading(false); }
  };

  const initials = user.displayName ? user.displayName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '??';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-750 selection:bg-teal-500/10 selection:text-teal-900">
      {/* SIDEBAR */}
      <aside className={`bg-slate-900 border-r border-slate-800 text-slate-300 w-64 shrink-0 transition-transform duration-300 fixed md:relative h-screen z-40 flex flex-col justify-between ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 overflow-hidden border-none'}`}>
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-600 rounded-xl text-white"><Building2 className="h-5 w-5" /></div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">ChemLab CRM</h2>
                <span className="text-[10px] text-slate-500 block font-semibold tracking-wider font-mono uppercase">LAB COMPLIANCE</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md md:hidden cursor-pointer"><X className="h-4 w-4" /></button>
          </div>
          <nav className="space-y-1.5 pt-2">
            {([
              { id: 'dashboard', label: 'Dashboard KPI', icon: LayoutDashboard },
              { id: 'ongoing', label: 'Ongoing Services', icon: Briefcase },
              { id: 'tracker', label: 'Service Tracker', icon: ArrowLeftRight },
              { id: 'clients', label: 'New Client / Leads', icon: UserPlus },
              { id: 'catalog', label: 'Service Catalog', icon: NotebookTabs },
              { id: 'incentives', label: 'Incentives', icon: Sparkles },
              { id: 'sales', label: 'Sales Karyawan', icon: UserPlus },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActiveTab(id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${activeTab === id ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
                <Icon className="h-4 w-4 shrink-0" />{label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 bg-slate-950 text-[10px] space-y-2 border-t border-slate-800">
          {/* User info */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-[10px]">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-300 font-semibold text-[11px] truncate">{user.displayName}</p>
              <p className="text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={() => signOutUser()} className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-md border border-slate-700 text-[10px] cursor-pointer">
            <LogOut className="h-3 w-3" /> Keluar
          </button>
          <button onClick={handleRevertToInitialSeeder} className="w-full text-center py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-500 rounded-md border border-slate-800 font-mono text-[9px] cursor-pointer">
            Revert to Seeder Data
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"><Menu className="h-5 w-5" /></button>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>ChemLab Sales CRM</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-normal px-2 py-0.5 rounded-md font-mono hidden sm:inline-block">v2.0</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
              <span className="inline-block relative"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              <span className="hidden sm:inline">Firebase Connected</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs cursor-default" title={user.email ?? ''}>{initials}</div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto pb-16">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-500">Memuat data dari Firebase...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard clients={clients} projects={projects} services={services} />}
              {activeTab === 'ongoing' && <OngoingServices projects={projects} clients={clients} services={services} onAddProject={handleAddProject} onUpdateProject={handleUpdateProject} onDeleteProject={handleDeleteProject} />}
              {activeTab === 'tracker' && <ServiceTracker projects={projects} clients={clients} services={services} onUpdateProjectStatus={handleUpdateProjectStatus} onAddProject={handleAddProject} />}
              {activeTab === 'clients' && <NewClient clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} onAddActivityNote={handleAddActivityNote} />}
              {activeTab === 'catalog' && <ServiceCatalog services={services} onAddService={handleAddService} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} />}
              {activeTab === 'incentives' && <Incentives projects={projects} clients={clients} incentives={incentives} onDisburseIncentive={handleDisburseIncentive} />}
              {activeTab === 'sales' && <SalesEmployees employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
