import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertEncounterSchema, type InsertEncounter, type Encounter } from "@shared/schema";

interface MedicalRecordFormProps {
  encounter?: Encounter;
  onSuccess?: () => void;
}

export default function MedicalRecordForm({ encounter, onSuccess }: MedicalRecordFormProps) {
  const { toast } = useToast();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: patients } = useQuery({
    queryKey: ["/api/clinics", clinicId, "patients"],
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
      }
    },
  });

  // TODO: Load actual veterinarians from clinic memberships
  const veterinarians = [
    { id: "vet-1", name: "Dr. João Silva" },
    { id: "vet-2", name: "Dra. Maria Santos" },
  ];

  const form = useForm<InsertEncounter>({
    resolver: zodResolver(insertEncounterSchema),
    defaultValues: encounter ? {
      clinicId: encounter.clinicId,
      appointmentId: encounter.appointmentId || "",
      patientId: encounter.patientId,
      providerId: encounter.providerId,
      status: encounter.status,
      chiefComplaint: encounter.chiefComplaint || {},
      historyPresent: encounter.historyPresent || {},
      physicalExam: encounter.physicalExam || {},
      diagnosis: encounter.diagnosis || {},
      plan: encounter.plan || {},
      vitals: encounter.vitals || {},
      rawText: encounter.rawText || "",
    } : {
      clinicId,
      appointmentId: "",
      patientId: "",
      providerId: "",
      status: "DRAFT",
      chiefComplaint: {},
      historyPresent: {},
      physicalExam: {},
      diagnosis: {},
      plan: {},
      vitals: {},
      rawText: "",
    },
  });

  const createEncounterMutation = useMutation({
    mutationFn: async (data: InsertEncounter) => {
      // Convert form data to proper format for API
      const encounterData = {
        ...data,
        chiefComplaint: data.chiefComplaint || {},
        historyPresent: data.historyPresent || {},
        physicalExam: data.physicalExam || {},
        diagnosis: data.diagnosis || {},
        plan: data.plan || {},
        vitals: data.vitals || {},
      };

      if (encounter) {
        await apiRequest("PUT", `/api/encounters/${encounter.id}`, encounterData);
      } else {
        await apiRequest("POST", "/api/encounters", encounterData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: encounter ? "Consulta atualizada com sucesso" : "Consulta criada com sucesso",
      });
      onSuccess?.();
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
        description: encounter ? "Erro ao atualizar consulta" : "Erro ao criar consulta",
        variant: "destructive",
      });
    },
  });

  const confirmEncounterMutation = useMutation({
    mutationFn: async (data: InsertEncounter) => {
      const encounterData = {
        ...data,
        status: "CONFIRMED" as const,
        signedAt: new Date(),
        chiefComplaint: data.chiefComplaint || {},
        historyPresent: data.historyPresent || {},
        physicalExam: data.physicalExam || {},
        diagnosis: data.diagnosis || {},
        plan: data.plan || {},
        vitals: data.vitals || {},
      };

      if (encounter) {
        await apiRequest("PUT", `/api/encounters/${encounter.id}`, encounterData);
      } else {
        await apiRequest("POST", "/api/encounters", encounterData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Consulta finalizada com sucesso",
      });
      onSuccess?.();
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
        description: "Erro ao finalizar consulta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEncounter) => {
    createEncounterMutation.mutate(data);
  };

  const onConfirm = (data: InsertEncounter) => {
    confirmEncounterMutation.mutate(data);
  };

  // Helper functions to handle JSON fields as strings for form inputs
  const getStringValue = (jsonField: any, key: string) => {
    if (!jsonField || typeof jsonField !== 'object') return '';
    return jsonField[key] || '';
  };

  const setStringValue = (currentValue: any, key: string, newValue: string) => {
    const current = currentValue || {};
    return { ...current, [key]: newValue };
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Patient and Provider Selection */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Informações da Consulta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-patient">
                          <SelectValue placeholder="Selecione o paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients?.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name} - {patient.owner?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veterinário *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-provider">
                          <SelectValue placeholder="Selecione o veterinário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {veterinarians.map((vet) => (
                          <SelectItem key={vet.id} value={vet.id}>
                            {vet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Chief Complaint */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Queixa Principal</h3>
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Queixa Principal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a queixa principal do tutor..."
                      value={getStringValue(field.value, 'description')}
                      onChange={(e) => field.onChange(setStringValue(field.value, 'description', e.target.value))}
                      rows={3}
                      data-testid="textarea-chief-complaint"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* History of Present Illness */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">História da Doença Atual</h3>
            <FormField
              control={form.control}
              name="historyPresent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>História Detalhada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Histórico detalhado da condição atual..."
                      value={getStringValue(field.value, 'description')}
                      onChange={(e) => field.onChange(setStringValue(field.value, 'description', e.target.value))}
                      rows={4}
                      data-testid="textarea-history-present"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Vitals and Physical Examination */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Exame Físico</h3>
            
            {/* Vitals */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <FormField
                control={form.control}
                name="vitals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="37.5"
                        value={getStringValue(field.value, 'temperature')}
                        onChange={(e) => field.onChange(setStringValue(field.value, 'temperature', e.target.value))}
                        data-testid="input-temperature"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vitals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="5.2"
                        value={getStringValue(field.value, 'weight')}
                        onChange={(e) => field.onChange(setStringValue(field.value, 'weight', e.target.value))}
                        data-testid="input-weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vitals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC (bpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="120"
                        value={getStringValue(field.value, 'heartRate')}
                        onChange={(e) => field.onChange(setStringValue(field.value, 'heartRate', e.target.value))}
                        data-testid="input-heart-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vitals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FR (rpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        value={getStringValue(field.value, 'respiratoryRate')}
                        onChange={(e) => field.onChange(setStringValue(field.value, 'respiratoryRate', e.target.value))}
                        data-testid="input-respiratory-rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="physicalExam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Exame Físico</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do exame físico..."
                      value={getStringValue(field.value, 'description')}
                      onChange={(e) => field.onChange(setStringValue(field.value, 'description', e.target.value))}
                      rows={4}
                      data-testid="textarea-physical-exam"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Diagnóstico</h3>
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico Clínico</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Diagnóstico clínico..."
                      value={getStringValue(field.value, 'description')}
                      onChange={(e) => field.onChange(setStringValue(field.value, 'description', e.target.value))}
                      rows={3}
                      data-testid="textarea-diagnosis"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Treatment Plan */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Plano Terapêutico</h3>
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Tratamento e Recomendações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Plano de tratamento e recomendações..."
                      value={getStringValue(field.value, 'description')}
                      onChange={(e) => field.onChange(setStringValue(field.value, 'description', e.target.value))}
                      rows={4}
                      data-testid="textarea-plan"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={createEncounterMutation.isPending}
            data-testid="button-save-draft"
          >
            {createEncounterMutation.isPending ? "Salvando..." : "Salvar Rascunho"}
          </Button>
          <Button
            type="button"
            onClick={() => form.handleSubmit(onConfirm)()}
            disabled={confirmEncounterMutation.isPending}
            data-testid="button-finalize-encounter"
          >
            {confirmEncounterMutation.isPending ? "Finalizando..." : "Finalizar Consulta"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
