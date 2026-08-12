export function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-gradient-to-r from-[#fe2c55] to-[#ff6b81] text-white hover:brightness-110",
    secondary: "bg-transparent border border-white/10 text-white hover:bg-white/10",
    danger: "bg-red-500/90 text-white hover:bg-red-500",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 focus-visible:ring-2 ring-accent/50 ${styles[variant]} ${className} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all [&>option]:bg-surface focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all placeholder:text-white/30 focus:border-accent focus:ring-1 focus:ring-accent/30 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm text-white/60">{children}</label>;
}

export function Card({ children, className = "", hover = false }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-white/5 bg-surface shadow-card transition-all ${hover ? "hover:border-white/10 hover:shadow-lg" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
