import { useLocation } from "wouter";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    "/": "Dashboard",
    "/agendamentos": "Agendamentos",
    "/pacientes": "Pacientes",
    "/tutores": "Tutores",
    "/prontuarios": "Prontuários",
    "/prescricoes": "Prescrições",
    "/gestao-clinicas": "Gestão de Clínicas",
    "/gestao-usuarios": "Gestão de Usuários",
  };
  return routes[pathname] || "FlowCare";
};

const getBreadcrumb = (pathname: string) => {
  const breadcrumbs: Record<string, string> = {
    "/": "Início / Dashboard",
    "/agendamentos": "Início / Agendamentos",
    "/pacientes": "Início / Pacientes",
    "/tutores": "Início / Tutores",
    "/prontuarios": "Início / Prontuários",
    "/prescricoes": "Início / Prescrições",
    "/gestao-clinicas": "Início / Gestão de Clínicas",
    "/gestao-usuarios": "Início / Gestão de Usuários",
  };
  return breadcrumbs[pathname] || "Início";
};

export default function TopBar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getDisplayName = () => {
    if (!user) return "Usuário";
    if (user.name) return user.name;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email || "Usuário";
  };

  return (
    <header className="bg-card border-b border-border p-4 shadow-sm" data-testid="top-bar">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
            {getPageTitle(location)}
          </h2>
          <nav className="text-sm text-muted-foreground">
            <span data-testid="text-breadcrumb">{getBreadcrumb(location)}</span>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* TODO: Implement clinic selector for multi-tenant users */}
          {user?.globalRole === "ADMIN_MASTER" && (
            <select 
              className="bg-background border border-border rounded-md px-3 py-2 text-sm"
              data-testid="select-clinic"
            >
              <option>Selecionar Clínica</option>
            </select>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
              0
            </span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-foreground text-sm font-medium">
                      {getDisplayName().charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="menu-item-profile">
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem data-testid="menu-item-settings">
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.location.href = "/api/logout"}
                data-testid="menu-item-logout"
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
