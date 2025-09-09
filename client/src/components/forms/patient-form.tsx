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
import { insertPatientSchema, type InsertPatient, type Patient } from "@shared/schema";

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: () => void;
}

export default function PatientForm({ patient, onSuccess }: PatientFormProps) {
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

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: patient ? {
      clinicId: patient.clinicId,
      ownerId: patient.ownerId,
      name: patient.name,
      species: patient.species,
      sex: patient.sex,
      breed: patient.breed || "",
      color: patient.color || "",
      birthDate: patient.birthDate ? new Date(patient.birthDate) : undefined,
      microchip: patient.microchip || "",
      notes: patient.notes || "",
    } : {
      clinicId,
      ownerId: "",
      name: "",
      species: "DOG",
      sex: "UNKNOWN",
      breed: "",
      color: "",
      birthDate: undefined,
      microchip: "",
      notes: "",
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      if (patient) {
        await apiRequest("PUT", `/api/patients/${patient.id}`, data);
      } else {
        await apiRequest("POST", "/api/patients", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: patient ? "Paciente atualizado com sucesso" : "Paciente criado com sucesso",
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
        description: patient ? "Erro ao atualizar paciente" : "Erro ao criar paciente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    createPatientMutation.mutate(data);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Paciente *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do animal" {...field} data-testid="input-patient-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Espécie *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-species">
                      <SelectValue placeholder="Selecione a espécie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DOG">Cão</SelectItem>
                    <SelectItem value="CAT">Gato</SelectItem>
                    <SelectItem value="BIRD">Ave</SelectItem>
                    <SelectItem value="RABBIT">Coelho</SelectItem>
                    <SelectItem value="REPTILE">Réptil</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Raça</FormLabel>
                <FormControl>
                  <Input placeholder="Raça do animal" {...field} data-testid="input-breed" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-sex">
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UNKNOWN">Não informado</SelectItem>
                    <SelectItem value="MALE">Macho</SelectItem>
                    <SelectItem value="FEMALE">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cor</FormLabel>
                <FormControl>
                  <Input placeholder="Cor do animal" {...field} data-testid="input-color" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? formatDateForInput(new Date(field.value)) : ""}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    data-testid="input-birth-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="microchip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Microchip</FormLabel>
                <FormControl>
                  <Input placeholder="Número do microchip" {...field} data-testid="input-microchip" />
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
                  placeholder="Observações adicionais sobre o paciente..."
                  {...field}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={createPatientMutation.isPending} data-testid="button-save-patient">
            {createPatientMutation.isPending 
              ? (patient ? "Salvando..." : "Criando...") 
              : (patient ? "Salvar Alterações" : "Cadastrar Paciente")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
