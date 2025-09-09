import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertAppointmentSchema, type InsertAppointment, type Appointment } from "@shared/schema";

interface AppointmentFormProps {
  appointment?: Appointment;
  onSuccess?: () => void;
}

export default function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const { toast } = useToast();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const { data: owners } = useQuery({
    queryKey: ["/api/clinics", clinicId, "owners"],
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

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: appointment ? {
      clinicId: appointment.clinicId,
      patientId: appointment.patientId,
      ownerId: appointment.ownerId,
      providerId: appointment.providerId,
      startsAt: appointment.startsAt ? new Date(appointment.startsAt) : undefined,
      endsAt: appointment.endsAt ? new Date(appointment.endsAt) : undefined,
      status: appointment.status,
      source: appointment.source,
      notes: appointment.notes || "",
    } : {
      clinicId,
      patientId: "",
      ownerId: "",
      providerId: "",
      startsAt: undefined,
      endsAt: undefined,
      status: "PENDING",
      source: "MANUAL",
      notes: "",
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: InsertAppointment) => {
      if (appointment) {
        await apiRequest("PUT", `/api/appointments/${appointment.id}`, data);
      } else {
        await apiRequest("POST", "/api/appointments", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: appointment ? "Agendamento atualizado com sucesso" : "Agendamento criado com sucesso",
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
        description: appointment ? "Erro ao atualizar agendamento" : "Erro ao criar agendamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAppointment) => {
    createAppointmentMutation.mutate(data);
  };

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tutor *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-owner">
                      <SelectValue placeholder="Selecione o tutor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {owners?.map((owner: any) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
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
                        {patient.name} ({patient.species})
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                    <SelectItem value="NO_SHOW">Faltou</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e Hora de Início *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? formatDateTimeLocal(new Date(field.value)) : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    data-testid="input-starts-at"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endsAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data e Hora de Fim *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value ? formatDateTimeLocal(new Date(field.value)) : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    data-testid="input-ends-at"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o agendamento..."
                  {...field}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={createAppointmentMutation.isPending} data-testid="button-save-appointment">
            {createAppointmentMutation.isPending 
              ? (appointment ? "Salvando..." : "Criando...") 
              : (appointment ? "Salvar Alterações" : "Criar Agendamento")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
