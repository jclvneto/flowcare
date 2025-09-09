import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-2xl">
          <CardContent className="space-y-6 p-0">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-2xl text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">FlowCare</h1>
              <p className="text-muted-foreground mt-2">CRM para Clínicas Veterinárias</p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleLogin}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 font-medium"
                data-testid="button-login"
              >
                Entrar com Replit
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Sistema de gestão completo para clínicas veterinárias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
