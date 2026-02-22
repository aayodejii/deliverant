import { Sidebar } from "@/components/Sidebar";
import { CommandPalette } from "@/components/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1120px] mx-auto px-6 md:px-10 py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
