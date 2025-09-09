import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import OwnerForm from "@/components/forms/owner-form";
import type { Owner } from "@shared/schema";

export default function Owners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: owners, isLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId, "owners", { search: searchQuery }],
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
        description: "Erro ao carregar tutores",
        variant: "destructive",
      });
    },
  });

  const deleteOwnerMutation = useMutation({
    mutationFn: async (ownerId: string) => {
      await apiRequest("DELETE", `/api/owners/${ownerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "owners"] });
      toast({
        title: "Sucesso",
        description: "Tutor excluído com sucesso",
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
        description: "Erro ao excluir tutor",
        variant: "destructive",
      });
    },
  });

  const handleDeleteOwner = (ownerId: string) => {
    if (confirm("Tem certeza que deseja excluir este tutor? Esta ação não pode ser desfeita.")) {
      deleteOwnerMutation.mutate(ownerId);
    }
  };

  const handleEditOwner = (owner: Owner) => {
    setSelectedOwner(owner);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Tutores</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="owners-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Tutores</h1>
          <p className="text-muted-foreground">Gerencie os tutores dos pacientes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-owner">
              <Plus className="mr-2 h-4 w-4" />
              Novo Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Tutor</DialogTitle>
            </DialogHeader>
            <OwnerForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "owners"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-owners"
            />
          </div>
        </CardContent>
      </Card>

      {/* Owners List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Pacientes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!owners || owners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-12 w-12" />
                      <p>Nenhum tutor encontrado</p>
                      <p className="text-sm">Cadastre o primeiro tutor da clínica</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                owners.map((owner: Owner) => (
                  <TableRow key={owner.id} data-testid={`owner-row-${owner.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          <Users className="text-secondary h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{owner.name}</p>
                          {owner.notes && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {owner.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{owner.phone || "Não informado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{owner.email || "Não informado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        {owner.whatsappOptIn ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge variant="outline">Inativo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {owner.patients?.length || 0} pacientes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOwner(owner)}
                          data-testid={`button-edit-${owner.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOwner(owner.id)}
                          disabled={deleteOwnerMutation.isPending}
                          data-testid={`button-delete-${owner.id}`}
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

      {/* Edit Owner Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Tutor</DialogTitle>
          </DialogHeader>
          {selectedOwner && (
            <OwnerForm 
              owner={selectedOwner}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedOwner(null);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "owners"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
