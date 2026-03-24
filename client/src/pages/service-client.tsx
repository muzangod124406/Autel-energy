import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Phone, MoreVertical, Smile, Paperclip, Image, Send, Check, CheckCheck } from "lucide-react";
import autelLogo from "@assets/images_(11)_1774131992392.png";
import serviceImg from "@assets/561c62c4e80617ebf5313bc562f02542_1774182788114.jpg";

const TELEGRAM_SUPPORT_URL = "https://t.me/claraautel0";
const TELEGRAM_GROUP_URL = "https://t.me/autelenergy";

function TelegramIcon() {
  return (
    <svg className="w-4 h-4 fill-white flex-shrink-0" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
    </svg>
  );
}

function MessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  const hasTelegram = text.includes("[[TELEGRAM]]");
  const hasGroup = text.includes("[[GROUP]]");
  const clean = text.replace("[[TELEGRAM]]", "").replace("[[GROUP]]", "").trim();

  const renderText = (t: string) =>
    t.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    );

  const renderLines = (t: string) =>
    t.split("\n").map((line, i) => (
      <span key={i}>
        {renderText(line)}
        {i < t.split("\n").length - 1 && <br />}
      </span>
    ));

  return (
    <div>
      {clean && <p className="text-sm leading-relaxed">{renderLines(clean)}</p>}
      {hasTelegram && (
        <a
          href={TELEGRAM_SUPPORT_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-2 bg-[#229ED9] text-white text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          data-testid="btn-telegram-support"
        >
          <TelegramIcon />
          Service client @claraautel0
        </a>
      )}
      {hasGroup && (
        <a
          href={TELEGRAM_GROUP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-2 bg-[#229ED9] text-white text-xs font-semibold px-3 py-2 rounded-xl w-fit"
          data-testid="btn-telegram-group"
        >
          <TelegramIcon />
          Rejoindre le groupe Autel Energy
        </a>
      )}
    </div>
  );
}

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

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export default function ServiceClientPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
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

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const msgs = messages as ChatMsg[];

  const groupedByDate: { label: string; msgs: ChatMsg[] }[] = [];
  for (const msg of msgs) {
    const label = formatDateLabel(msg.createdAt);
    const last = groupedByDate[groupedByDate.length - 1];
    if (last && last.label === label) {
      last.msgs.push(msg);
    } else {
      groupedByDate.push({ label, msgs: [msg] });
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overscrollBehavior: "none",
        background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\") #f0fdf4",
      }}
    >
      {/* ─── Header ─── */}
      <div className="bg-[#22c55e] flex-shrink-0" style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <button
            onClick={() => window.history.back()}
            data-testid="button-back-chat"
            className="text-white p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-shrink-0">
            <img
              src={serviceImg}
              alt="Support"
              className="w-10 h-10 rounded-full object-cover border-2 border-white/40"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-300 border-2 border-[#22c55e] rounded-full" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Clara autel service</p>
            <p className="text-white/80 text-xs">En ligne</p>
          </div>

          <div className="flex items-center gap-3 text-white/90">
            <Phone className="w-5 h-5" />
            <MoreVertical className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Messages ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" style={{ overscrollBehavior: "contain" }}>
        {isLoading && (
          <div className="flex justify-center pt-10">
            <div className="w-5 h-5 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && msgs.length === 0 && (
          <div className="flex flex-col items-center pt-12 gap-3 px-6">
            <img
              src={serviceImg}
              alt="Support"
              className="w-20 h-20 rounded-full object-cover opacity-50 shadow"
            />
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-w-xs text-center">
              <p className="text-gray-500 text-sm">
                Bonjour ! Comment puis-je vous aider aujourd'hui ?
              </p>
            </div>
          </div>
        )}

        {groupedByDate.map(({ label, msgs: dayMsgs }) => (
          <div key={label}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-3">
              <span className="bg-white/80 text-gray-500 text-[11px] px-3 py-1 rounded-full shadow-sm border border-gray-100">
                {label}
              </span>
            </div>

            {dayMsgs.map((msg, idx) => {
              const isUser = msg.senderType === "user";
              const prevMsg = dayMsgs[idx - 1];
              const showAvatar = !isUser && (!prevMsg || prevMsg.senderType === "user");
              const showLabel = !isUser && (!prevMsg || prevMsg.senderType === "user");

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 mb-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar côté admin */}
                  <div className="w-7 flex-shrink-0 flex items-end">
                    {!isUser && showAvatar ? (
                      <img
                        src={autelLogo}
                        alt="Admin"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : !isUser ? (
                      <div className="w-7" />
                    ) : null}
                  </div>

                  <div
                    className={`flex flex-col max-w-[75%] ${isUser ? "items-end" : "items-start"}`}
                  >
                    {showLabel && (
                      <span className="text-[10px] text-[#22c55e] font-semibold ml-1 mb-0.5">
                        Clara
                      </span>
                    )}

                    {msg.imageUrl && (
                      <a href={msg.imageUrl} target="_blank" rel="noreferrer" className="mb-0.5">
                        <img
                          src={msg.imageUrl}
                          alt="image"
                          className={`rounded-2xl max-h-52 object-cover shadow ${
                            isUser ? "rounded-br-sm" : "rounded-bl-sm"
                          }`}
                        />
                      </a>
                    )}

                    {msg.content && (
                      <div
                        className={`relative px-3 py-2 shadow-sm ${
                          isUser
                            ? "bg-[#22c55e] text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm"
                            : "bg-white text-gray-800 rounded-t-2xl rounded-br-2xl rounded-bl-sm border border-gray-100"
                        }`}
                      >
                        <MessageContent text={msg.content} isUser={isUser} />
                        <div
                          className={`flex items-center gap-0.5 mt-0.5 ${
                            isUser ? "justify-end" : "justify-end"
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isUser ? "text-white/70" : "text-gray-400"
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </span>
                          {isUser && (
                            msg.isRead
                              ? <CheckCheck className="w-3 h-3 text-white/80" />
                              : <Check className="w-3 h-3 text-white/60" />
                          )}
                        </div>
                      </div>
                    )}

                    {!msg.content && msg.imageUrl && (
                      <div className={`flex items-center gap-0.5 mt-0.5 ${isUser ? "justify-end" : ""}`}>
                        <span className={`text-[10px] ${isUser ? "text-gray-500" : "text-gray-400"}`}>
                          {formatTime(msg.createdAt)}
                        </span>
                        {isUser && (
                          msg.isRead
                            ? <CheckCheck className="w-3 h-3 text-[#22c55e]" />
                            : <Check className="w-3 h-3 text-gray-400" />
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

      {/* ─── Input bar ─── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-2 py-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-1.5">
          <button className="w-9 h-9 flex items-center justify-center text-gray-400">
            <Smile className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 gap-2">
            <input
              data-testid="input-chat-message"
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Votre message..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-gray-400 hover:text-[#22c55e] transition-colors"
              data-testid="btn-attach"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={() => imageRef.current?.click()}
              className="text-gray-400 hover:text-[#22c55e] transition-colors"
              data-testid="btn-attach-image"
            >
              <Image className="w-4 h-4" />
            </button>
          </div>

          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <button
            data-testid="btn-send-message"
            onClick={handleSend}
            disabled={sendMutation.isPending || !text.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" }}
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
