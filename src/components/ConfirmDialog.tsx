"use client";

import Modal from "@/components/Modal";
import { Button } from "@/components/ui";

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm}>确认</Button>
        </>
      }
    >
      <p className="text-sm text-fg-2">{message}</p>
    </Modal>
  );
}
