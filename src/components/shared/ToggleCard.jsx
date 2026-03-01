// components/shared/ToggleCard.jsx
export default function ToggleCard({ title, value, onToggle, disabled = false, icon }) {
  return (
    <div className={`rounded-2xl border border-[#D9D9D9] ${disabled ? "bg-[#D9D9D9]/20" : "bg-white"} p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="text-[#02979B]">{icon}</div>
          <div className={`text-sm font-semibold ${disabled ? "text-[#02979B]/40" : "text-[#02979B]"}`}>{title}</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            disabled ? "bg-[#D9D9D9] cursor-not-allowed" : value ? "bg-[#02979B]" : "bg-[#D9D9D9]"
          }`}
          aria-label="toggle"
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${value ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>
    </div>
  );
}