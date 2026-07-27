type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
};

export default function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required = true,
}: AuthFieldProps) {
  return (
    <label className="block text-left">
      <span className="text-[13.5px] font-semibold text-ink">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="mt-1.5 w-full rounded-2xl border border-pink-300/70 bg-surface px-4 py-3 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
      />
    </label>
  );
}
