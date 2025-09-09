import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, PillBottle, Eye, Download, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PrescriptionForm from "@/components/forms/prescription-form";
import type { Prescription, PrescriptionItem } from "@shared/schema";

export default function Prescriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId, "prescriptions"],
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
        description: "Erro ao carregar prescrições",
        variant: "destructive",
      });
    },
  });

  const { data: prescriptionItems } = useQuery({
    queryKey: ["/api/prescriptions", selectedPrescription?.id, "items"],
    enabled: !!selectedPrescription?.id,
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

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
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
          <h1 className="text-2xl font-bold text-foreground">Prescrições</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="prescriptions-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Prescrições</h1>
          <p className="text-muted-foreground">Gerencie as prescrições médicas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-prescription">
              <Plus className="mr-2 h-4 w-4" />
              Nova Prescrição
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Prescrição</DialogTitle>
            </DialogHeader>
            <PrescriptionForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "prescriptions"] });
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
              data-testid="input-search-prescriptions"
            />
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Veterinário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!prescriptions || prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center text-muted-foreground">
                      <PillBottle className="mx-auto mb-2 h-12 w-12" />
                      <p>Nenhuma prescrição encontrada</p>
                      <p className="text-sm">Crie a primeira prescrição</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((prescription: Prescription) => (
                  <TableRow key={prescription.id} data-testid={`prescription-row-${prescription.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                          <PillBottle className="text-accent h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{prescription.patient?.name || "Paciente não informado"}</p>
                          <p className="text-sm text-muted-foreground">{prescription.patient?.breed || "Raça não informada"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-foreground">{prescription.patient?.owner?.name || "Tutor não informado"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-foreground">{prescription.provider?.name || "Veterinário não informado"}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {prescription.createdAt ? formatDate(prescription.createdAt) : "Data não informada"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {prescription.sendToWhatsapp ? (
                        <Badge className="bg-green-100 text-green-800">Será enviado</Badge>
                      ) : (
                        <Badge variant="outline">Não enviar</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPrescription(prescription)}
                          data-testid={`button-view-${prescription.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {prescription.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-download-${prescription.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {prescription.sendToWhatsapp && (
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-send-${prescription.id}`}
                          >
                            <Send className="h-4 w-4" />
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

      {/* View Prescription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizar Prescrição</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Patient Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-6">
                    <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center">
                      <PillBottle className="text-accent text-3xl" />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Paciente</p>
                        <p className="font-semibold text-foreground">{selectedPrescription.patient?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPrescription.patient?.breed} • {selectedPrescription.patient?.sex}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tutor</p>
                        <p className="font-semibold text-foreground">{selectedPrescription.patient?.owner?.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedPrescription.patient?.owner?.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Veterinário</p>
                        <p className="font-semibold text-foreground">{selectedPrescription.provider?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPrescription.createdAt ? formatDate(selectedPrescription.createdAt) : "Data não informada"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prescription Items */}
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-foreground mb-4">Medicamentos Prescritos</h4>
                  <div className="space-y-4">
                    {!prescriptionItems || prescriptionItems.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Nenhum medicamento prescrito</p>
                    ) : (
                      prescriptionItems.map((item: PrescriptionItem, index: number) => (
                        <div key={item.id} className="border border-border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Medicamento</p>
                              <p className="font-medium text-foreground">{item.drugName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Dosagem</p>
                              <p className="text-foreground">{item.dosage || "Não informada"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Frequência</p>
                              <p className="text-foreground">{item.frequency || "Não informada"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Duração</p>
                              <p className="text-foreground">{item.duration || "Não informada"}</p>
                            </div>
                          </div>
                          {item.route && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">Via de administração</p>
                              <p className="text-foreground">{item.route}</p>
                            </div>
                          )}
                          {item.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-muted-foreground">Observações</p>
                              <p className="text-foreground">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedPrescription.notes && (
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-foreground mb-2">Observações Gerais</h4>
                    <p className="text-muted-foreground">{selectedPrescription.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
