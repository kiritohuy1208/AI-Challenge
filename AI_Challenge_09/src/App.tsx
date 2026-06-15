import { FilterProvider } from './context/FilterContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingSkeleton } from './components/layout/LoadingSkeleton';
import { useClaimsData } from './hooks/useClaimsData';

function DashboardShell() {
  const { claims, isLoading, error } = useClaimsData();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-zinc-50 px-4">
        <div className="dashboard-state dashboard-state-error" role="alert">
          <p className="dashboard-state-title">Unable to load dashboard</p>
          <p className="dashboard-state-subtitle">{error}</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout claims={claims} />;
}

function App() {
  return (
    <FilterProvider>
      <DashboardShell />
    </FilterProvider>
  );
}

export default App;
