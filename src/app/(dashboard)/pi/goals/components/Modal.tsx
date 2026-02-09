"use client";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-lg mx-6 rounded-2xl border border-[#2a2a33] bg-[#1a1a22] p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
