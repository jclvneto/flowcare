import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const hasPermission = allowedRoles.includes(user.globalRole);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
