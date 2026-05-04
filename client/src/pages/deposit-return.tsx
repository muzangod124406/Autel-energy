import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

export default function DepositReturnPage() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "pending">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wpStatus = params.get("status");
    const txId = params.get("txId");
    const ref = params.get("ref");
    const amount = params.get("amount");

    if (wpStatus === "success" && txId) {
      apiRequest("POST", `/api/user/deposit/westpay/confirm/${txId}`, { externalRef: ref }).catch(() => {});
      setStatus("success");
      setMessage(amount
        ? `Paiement de ${parseInt(amount).toLocaleString()} FCFA reçu. Votre solde sera crédité automatiquement.`
        : "Paiement confirmé. Votre solde sera crédité automatiquement.");
    } else if (wpStatus === "failed" || wpStatus === "cancelled") {
      setStatus("failed");
      setMessage("Le paiement a échoué ou a été annulé. Veuillez réessayer.");
    } else if (txId) {
      setStatus("pending");
      setMessage("Votre paiement est en cours de traitement. Vous serez notifié dès confirmation.");
    } else {
      setStatus("pending");
      setMessage("Votre dépôt est en attente de validation.");
    }
  }, []);

  const goHome = () => navigate("/");
  const goDeposit = () => navigate("/deposit");

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header gold */}
      <div style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }} className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={goHome} className="text-white" data-testid="button-back-return">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Résultat du paiement</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

        {status === "loading" && (
          <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin mb-6" />
        )}

        {status === "success" && (
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
        )}

        {status === "failed" && (
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
        )}

        {status === "pending" && (
          <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
            <Clock className="w-12 h-12 text-amber-500" />
          </div>
        )}

        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {status === "success" && "Paiement réussi !"}
          {status === "failed" && "Paiement échoué"}
          {status === "pending" && "En attente de confirmation"}
          {status === "loading" && "Traitement en cours..."}
        </h2>

        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
          {message || "Vérification de votre paiement..."}
        </p>

        {status !== "loading" && (
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={goHome}
              className="w-full py-4 text-black font-bold rounded-2xl text-base shadow-md"
              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)" }}
              data-testid="button-go-home"
            >
              Retour à l'accueil
            </button>
            {status === "failed" && (
              <button
                onClick={goDeposit}
                className="w-full py-4 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-base"
                data-testid="button-retry-deposit"
              >
                Réessayer un dépôt
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
