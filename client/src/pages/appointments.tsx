import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, List, Edit, Play, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import AppointmentForm from "@/components/forms/appointment-form";

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  NO_SHOW: "bg-gray-100 text-gray-800",
};

const statusLabels = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
  NO_SHOW: "Faltou",
};

export default function Appointments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId, "appointments"],
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
        description: "Erro ao carregar agendamentos",
        variant: "destructive",
      });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      await apiRequest("DELETE", `/api/appointments/${appointmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "appointments"] });
      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso",
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
        description: "Erro ao cancelar agendamento",
        variant: "destructive",
      });
    },
  });

  const handleCancelAppointment = (appointmentId: string) => {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Agendamentos</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="appointments-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-appointment">
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <AppointmentForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "appointments"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por paciente, tutor ou veterinário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-appointments"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
                <SelectItem value="COMPLETED">Concluído</SelectItem>
                <SelectItem value="NO_SHOW">Faltou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-48" data-testid="select-provider-filter">
                <SelectValue placeholder="Todos os Veterinários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Veterinários</SelectItem>
                {/* TODO: Load actual providers */}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-40"
              data-testid="input-date-filter"
            />
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          onClick={() => setViewMode("list")}
          className="flex items-center"
          data-testid="button-list-view"
        >
          <List className="mr-2 h-4 w-4" />
          Lista
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          onClick={() => setViewMode("calendar")}
          className="flex items-center"
          data-testid="button-calendar-view"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Calendário
        </Button>
      </div>

      {/* Appointments List */}
      {viewMode === "list" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Veterinário</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!appointments || appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-center text-muted-foreground">
                        <Calendar className="mx-auto mb-2 h-12 w-12" />
                        <p>Nenhum agendamento encontrado</p>
                        <p className="text-sm">Crie seu primeiro agendamento</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment: any) => (
                    <TableRow key={appointment.id} data-testid={`appointment-row-${appointment.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {/* TODO: Add pet type icon based on species */}
                            <span className="text-primary text-sm">🐾</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{appointment.patient?.name || "Nome não disponível"}</p>
                            <p className="text-sm text-muted-foreground">{appointment.patient?.breed || "Raça não informada"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{appointment.owner?.name || "Nome não disponível"}</p>
                          <p className="text-sm text-muted-foreground">{appointment.owner?.phone || "Telefone não informado"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground">{appointment.provider?.name || "Veterinário não informado"}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {appointment.startsAt ? new Date(appointment.startsAt).toLocaleDateString('pt-BR') : "Data não informada"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.startsAt && appointment.endsAt 
                              ? `${new Date(appointment.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(appointment.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : "Horário não informado"
                            }
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                          {statusLabels[appointment.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-edit-${appointment.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {appointment.status === "CONFIRMED" && (
                            <Button variant="ghost" size="sm" data-testid={`button-start-${appointment.id}`}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={deleteAppointmentMutation.isPending}
                            data-testid={`button-cancel-${appointment.id}`}
                          >
                            <X className="h-4 w-4" />
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
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card className="p-6">
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-12 w-12" />
              <p>Visualização em calendário</p>
              <p className="text-sm">Em desenvolvimento</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
