
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProjectForm from './components/ProjectForm';
import ClientPortal from './components/ClientPortal';
import CustomerManagement from './components/CustomerManagement';
import UserManagement from './components/UserManagement';
import FinanceHub from './components/FinanceHub';
import MonthlyAccounting from './components/MonthlyAccounting';
import CashMemo from './components/CashMemo';
import AuditTrail from './components/AuditTrail';
import Analytics from './components/Analytics';
import { useAppStore } from './store';
import { motion, AnimatePresence } from 'framer-motion';

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { isAuthenticated, authType, currentUser } = useAppStore();
  if (!isAuthenticated || authType !== 'staff' || currentUser?.role !== 'Admin') return <Navigate to="/" />;
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Dashboard />} />
          <Route path="/add" element={<AdminRoute><ProjectForm /></AdminRoute>} />
          <Route path="/edit/:projectId" element={<AdminRoute><ProjectForm /></AdminRoute>} />
          <Route path="/customers" element={<AdminRoute><CustomerManagement /></AdminRoute>} />
          <Route path="/finance" element={<AdminRoute><FinanceHub /></AdminRoute>} />
          <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
          <Route path="/audit" element={<AdminRoute><AuditTrail /></AdminRoute>} />
          <Route path="/voucher" element={<AdminRoute><MonthlyAccounting /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/cash-memo/:projectId" element={<CashMemo />} />
          <Route path="/project/:projectId/:secureToken" element={<ClientPortal />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
};

export default App;
