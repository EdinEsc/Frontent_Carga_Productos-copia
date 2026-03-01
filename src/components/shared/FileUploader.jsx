// components/shared/FileUploader.jsx
export default function FileUploader({ file, onFileChange, accept = ".xlsx,.xls", description = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#02979B]">Archivo Excel</label>

      <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D9D9] bg-white p-8 text-center transition hover:border-[#02979B] hover:bg-[#02979B]/5">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#D9D9D9] text-[#02979B] transition group-hover:bg-[#02979B] group-hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16V4m0 0 4 4M12 4 8 8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="mt-3 text-sm font-semibold text-[#02979B]">
          {file ? file.name : "Seleccionar archivo .xlsx / .xls"}
        </div>
        {description && (
          <div className="mt-1 text-xs text-[#02979B]/60">{description}</div>
        )}
      </label>
    </div>
  );
}