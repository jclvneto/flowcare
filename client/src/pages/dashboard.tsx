import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, PawPrint, PillBottle, Star } from "lucide-react";

export default function Dashboard() {
  // TODO: Replace with actual API calls for dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    enabled: false, // Disabled until API is implemented
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua clínica</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 card-hover" data-testid="card-consultas-hoje">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Consultas Hoje</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-consultas-hoje">0</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-muted-foreground">Nenhuma consulta agendada</span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 card-hover" data-testid="card-pacientes-ativos">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pacientes Ativos</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pacientes-ativos">0</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <PawPrint className="text-secondary" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-muted-foreground">Cadastre seus primeiros pacientes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 card-hover" data-testid="card-receitas-enviadas">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receitas Enviadas</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-receitas-enviadas">0</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <PillBottle className="text-accent" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-muted-foreground">Nenhuma receita enviada hoje</span>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 card-hover" data-testid="card-satisfacao">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Satisfação</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-satisfacao">--</p>
              </div>
              <div className="w-12 h-12 bg-chart-4/10 rounded-full flex items-center justify-center">
                <Star className="text-chart-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-muted-foreground">Sem dados de feedback</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <Card className="p-6" data-testid="card-chart-agendamentos">
          <h3 className="text-lg font-semibold text-foreground mb-4">Agendamentos da Semana</h3>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-12 w-12" />
              <p>Gráfico de Agendamentos</p>
              <p className="text-sm">Dados aparecerão após primeiros agendamentos</p>
            </div>
          </div>
        </Card>

        {/* Recent Appointments */}
        <Card className="p-6" data-testid="card-proximos-agendamentos">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Próximos Agendamentos</h3>
            <a href="/agendamentos" className="text-sm text-primary hover:text-primary/80">Ver todos</a>
          </div>

          <div className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-12 w-12" />
              <p>Nenhum agendamento encontrado</p>
              <p className="text-sm">Crie seu primeiro agendamento para vê-lo aqui</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
