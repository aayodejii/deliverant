import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1120px] mx-auto px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
