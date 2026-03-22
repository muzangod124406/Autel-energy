import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { ArrowLeft, Send, Image, Paperclip } from "lucide-react";
import autelLogo from "@assets/images_(11)_1774131992392.png";
import serviceImg from "@assets/Img_2026_03_22_11_16_53_1774178912559.jpeg";

type ChatMsg = {
  id: string;
  userId: string;
  senderType: string;
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function ServiceClientPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMsg[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 4000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    const fd = new FormData();
    fd.append("content", text.trim());
    sendMutation.mutate(fd);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    sendMutation.mutate(fd);
    e.target.value = "";
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100dvh" }}>
      {/* Header vert */}
      <div className="bg-[#22c55e] pt-10 pb-0 flex-shrink-0">
        <div className="flex items-center px-4 pb-3 gap-3">
          <button onClick={() => navigate(-1 as any)} data-testid="button-back-chat">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-base leading-tight">Centre de service</p>
            <p className="text-white/80 text-xs">Nous vous accompagnons tout au long</p>
          </div>
          <img src={serviceImg} alt="Support" className="w-14 h-14 rounded-full object-cover border-2 border-white/50" />
        </div>

        {/* Bandeau logo + nom */}
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={autelLogo} alt="Autel" className="w-8 h-8 rounded-full border border-white/30 object-cover" />
            <span className="text-white font-semibold text-sm">Service clientèle Autel Invest</span>
          </div>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center pt-8">
            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (messages as ChatMsg[]).length === 0 && (
          <div className="flex flex-col items-center pt-10 gap-3">
            <img src={serviceImg} alt="Support" className="w-20 h-20 rounded-full object-cover opacity-60" />
            <p className="text-gray-400 text-sm text-center">
              Bonjour ! Comment pouvons-nous vous aider ?<br />
              Envoyez un message, nous répondrons rapidement.
            </p>
          </div>
        )}

        {(messages as ChatMsg[]).map((msg) => {
          const isUser = msg.senderType === "user";
          return (
            <div key={msg.id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              {!isUser && (
                <img src={autelLogo} alt="Admin" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[72%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {msg.imageUrl && (
                  <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={msg.imageUrl}
                      alt="image"
                      className={`rounded-2xl max-w-full max-h-52 object-cover shadow-sm ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                    />
                  </a>
                )}
                {msg.content && (
                  <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm ${
                    isUser
                      ? "bg-[#22c55e] text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                )}
                <span className="text-gray-400 text-[10px] px-1">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <button
            data-testid="btn-attach-image"
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[#22c55e] transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          <input
            data-testid="input-chat-message"
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Saisissez les informations..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />

          <button
            data-testid="btn-send-message"
            onClick={handleSend}
            disabled={sendMutation.isPending || !text.trim()}
            className="w-10 h-10 bg-[#22c55e] rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
