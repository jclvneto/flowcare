import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Appointments from "@/pages/appointments";
import Patients from "@/pages/patients";
import Owners from "@/pages/owners";
import MedicalRecords from "@/pages/medical-records";
import Prescriptions from "@/pages/prescriptions";
import ClinicManagement from "@/pages/clinic-management";
import UserManagement from "@/pages/user-management";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import ProtectedRoute from "@/components/ui/protected-route";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/agendamentos" component={Appointments} />
            <Route path="/pacientes" component={Patients} />
            <Route path="/tutores" component={Owners} />
            <Route path="/prontuarios" component={MedicalRecords} />
            <Route path="/prescricoes" component={Prescriptions} />
            <ProtectedRoute path="/gestao-clinicas" component={ClinicManagement} allowedRoles={["ADMIN_MASTER"]} />
            <ProtectedRoute path="/gestao-usuarios" component={UserManagement} allowedRoles={["ADMIN_MASTER", "CLINIC_ADMIN"]} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
