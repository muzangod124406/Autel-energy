import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Paperclip, Image, Send, Check, CheckCheck, Headphones } from "lucide-react";
import claraImg from "@assets/MV5BNmNkNmUyNjYtY2VhYi00ZjE4LWI0NmMtNmJkZDc2NzEyMzgxXkEyXkFqcG_1777886048395.jpg";

function MessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  const clean = text.replace("[[TELEGRAM]]", "").replace("[[GROUP]]", "").trim();
  const hasTelegram = text.includes("[[TELEGRAM]]");
  const hasGroup = text.includes("[[GROUP]]");

  const renderText = (t: string) =>
    t.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );

  const renderLines = (t: string) =>
    t.split("\n").map((line, i) => (
      <span key={i}>{renderText(line)}{i < t.split("\n").length - 1 && <br />}</span>
    ));

  return (
    <div>
      {clean && <p className="text-sm leading-relaxed">{renderLines(clean)}</p>}
      {hasTelegram && (
        <a href="https://t.me/clara_sinopec" target="_blank" rel="noreferrer"
          className="mt-2 flex items-center gap-2 bg-[#229ED9] text-white text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          data-testid="btn-telegram-support">
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
          </svg>
          Service client @clara_sinopec
        </a>
      )}
      {hasGroup && (
        <a href="https://t.me/sinopecgroup" target="_blank" rel="noreferrer"
          className="mt-2 flex items-center gap-2 bg-[#229ED9] text-white text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          data-testid="btn-telegram-group">
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
          </svg>
          Rejoindre le groupe SINOPEC
        </a>
      )}
    </div>
  );
}

type ChatMsg = {
  id: string; userId: string; senderType: string;
  content?: string; imageUrl?: string; isRead: boolean; createdAt: string;
};

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(d: string) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default function ServiceClientPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMsg[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 12000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/chat/messages", { method: "POST", credentials: "include", body: formData });
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
    const fd = new FormData(); fd.append("content", text.trim());
    sendMutation.mutate(fd);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append("image", file);
    sendMutation.mutate(fd); e.target.value = "";
  };

  const msgs = messages as ChatMsg[];
  const groupedByDate: { label: string; msgs: ChatMsg[] }[] = [];
  for (const msg of msgs) {
    const label = formatDateLabel(msg.createdAt);
    const last = groupedByDate[groupedByDate.length - 1];
    if (last && last.label === label) last.msgs.push(msg);
    else groupedByDate.push({ label, msgs: [msg] });
  }

  return (
    <div className="flex flex-col" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overscrollBehavior: "none", background: "#F5F0EB" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        paddingTop: "env(safe-area-inset-top, 12px)",
        flexShrink: 0,
        boxShadow: "0 2px 16px rgba(245,158,11,0.25)"
      }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => window.history.back()} data-testid="button-back-chat"
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="relative flex-shrink-0">
            <img src={claraImg} alt="DEEN" className="w-11 h-11 rounded-full object-cover border-2 border-white/50 shadow" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-amber-500 rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-sm leading-tight">DEEN SINOPEC</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              <p className="text-white/80 text-xs font-medium">En ligne · Support officiel</p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ overscrollBehavior: "contain" }}>

        {isLoading && (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && msgs.length === 0 && (
          <div className="flex flex-col items-center pt-8 gap-4 px-4">
            <div className="relative">
              <img src={claraImg} alt="DEEN" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white" />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div className="bg-white rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm max-w-xs text-center border border-gray-100">
              <p className="text-gray-800 font-extrabold text-sm mb-1">DEEN SINOPEC 👋</p>
              <p className="text-gray-500 text-sm leading-relaxed">Bonjour ! Je suis là pour vous aider. Comment puis-je vous assister aujourd'hui ?</p>
            </div>
          </div>
        )}

        {groupedByDate.map(({ label, msgs: dayMsgs }) => (
          <div key={label}>
            <div className="flex items-center justify-center my-4">
              <span className="bg-black/12 text-gray-600 text-[11px] px-4 py-1 rounded-full font-medium">
                {label}
              </span>
            </div>

            {dayMsgs.map((msg, idx) => {
              const isUser = msg.senderType === "user";
              const prevMsg = dayMsgs[idx - 1];
              const showAvatar = !isUser && (!prevMsg || prevMsg.senderType === "user");
              const showLabel  = !isUser && (!prevMsg || prevMsg.senderType === "user");

              return (
                <div key={msg.id}
                  className={`flex items-end gap-2 mb-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

                  <div className="w-8 flex-shrink-0 flex items-end">
                    {!isUser && showAvatar ? (
                      <img src={claraImg} alt="DEEN" className="w-8 h-8 rounded-full object-cover shadow-sm border border-white" />
                    ) : !isUser ? <div className="w-8" /> : null}
                  </div>

                  <div className={`flex flex-col max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
                    {showLabel && (
                      <span className="text-[10px] text-amber-600 font-bold ml-1 mb-1">DEEN SINOPEC</span>
                    )}

                    {msg.imageUrl && (
                      <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="mb-1">
                        <img src={msg.imageUrl} alt="img"
                          className={`rounded-2xl max-h-52 object-cover shadow-sm ${isUser ? "rounded-br-sm" : "rounded-bl-sm"}`} />
                      </a>
                    )}

                    {msg.content && (
                      <div className={`relative px-4 py-2.5 shadow-sm ${
                        isUser
                          ? "text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm"
                          : "bg-white text-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl-sm border border-gray-100"
                      }`}
                        style={isUser ? { background: "linear-gradient(135deg, #F59E0B, #D97706)" } : {}}>
                        <MessageContent text={msg.content} isUser={isUser} />
                        <div className="flex items-center gap-1 mt-1.5 justify-end">
                          <span className={`text-[10px] ${isUser ? "text-white/70" : "text-gray-400"}`}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {isUser && (msg.isRead
                            ? <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                            : <Check className="w-3.5 h-3.5 text-white/60" />
                          )}
                        </div>
                      </div>
                    )}

                    {!msg.content && msg.imageUrl && (
                      <div className={`flex items-center gap-1 mt-0.5 ${isUser ? "justify-end" : ""}`}>
                        <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                        {isUser && (msg.isRead
                          ? <CheckCheck className="w-3.5 h-3.5 text-amber-500" />
                          : <Check className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-3 py-2.5"
        style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2.5 gap-2 border border-gray-200">
            <input data-testid="input-chat-message" type="text" value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Votre message..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400" />
            <button onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-gray-600" data-testid="btn-attach">
              <Paperclip className="w-4 h-4" />
            </button>
            <button onClick={() => imageRef.current?.click()} className="text-gray-400 hover:text-gray-600" data-testid="btn-attach-image">
              <Image className="w-4 h-4" />
            </button>
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button data-testid="btn-send-message" onClick={handleSend}
            disabled={sendMutation.isPending || !text.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center disabled:opacity-40 flex-shrink-0 shadow-sm"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
