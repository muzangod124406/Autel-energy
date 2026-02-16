import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Users, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function TelegramPage() {
  const [, navigate] = useLocation();
  const { data: settings } = useQuery({ queryKey: ["/api/settings"] });

  const serviceHandle = settings?.telegramService || "@redbull_service";
  const groupLink = settings?.telegramGroup || "https://t.me/+M9neinnLgK4wYWRk";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 pt-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white mb-2" data-testid="button-back-telegram">
            <ArrowLeft className="w-5 h-5" /> Retour
          </button>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" /> Telegram
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold">Service Client</h2>
          <p className="text-white/80 text-sm mt-1">Contactez-nous pour toute assistance</p>
        </div>

        <Card className="p-4">
          <a
            href={`https://t.me/${serviceHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-service-client"
          >
            <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold">
              <MessageCircle className="w-4 h-4 mr-2" /> Service Client {serviceHandle}
            </Button>
          </a>
        </Card>

        <Card className="p-4">
          <a
            href={groupLink}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-official-channel"
          >
            <Button variant="outline" className="w-full font-semibold">
              <Users className="w-4 h-4 mr-2" /> Chaîne Officielle
            </Button>
          </a>
        </Card>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Clock className="w-4 h-4" />
          <span>Heure de service client : de 9h à 17h</span>
        </div>
      </div>
    </div>
  );
}
