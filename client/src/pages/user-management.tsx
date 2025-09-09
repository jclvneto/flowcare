import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCog, Edit, Trash2, Users, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import type { ClinicMembership } from "@shared/schema";

const roleLabels = {
  CLINIC_ADMIN: "Admin da Clínica",
  RECEPTIONIST: "Recepcionista",
  VETERINARIAN: "Veterinário",
};

const roleColors = {
  CLINIC_ADMIN: "bg-purple-100 text-purple-800",
  RECEPTIONIST: "bg-blue-100 text-blue-800",
  VETERINARIAN: "bg-green-100 text-green-800",
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedClinic, setSelectedClinic] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: clinics } = useQuery({
    queryKey: ["/api/clinics"],
    enabled: user?.globalRole === "ADMIN_MASTER",
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: memberships, isLoading } = useQuery({
    queryKey: user?.globalRole === "ADMIN_MASTER" 
      ? ["/api/clinic-memberships"] 
      : ["/api/clinics", clinicId, "memberships"],
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      // TODO: Implement delete membership API call
      throw new Error("API not implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinic-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "memberships"] });
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi desconectado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao remover usuário",
        variant: "destructive",
      });
    },
  });

  const handleDeleteMembership = (membershipId: string) => {
    if (confirm("Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.")) {
      deleteMembershipMutation.mutate(membershipId);
    }
  };

  const filteredMemberships = memberships?.filter((membership: ClinicMembership) => {
    const matchesSearch = !searchQuery || 
      membership.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membership.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || membership.role === roleFilter;
    const matchesClinic = selectedClinic === "all" || membership.clinicId === selectedClinic;
    
    return matchesSearch && matchesRole && matchesClinic;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            {user?.globalRole === "ADMIN_MASTER" 
              ? "Gerencie usuários de todas as clínicas" 
              : "Gerencie usuários da sua clínica"
            }
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-invite-user">
          <Plus className="mr-2 h-4 w-4" />
          Convidar Usuário
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
            </div>
            {user?.globalRole === "ADMIN_MASTER" && clinics && (
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger className="w-48" data-testid="select-clinic-filter">
                  <SelectValue placeholder="Todas as Clínicas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Clínicas</SelectItem>
                  {clinics.map((clinic: any) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48" data-testid="select-role-filter">
                <SelectValue placeholder="Todas as Funções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Funções</SelectItem>
                <SelectItem value="CLINIC_ADMIN">Admin da Clínica</SelectItem>
                <SelectItem value="RECEPTIONIST">Recepcionista</SelectItem>
                <SelectItem value="VETERINARIAN">Veterinário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                {user?.globalRole === "ADMIN_MASTER" && <TableHead>Clínica</TableHead>}
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredMemberships || filteredMemberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.globalRole === "ADMIN_MASTER" ? 5 : 4} className="text-center py-8">
                    <div className="text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-12 w-12" />
                      <p>Nenhum usuário encontrado</p>
                      <p className="text-sm">Convide o primeiro usuário</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMemberships.map((membership: ClinicMembership) => (
                  <TableRow key={membership.id} data-testid={`user-row-${membership.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          {membership.user?.profileImageUrl ? (
                            <img
                              src={membership.user.profileImageUrl}
                              alt="Profile"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <UserCog className="text-secondary h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {membership.user?.name || 
                             (membership.user?.firstName && membership.user?.lastName 
                               ? `${membership.user.firstName} ${membership.user.lastName}`
                               : membership.user?.firstName || "Nome não informado"
                             )
                            }
                          </p>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{membership.user?.email || "E-mail não informado"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {user?.globalRole === "ADMIN_MASTER" && (
                      <TableCell>
                        <p className="text-foreground">{membership.clinic?.name || "Clínica não informada"}</p>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge className={roleColors[membership.role]}>
                        {roleLabels[membership.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {membership.active ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-${membership.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMembership(membership.id)}
                          disabled={deleteMembershipMutation.isPending}
                          data-testid={`button-remove-${membership.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
