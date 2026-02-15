export default function GymModeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black text-heading overflow-hidden select-none">
      {children}
    </div>
  );
}
