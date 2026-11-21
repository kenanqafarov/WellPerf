import type { Metadata } from "next";
import "./globals.css";
import { AgentationWrapper } from "@/components/AgentationWrapper";

export const metadata: Metadata = {
  title: "WellPerf Enterprise | SOCAR Hackathon 2026 — VFM + PTA + 3D Digital Twin",
  description:
    "Intelligent Well Performance Analysis Platform: Physics-Constrained Virtual Flow Metering (VFM), Automated Pressure Transient Analysis (PTA), 3D Subsurface Twin & Role-Based Access Control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
        {children}
        <AgentationWrapper />
      </body>
    </html>
  );
}
