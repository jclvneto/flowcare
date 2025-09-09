import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, PawPrint, Dog, Cat, Bird } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PatientForm from "@/components/forms/patient-form";
import type { Patient } from "@shared/schema";

const speciesIcons = {
  DOG: Dog,
  CAT: Cat,
  BIRD: Bird,
  RABBIT: PawPrint,
  REPTILE: PawPrint,
  OTHER: PawPrint,
};

const speciesLabels = {
  DOG: "Cão",
  CAT: "Gato",
  BIRD: "Ave",
  RABBIT: "Coelho",
  REPTILE: "Réptil",
  OTHER: "Outro",
};

const sexLabels = {
  MALE: "Macho",
  FEMALE: "Fêmea",
  UNKNOWN: "Não informado",
};

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/clinics", clinicId, "patients", { search: searchQuery }],
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
        description: "Erro ao carregar pacientes",
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await apiRequest("DELETE", `/api/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "patients"] });
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso",
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
        description: "Erro ao excluir paciente",
        variant: "destructive",
      });
    },
  });

  const handleDeletePatient = (patientId: string) => {
    if (confirm("Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.")) {
      deletePatientMutation.mutate(patientId);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditDialogOpen(true);
  };

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return "Idade não informada";
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return `${age - 1} anos`;
    }
    return `${age} anos`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="patients-view">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os pacientes da clínica</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-patient">
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Paciente</DialogTitle>
            </DialogHeader>
            <PatientForm 
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "patients"] });
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
              placeholder="Buscar por nome, raça ou microchip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-patients"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Espécie/Raça</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Microchip</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!patients || patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-center text-muted-foreground">
                      <PawPrint className="mx-auto mb-2 h-12 w-12" />
                      <p>Nenhum paciente encontrado</p>
                      <p className="text-sm">Cadastre o primeiro paciente da clínica</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient: Patient) => {
                  const SpeciesIcon = speciesIcons[patient.species] || PawPrint;
                  return (
                    <TableRow key={patient.id} data-testid={`patient-row-${patient.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <SpeciesIcon className="text-primary h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {sexLabels[patient.sex]} • {patient.color || "Cor não informada"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground">{patient.owner?.name || "Tutor não informado"}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{speciesLabels[patient.species]}</p>
                          <p className="text-sm text-muted-foreground">{patient.breed || "Raça não informada"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground">{getAge(patient.birthDate)}</p>
                      </TableCell>
                      <TableCell>
                        {patient.microchip ? (
                          <Badge variant="outline">{patient.microchip}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPatient(patient)}
                            data-testid={`button-edit-${patient.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePatient(patient.id)}
                            disabled={deletePatientMutation.isPending}
                            data-testid={`button-delete-${patient.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <PatientForm 
              patient={selectedPatient}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedPatient(null);
                queryClient.invalidateQueries({ queryKey: ["/api/clinics", clinicId, "patients"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
