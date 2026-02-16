"use client";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export default function Modal({ children, onClose, wide }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Card */}
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} mx-6 rounded-2xl border border-edge bg-card p-8 shadow-2xl`}>
        {children}
      </div>
    </div>
  );
}
