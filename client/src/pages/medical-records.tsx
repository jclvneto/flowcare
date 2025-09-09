import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Edit, Eye, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import MedicalRecordForm from "@/components/forms/medical-record-form";
import type { Encounter } from "@shared/schema";

const statusLabels = {
  DRAFT: "Rascunho",
  CONFIRMED: "Confirmado",
};

const statusColors = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
};

export default function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: encounters, isLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId, "encounters"],
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
        description: "Erro ao carregar prontuários",
        variant: "destructive",
      });
    },
  });

  const handleViewEncounter = (encounter: Encounter) => {
    setSelectedEncounter(encounter);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Prontuários</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="medical-records-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Prontuários</h1>
          <p className="text-muted-foreground">Gerencie os prontuários eletrônicos</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-encounter">
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Consulta</DialogTitle>
            </DialogHeader>
            <MedicalRecordForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "encounters"] });
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
              placeholder="Buscar por paciente, tutor ou veterinário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-encounters"
            />
          </div>
        </CardContent>
      </Card>

      {/* Encounters List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Veterinário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!encounters || encounters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 h-12 w-12" />
                      <p>Nenhum prontuário encontrado</p>
                      <p className="text-sm">Crie a primeira consulta</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                encounters.map((encounter: Encounter) => (
                  <TableRow key={encounter.id} data-testid={`encounter-row-${encounter.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Stethoscope className="text-primary h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{encounter.patient?.name || "Paciente não informado"}</p>
                          <p className="text-sm text-muted-foreground">{encounter.patient?.breed || "Raça não informada"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-foreground">{encounter.patient?.owner?.name || "Tutor não informado"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-foreground">{encounter.provider?.name || "Veterinário não informado"}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {encounter.createdAt ? formatDate(encounter.createdAt) : "Data não informada"}
                        </p>
                        {encounter.signedAt && (
                          <p className="text-sm text-muted-foreground">
                            Assinado: {formatDate(encounter.signedAt)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[encounter.status]}>
                        {statusLabels[encounter.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEncounter(encounter)}
                          data-testid={`button-view-${encounter.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {encounter.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-edit-${encounter.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Encounter Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Prontuário</DialogTitle>
          </DialogHeader>
          {selectedEncounter && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-6">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                      <Stethoscope className="text-primary text-3xl" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Paciente</p>
                        <p className="font-semibold text-foreground">{selectedEncounter.patient?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedEncounter.patient?.breed} • {selectedEncounter.patient?.sex}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tutor</p>
                        <p className="font-semibold text-foreground">{selectedEncounter.patient?.owner?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedEncounter.patient?.owner?.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Veterinário</p>
                        <p className="font-semibold text-foreground">{selectedEncounter.provider?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedEncounter.createdAt ? formatDate(selectedEncounter.createdAt) : "Data não informada"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Record Details */}
              <div className="grid grid-cols-1 gap-6">
                {selectedEncounter.chiefComplaint && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-2">Queixa Principal</h4>
                      <p className="text-muted-foreground">{JSON.stringify(selectedEncounter.chiefComplaint)}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedEncounter.historyPresent && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-2">História da Doença Atual</h4>
                      <p className="text-muted-foreground">{JSON.stringify(selectedEncounter.historyPresent)}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedEncounter.physicalExam && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-2">Exame Físico</h4>
                      <p className="text-muted-foreground">{JSON.stringify(selectedEncounter.physicalExam)}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedEncounter.diagnosis && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-2">Diagnóstico</h4>
                      <p className="text-muted-foreground">{JSON.stringify(selectedEncounter.diagnosis)}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedEncounter.plan && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-2">Plano Terapêutico</h4>
                      <p className="text-muted-foreground">{JSON.stringify(selectedEncounter.plan)}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
