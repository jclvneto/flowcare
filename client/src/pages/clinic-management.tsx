import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Building2, Edit, Trash2, MapPin, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertClinicSchema, type Clinic, type InsertClinic } from "@shared/schema";

export default function ClinicManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clinics, isLoading } = useQuery({
    queryKey: ["/api/clinics"],
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
        description: "Erro ao carregar clínicas",
        variant: "destructive",
      });
    },
  });

  const createClinicMutation = useMutation({
    mutationFn: async (data: InsertClinic) => {
      await apiRequest("POST", "/api/clinics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Clínica criada com sucesso",
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
        description: "Erro ao criar clínica",
        variant: "destructive",
      });
    },
  });

  const updateClinicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertClinic> }) => {
      await apiRequest("PUT", `/api/clinics/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      setIsEditDialogOpen(false);
      setSelectedClinic(null);
      toast({
        title: "Sucesso",
        description: "Clínica atualizada com sucesso",
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
        description: "Erro ao atualizar clínica",
        variant: "destructive",
      });
    },
  });

  const deleteClinicMutation = useMutation({
    mutationFn: async (clinicId: string) => {
      await apiRequest("DELETE", `/api/clinics/${clinicId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics"] });
      toast({
        title: "Sucesso",
        description: "Clínica desativada com sucesso",
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
        description: "Erro ao desativar clínica",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<InsertClinic>({
    resolver: zodResolver(insertClinicSchema),
    defaultValues: {
      name: "",
      legalName: "",
      whatsappNumber: "",
      feedbackFormUrl: "",
      country: "BR",
      state: "",
      city: "",
      addressLine: "",
      zip: "",
      active: true,
    },
  });

  const editForm = useForm<InsertClinic>({
    resolver: zodResolver(insertClinicSchema),
    defaultValues: {
      name: "",
      legalName: "",
      whatsappNumber: "",
      feedbackFormUrl: "",
      country: "BR",
      state: "",
      city: "",
      addressLine: "",
      zip: "",
      active: true,
    },
  });

  const handleCreateClinic = (data: InsertClinic) => {
    createClinicMutation.mutate(data);
  };

  const handleEditClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    editForm.reset({
      name: clinic.name,
      legalName: clinic.legalName || "",
      whatsappNumber: clinic.whatsappNumber || "",
      feedbackFormUrl: clinic.feedbackFormUrl || "",
      country: clinic.country || "BR",
      state: clinic.state || "",
      city: clinic.city || "",
      addressLine: clinic.addressLine || "",
      zip: clinic.zip || "",
      active: clinic.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateClinic = (data: InsertClinic) => {
    if (selectedClinic) {
      updateClinicMutation.mutate({ id: selectedClinic.id, data });
    }
  };

  const handleDeleteClinic = (clinicId: string) => {
    if (confirm("Tem certeza que deseja desativar esta clínica? Esta ação pode ser revertida.")) {
      deleteClinicMutation.mutate(clinicId);
    }
  };

  const filteredClinics = clinics?.filter((clinic: Clinic) =>
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clinic.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Gestão de Clínicas</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="clinic-management-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Gestão de Clínicas</h1>
          <p className="text-muted-foreground">Gerencie todas as clínicas do sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-clinic">
              <Plus className="mr-2 h-4 w-4" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Clínica</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateClinic)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Clínica *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da clínica" {...field} data-testid="input-clinic-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="legalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razão Social</FormLabel>
                        <FormControl>
                          <Input placeholder="Razão social" {...field} data-testid="input-clinic-legal-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} data-testid="input-clinic-whatsapp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="feedbackFormUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Formulário Feedback</FormLabel>
                        <FormControl>
                          <Input placeholder="https://forms.google.com/..." {...field} data-testid="input-clinic-feedback-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} data-testid="input-clinic-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" {...field} data-testid="input-clinic-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="addressLine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, bairro" {...field} data-testid="input-clinic-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClinicMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createClinicMutation.isPending ? "Criando..." : "Criar Clínica"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-clinics"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clinics List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredClinics || filteredClinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-center text-muted-foreground">
                      <Building2 className="mx-auto mb-2 h-12 w-12" />
                      <p>Nenhuma clínica encontrada</p>
                      <p className="text-sm">Cadastre a primeira clínica do sistema</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClinics.map((clinic: Clinic) => (
                  <TableRow key={clinic.id} data-testid={`clinic-row-${clinic.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building2 className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{clinic.name}</p>
                          {clinic.legalName && (
                            <p className="text-sm text-muted-foreground">{clinic.legalName}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-foreground">
                            {clinic.city && clinic.state ? `${clinic.city}, ${clinic.state}` : "Localização não informada"}
                          </p>
                          {clinic.addressLine && (
                            <p className="text-sm text-muted-foreground">{clinic.addressLine}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{clinic.whatsappNumber || "Não informado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {clinic.active ? (
                        <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                      ) : (
                        <Badge variant="outline">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClinic(clinic)}
                          data-testid={`button-edit-${clinic.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClinic(clinic.id)}
                          disabled={deleteClinicMutation.isPending}
                          data-testid={`button-delete-${clinic.id}`}
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

      {/* Edit Clinic Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateClinic)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Clínica *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da clínica" {...field} data-testid="input-edit-clinic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Razão social" {...field} data-testid="input-edit-clinic-legal-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} data-testid="input-edit-clinic-whatsapp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="feedbackFormUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Formulário Feedback</FormLabel>
                      <FormControl>
                        <Input placeholder="https://forms.google.com/..." {...field} data-testid="input-edit-clinic-feedback-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} data-testid="input-edit-clinic-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" {...field} data-testid="input-edit-clinic-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="addressLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro" {...field} data-testid="input-edit-clinic-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateClinicMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {updateClinicMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
