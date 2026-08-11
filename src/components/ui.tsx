export function Button({ children, onClick, variant = "primary", className = "", type = "button" }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger";
  className?: string; type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:opacity-90",
  };
  return (
    <button type={type} onClick={onClick} className={`rounded px-3 py-1.5 text-sm ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded border px-2 py-1 text-sm ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`rounded border px-2 py-1 text-sm ${props.className ?? ""}`} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-gray-700">{children}</label>;
}
