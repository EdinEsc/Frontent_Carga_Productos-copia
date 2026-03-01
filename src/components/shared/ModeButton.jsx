// components/shared/ModeButton.jsx
export default function ModeButton({ active, onClick, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active ? "border-[#02979B] bg-[#02979B] text-white" : "border-[#D9D9D9] bg-white text-[#02979B] hover:bg-[#02979B]/5"
      }`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className={`mt-1 text-xs ${active ? "text-white/80" : "text-[#02979B]/60"}`}>{desc}</div>
    </button>
  );
}