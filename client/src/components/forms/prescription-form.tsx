import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertPrescriptionSchema, insertPrescriptionItemSchema, type InsertPrescription, type Prescription } from "@shared/schema";
import { z } from "zod";

const prescriptionFormSchema = insertPrescriptionSchema.extend({
  items: z.array(insertPrescriptionItemSchema).min(1, "Adicione pelo menos um medicamento"),
});

type PrescriptionFormData = z.infer<typeof prescriptionFormSchema>;

interface PrescriptionFormProps {
  prescription?: Prescription;
  onSuccess?: () => void;
}

export default function PrescriptionForm({ prescription, onSuccess }: PrescriptionFormProps) {
  const { toast } = useToast();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: encounters } = useQuery({
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
      }
    },
  });

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

  const form = useForm<PrescriptionFormData>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: {
      clinicId,
      encounterId: "",
      patientId: "",
      providerId: "",
      notes: "",
      sendToWhatsapp: true,
      items: [
        {
          drugName: "",
          dosage: "",
          frequency: "",
          duration: "",
          route: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionFormData) => {
      // First create the prescription
      const prescriptionData = {
        clinicId: data.clinicId,
        encounterId: data.encounterId,
        patientId: data.patientId,
        providerId: data.providerId,
        notes: data.notes,
        sendToWhatsapp: data.sendToWhatsapp,
      };

      let prescriptionResponse;
      if (prescription) {
        prescriptionResponse = await apiRequest("PUT", `/api/prescriptions/${prescription.id}`, prescriptionData);
      } else {
        prescriptionResponse = await apiRequest("POST", "/api/prescriptions", prescriptionData);
      }

      const prescriptionResult = await prescriptionResponse.json();

      // Then create prescription items
      for (const item of data.items) {
        if (item.drugName.trim()) {
          const itemData = {
            prescriptionId: prescriptionResult.id,
            drugName: item.drugName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            route: item.route,
            notes: item.notes,
          };
          await apiRequest("POST", "/api/prescription-items", itemData);
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: prescription ? "Prescrição atualizada com sucesso" : "Prescrição criada com sucesso",
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
        description: prescription ? "Erro ao atualizar prescrição" : "Erro ao criar prescrição",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrescriptionFormData) => {
    createPrescriptionMutation.mutate(data);
  };

  const addPrescriptionItem = () => {
    append({
      drugName: "",
      dosage: "",
      frequency: "",
      duration: "",
      route: "",
      notes: "",
    });
  };

  const removePrescriptionItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Informações da Prescrição</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="encounterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consulta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-encounter">
                          <SelectValue placeholder="Selecione a consulta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {encounters?.map((encounter: any) => (
                          <SelectItem key={encounter.id} value={encounter.id}>
                            {encounter.patient?.name} - {encounter.createdAt ? new Date(encounter.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
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

              <FormField
                control={form.control}
                name="sendToWhatsapp"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-send-whatsapp"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enviar via WhatsApp</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        A prescrição será enviada automaticamente para o tutor via WhatsApp
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescription Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Medicamentos</h3>
              <Button
                type="button"
                variant="outline"
                onClick={addPrescriptionItem}
                className="flex items-center"
                data-testid="button-add-medication"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Medicamento
              </Button>
            </div>

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground">Medicamento {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrescriptionItem(index)}
                        data-testid={`button-remove-medication-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.drugName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Medicamento *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do medicamento"
                              {...field}
                              data-testid={`input-drug-name-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.dosage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dosagem</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="20mg, 1 comprimido"
                              {...field}
                              data-testid={`input-dosage-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.frequency`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2x ao dia, 8/8h"
                              {...field}
                              data-testid={`input-frequency-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.duration`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duração</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="7 dias, 2 semanas"
                              {...field}
                              data-testid={`input-duration-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.route`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Via de Administração</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid={`select-route-${index}`}>
                                <SelectValue placeholder="Selecione a via" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="VO">Via Oral (VO)</SelectItem>
                              <SelectItem value="IM">Intramuscular (IM)</SelectItem>
                              <SelectItem value="SC">Subcutânea (SC)</SelectItem>
                              <SelectItem value="IV">Intravenosa (IV)</SelectItem>
                              <SelectItem value="TOP">Tópica (TOP)</SelectItem>
                              <SelectItem value="OFT">Oftálmica (OFT)</SelectItem>
                              <SelectItem value="OTO">Otológica (OTO)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Instruções Específicas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Instruções específicas para este medicamento..."
                            {...field}
                            rows={2}
                            data-testid={`textarea-medication-notes-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* General Notes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Observações Gerais</h3>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações gerais sobre a prescrição..."
                      {...field}
                      rows={3}
                      data-testid="textarea-general-notes"
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
            type="submit"
            disabled={createPrescriptionMutation.isPending}
            data-testid="button-save-prescription"
          >
            {createPrescriptionMutation.isPending 
              ? (prescription ? "Salvando..." : "Criando...") 
              : (prescription ? "Salvar Alterações" : "Criar Prescrição")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
