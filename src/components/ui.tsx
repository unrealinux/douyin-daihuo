"use client";

export function Button({ children, onClick, variant = "primary", className = "", type = "button", disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string; type?: "button" | "submit"; disabled?: boolean;
}) {
  const styles = {
    primary: "bg-accent text-white shadow-accent hover:bg-[#ff3f63] hover:shadow-[0_10px_30px_-8px_rgb(254_44_85/0.55)]",
    secondary: "bg-transparent border border-line text-white hover:bg-white/5 hover:border-white/20",
    danger: "bg-danger/90 text-white hover:bg-danger",
    ghost: "bg-transparent text-fg-2 hover:text-white hover:bg-white/5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-all duration-200 ease-out-expo active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-page ${styles[variant]} ${className} ${disabled ? "cursor-not-allowed opacity-50 active:scale-100" : ""}`}
    >
      {children}
    </button>
  );
}

const fieldBase =
  "w-full rounded-lg border border-line bg-white/5 px-3 py-2 text-sm text-white outline-none transition-all duration-200 ease-out-expo placeholder:text-white/30 focus:border-accent/60 focus:bg-white/[0.07] focus:ring-1 focus:ring-accent/30";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${fieldBase} [&>option]:bg-surface-2 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} ${props.className ?? ""}`} />;
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-fg-2">
      {children}
    </label>
  );
}

export function Card({ children, className = "", hover = false }: {
  children: React.ReactNode; className?: string; hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-line/60 bg-surface shadow-card transition-all duration-200 ease-out-expo ${hover ? "hover:-translate-y-0.5 hover:border-white/10 hover:shadow-cardHover" : ""} ${className}`}
    >
      {children}
    </div>
  );
}