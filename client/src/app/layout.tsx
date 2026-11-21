import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-screen bg-[#050914] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
