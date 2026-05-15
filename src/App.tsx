import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';

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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Transactions" description="Transaction creation, editing, and filtering will be added next." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Budgets" description="Budget management screens will be added next." />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Savings Goals" description="Savings goal creation and progress tracking will be added next." />
          </ProtectedRoute>
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