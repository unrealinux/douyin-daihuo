"use client";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="w-80 rounded-lg bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded border px-3 py-1 text-sm">取消</button>
          <button onClick={onConfirm} className="rounded bg-red-500 px-3 py-1 text-sm text-white">确认</button>
        </div>
      </div>
    </div>
  );
}
