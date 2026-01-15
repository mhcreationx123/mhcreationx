
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Project, Expense, PaymentStatus, PaymentMethod, User, Customer, ProjectStatus, AuditLog, Message } from './types';

const _M_U = 'moazzem@mahi';
const _M_P = 'MaHi';

interface ExtendedAppState extends AppState {
  showLoginModal: boolean;
}

interface AppActions {
  addProject: (data: any) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addCustomer: (name: string, phone: string, type: 'Director' | 'Local Client' | 'Producer' | 'Actor') => string;
  toggleCustomerStatus: (id: string) => void;
  deleteCustomer: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  deleteExpense: (id: string) => void;
  toggleTheme: () => void;
  loginAdmin: (username: string, pass: string) => boolean;
  loginCustomer: (customerId: string) => boolean;
  logout: () => void;
  addUser: (username: string, pass: string, role: 'Admin' | 'Team') => boolean;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  incrementVisitors: () => void;
  clearAuditLogs: () => void;
  addAuditLog: (action: string, category: AuditLog['category'], details: string, projectId?: string) => void;
  sendMessage: (text: string) => void;
  togglePaymentVisibility: () => void;
  setShowLoginModal: (show: boolean) => void;
}

export const useAppStore = create<ExtendedAppState & AppActions>()(
  persist(
    (set, get) => ({
      projects: [],
      customers: [],
      expenses: [],
      users: [],
      auditLogs: [],
      messages: [],
      visitorCount: 1248, 
      paymentVisibility: true,
      isAuthenticated: false,
      authType: null,
      currentUser: null,
      currentCustomer: null,
      theme: 'dark',
      showLoginModal: false,

      setShowLoginModal: (show) => set({ showLoginModal: show }),

      incrementVisitors: () => set((state) => ({ visitorCount: state.visitorCount + 1 })),

      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      loginAdmin: (username, pass) => {
        if (username === _M_U && pass === _M_P) {
          const masterUser: User = { id: 'master', username: _M_U, role: 'Admin', pass: _M_P, createdAt: new Date().toISOString() };
          set({ isAuthenticated: true, authType: 'staff', currentUser: masterUser });
          get().addAuditLog('Staff Login', 'system', `Admin ${username} authenticated.`);
          get().incrementVisitors();
          return true;
        }
        const user = get().users.find(u => u.username === username && u.pass === pass);
        if (user) {
          set({ isAuthenticated: true, authType: 'staff', currentUser: user });
          get().addAuditLog('Staff Login', 'system', `User ${username} authenticated.`);
          get().incrementVisitors();
          return true;
        }
        return false;
      },

      loginCustomer: (customerId) => {
        const customer = get().customers.find(c => c.id.toUpperCase() === customerId.trim().toUpperCase());
        if (customer) {
          set({ isAuthenticated: true, authType: 'customer', currentCustomer: customer });
          get().addAuditLog('Client Login', 'system', `Client ID ${customerId} entered workspace.`);
          get().incrementVisitors();
          return true;
        }
        return false;
      },

      logout: () => {
        get().addAuditLog('Logout', 'system', 'User signed out.');
        set({ isAuthenticated: false, authType: null, currentUser: null, currentCustomer: null });
      },

      addCustomer: (name, phone, type) => {
        const cleanName = name.trim();
        const prefix = cleanName.length >= 2 ? cleanName.substring(0, 2).toUpperCase() : 'CU';
        const id = `${prefix}${Math.floor(1000 + Math.random() * 8999)}`; // Robust 4-digit suffix
        const newCustomer: Customer = { id, name: cleanName, phone, type, isActive: true, createdAt: new Date().toISOString() };
        set(state => ({ customers: [...state.customers, newCustomer] }));
        get().addAuditLog('Customer Enrollment', 'user', `Client ${name} registered with ID ${id}.`);
        return id;
      },

      toggleCustomerStatus: (id) => set(state => ({
        customers: state.customers.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c)
      })),

      deleteCustomer: (id) => set(state => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      addProject: (data) => {
        const customer = get().customers.find(c => c.id === data.customerId);
        const images = data.images || [];
        const newProject: Project = {
          ...data,
          id: `PRJ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          serialNumber: get().projects.length + 1,
          createDate: new Date().toISOString(),
          secureToken: Math.random().toString(36).substr(2, 12),
          clientName: customer?.name || 'Unknown',
          clientType: customer?.type || 'Standard',
          status: data.status || ProjectStatus.PENDING,
          images: images,
          paidAmount: data.advanceAmount || 0,
          paymentMethod: PaymentMethod.NONE,
          posterCount: images.filter((img: any) => img.type === 'poster').length,
          thumbnailCount: images.filter((img: any) => img.type === 'thumbnail').length,
          bannerCount: images.filter((img: any) => img.type === 'banner' || img.type === 'design').length,
          director: customer?.name || (data.director || 'Studio'),
          isVisibleOnPublic: data.isVisibleOnPublic ?? true,
          showInAnimation: data.showInAnimation ?? false,
          showInPrevious: data.showInPrevious ?? false
        };
        set(state => ({ projects: [...state.projects, newProject] }));
        get().addAuditLog('Project Created', 'project', `Title: ${data.title} initialized for client ${newProject.clientName}`, newProject.id);
      },

      updateProject: (id, updates) => {
        const existing = get().projects.find(p => p.id === id);
        if (!existing) return;

        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
        }));

        if (updates.paymentStatus && updates.paymentStatus !== existing.paymentStatus) {
          get().addAuditLog('Payment Update', 'finance', `Status changed: ${existing.paymentStatus} -> ${updates.paymentStatus}`, id);
        }
        if (updates.status && updates.status !== existing.status) {
          get().addAuditLog('Delivery Update', 'project', `Project status changed: ${existing.status} -> ${updates.status}`, id);
        }
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id)
        }));
        get().addAuditLog('Project Deleted', 'project', `Permanently removed record: ${id}`);
      },

      addExpense: (data) => set(state => ({
        expenses: [...state.expenses, { ...data, id: crypto.randomUUID(), date: data.date || new Date().toISOString() }]
      })),

      deleteExpense: (id) => set(state => ({
        expenses: state.expenses.filter(e => e.id !== id)
      })),

      addUser: (username, pass, role) => {
        if (get().users.some(u => u.username === username)) return false;
        set(state => ({
          users: [...state.users, { id: crypto.randomUUID(), username, pass, role, createdAt: new Date().toISOString() }]
        }));
        get().addAuditLog('Account Created', 'user', `Staff account ${username} added with role ${role}.`);
        return true;
      },

      updateUser: (id, updates) => set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
      })),

      deleteUser: (id) => {
        set(state => ({ users: state.users.filter(u => u.id !== id) }));
        get().addAuditLog('Account Deleted', 'user', `User record ${id} removed.`);
      },

      addAuditLog: (action, category, details, projectId) => {
        const user = get().currentUser || get().currentCustomer;
        const newLog: AuditLog = {
          id: crypto.randomUUID(),
          action,
          category,
          details,
          userName: (user as User)?.username || (user as Customer)?.name || 'Guest',
          timestamp: new Date().toISOString(),
          projectId
        };
        set(state => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },

      clearAuditLogs: () => set({ auditLogs: [] }),

      sendMessage: (text) => {
        const user = get().currentUser || get().currentCustomer;
        if (!user) return;
        const newMessage: Message = {
          id: crypto.randomUUID(),
          text,
          senderId: (user as User)?.id || (user as Customer)?.id,
          senderName: (user as User)?.username || (user as Customer)?.name,
          timestamp: new Date().toISOString(),
        };
        set(state => ({ messages: [...state.messages, newMessage] }));
      },

      togglePaymentVisibility: () => set(state => ({ paymentVisibility: !state.paymentVisibility }))
    }),
    { name: 'mh-creationx-v24' }
  )
);
