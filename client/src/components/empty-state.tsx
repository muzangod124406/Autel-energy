import emptyImg from "@assets/none_order_(1)_1774133514505.png";

interface EmptyStateProps {
  text?: string;
  subtext?: string;
}

export default function EmptyState({ text = "Aucune donnée", subtext }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <img src={emptyImg} alt="Vide" className="w-40 h-40 object-contain mb-4 opacity-90" />
      <p className="text-gray-600 font-semibold text-base mb-1">{text}</p>
      {subtext && <p className="text-gray-400 text-sm leading-relaxed">{subtext}</p>}
    </div>
  );
}
