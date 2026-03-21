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
      // Store the WestPay external reference on our transaction
      apiRequest("POST", `/api/user/deposit/westpay/confirm/${txId}`, { externalRef: ref })
        .catch(() => {});
      setStatus("success");
      setMessage(
        amount
          ? `Paiement de ${parseInt(amount).toLocaleString()} FCFA reçu. Votre solde sera crédité automatiquement.`
          : "Paiement confirmé. Votre solde sera crédité automatiquement."
      );
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
      {/* Header */}
      <div className="bg-[#22c55e] px-4 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={goHome} className="text-white" data-testid="button-back-return">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Résultat du paiement</h1>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {status === "loading" && (
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#22c55e] rounded-full animate-spin mb-6" />
        )}

        {status === "success" && (
          <CheckCircle className="w-20 h-20 text-[#22c55e] mb-6" />
        )}

        {status === "failed" && (
          <XCircle className="w-20 h-20 text-red-500 mb-6" />
        )}

        {status === "pending" && (
          <Clock className="w-20 h-20 text-yellow-500 mb-6" />
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
              className="w-full py-4 bg-[#22c55e] text-white font-bold rounded-xl text-base"
              data-testid="button-go-home"
            >
              Retour à l'accueil
            </button>
            {status === "failed" && (
              <button
                onClick={goDeposit}
                className="w-full py-4 border border-gray-200 text-gray-700 font-semibold rounded-xl text-base"
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
