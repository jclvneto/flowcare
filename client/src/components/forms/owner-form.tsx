import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { insertOwnerSchema, type InsertOwner, type Owner } from "@shared/schema";

interface OwnerFormProps {
  owner?: Owner;
  onSuccess?: () => void;
}

export default function OwnerForm({ owner, onSuccess }: OwnerFormProps) {
  const { toast } = useToast();

  // TODO: Replace with actual clinic ID from user context
  const clinicId = "clinic-1";

  const form = useForm<InsertOwner>({
    resolver: zodResolver(insertOwnerSchema),
    defaultValues: owner ? {
      clinicId: owner.clinicId,
      name: owner.name,
      phone: owner.phone || "",
      email: owner.email || "",
      notes: owner.notes || "",
      whatsappOptIn: owner.whatsappOptIn,
    } : {
      clinicId,
      name: "",
      phone: "",
      email: "",
      notes: "",
      whatsappOptIn: true,
    },
  });

  const createOwnerMutation = useMutation({
    mutationFn: async (data: InsertOwner) => {
      if (owner) {
        await apiRequest("PUT", `/api/owners/${owner.id}`, data);
      } else {
        await apiRequest("POST", "/api/owners", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: owner ? "Tutor atualizado com sucesso" : "Tutor criado com sucesso",
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
        description: owner ? "Erro ao atualizar tutor" : "Erro ao criar tutor",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertOwner) => {
    createOwnerMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo *</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo do tutor" {...field} data-testid="input-owner-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="whatsappOptIn"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-whatsapp-opt-in"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Aceita receber mensagens via WhatsApp</FormLabel>
                <p className="text-sm text-muted-foreground">
                  O tutor autoriza o recebimento de receitas, lembretes e outras comunicações via WhatsApp
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações adicionais sobre o tutor..."
                  {...field}
                  data-testid="textarea-notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={createOwnerMutation.isPending} data-testid="button-save-owner">
            {createOwnerMutation.isPending 
              ? (owner ? "Salvando..." : "Criando...") 
              : (owner ? "Salvar Alterações" : "Cadastrar Tutor")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
