// app/dashboard/layout.tsx
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 w-full min-h-screen bg-gray-50">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
