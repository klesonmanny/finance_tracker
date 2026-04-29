import { Navigate, Route, Routes } from 'react-router-dom';
import { LayoutDashboard, LogIn, PiggyBank } from 'lucide-react';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AppShell } from './components/layout/AppShell';

function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <AppShell>
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
      </section>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route
        path="/transactions"
        element={
          <PlaceholderPage
            title="Transactions"
            description="This screen will host transaction creation, editing, and filtering once the Supabase data layer is wired in."
          />
        }
      />
      <Route
        path="/budgets"
        element={
          <PlaceholderPage
            title="Budgets"
            description="Budget management will live here, including category limits, remaining amounts, and threshold tracking."
          />
        }
      />
      <Route
        path="/goals"
        element={
          <PlaceholderPage
            title="Savings Goals"
            description="Savings goal creation and progress tracking will be added in the next implementation slice."
          />
        }
      />
      <Route
        path="*"
        element={
          <PlaceholderPage
            title="Not Found"
            description="The requested route does not exist yet."
          />
        }
      />
    </Routes>
  );
}