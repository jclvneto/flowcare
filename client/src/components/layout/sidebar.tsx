import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Calendar, 
  PawPrint, 
  Users, 
  FileText, 
  PillBottle, 
  Building2, 
  UserCog, 
  Settings, 
  LogOut,
  Heart 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3, roles: ["ADMIN_MASTER", "CLINIC_ADMIN", "RECEPTIONIST", "VETERINARIAN"] },
  { name: "Agendamentos", href: "/agendamentos", icon: Calendar, roles: ["ADMIN_MASTER", "CLINIC_ADMIN", "RECEPTIONIST", "VETERINARIAN"] },
  { name: "Pacientes", href: "/pacientes", icon: PawPrint, roles: ["ADMIN_MASTER", "CLINIC_ADMIN", "RECEPTIONIST", "VETERINARIAN"] },
  { name: "Tutores", href: "/tutores", icon: Users, roles: ["ADMIN_MASTER", "CLINIC_ADMIN", "RECEPTIONIST", "VETERINARIAN"] },
  { name: "Prontuários", href: "/prontuarios", icon: FileText, roles: ["ADMIN_MASTER", "CLINIC_ADMIN", "VETERINARIAN"] },
  { name: "Prescrições", href: "/prescricoes", icon: PillBottle, roles: ["ADMIN_MASTER", "CLINIC_ADMIN", "VETERINARIAN"] },
];

const adminNavigation = [
  { name: "Gestão de Clínicas", href: "/gestao-clinicas", icon: Building2, roles: ["ADMIN_MASTER"] },
  { name: "Gestão de Usuários", href: "/gestao-usuarios", icon: UserCog, roles: ["ADMIN_MASTER", "CLINIC_ADMIN"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const hasRole = (requiredRoles: string[]) => {
    if (!user) return false;
    return requiredRoles.includes(user.globalRole) || requiredRoles.includes("USER");
  };

  const getDisplayName = () => {
    if (!user) return "Usuário";
    if (user.name) return user.name;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email || "Usuário";
  };

  const getUserRole = () => {
    if (!user) return "";
    if (user.globalRole === "ADMIN_MASTER") return "Admin Master";
    // TODO: Get clinic role from membership
    return "Usuário";
  };

  return (
    <div className="w-64 sidebar text-white shadow-lg" data-testid="sidebar">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Heart className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">FlowCare</h1>
            <p className="text-sm opacity-80">Clínica Veterinária</p>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {getDisplayName().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-sm" data-testid="text-user-name">{getDisplayName()}</p>
              <p className="text-xs opacity-80" data-testid="text-user-role">{getUserRole()}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            if (!hasRole(item.roles)) return null;
            
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "hover:bg-white/10 text-white/80 hover:text-white"
                  )}
                  data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}

          {/* Admin-only sections */}
          {adminNavigation.some(item => hasRole(item.roles)) && (
            <div className="pt-4 border-t border-white/20">
              {adminNavigation.map((item) => {
                if (!hasRole(item.roles)) return null;
                
                const isActive = location === item.href;
                const Icon = item.icon;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-white/20 text-white"
                          : "hover:bg-white/10 text-white/80 hover:text-white"
                      )}
                      data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/20">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configurações
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
}
