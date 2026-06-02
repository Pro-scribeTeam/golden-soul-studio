import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutProvider } from "@/components/layout/LayoutProvider";
import { MainContent } from "@/components/layout/MainContent";

export const metadata: Metadata = {
  title: "Golden Soul Studio",
  description: "AI Creative Studio for Jeff M Dixon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#0A0A0F]">
        <LayoutProvider>
          <div className="flex h-full">
            <Sidebar />
            <MainContent>{children}</MainContent>
          </div>
        </LayoutProvider>
      </body>
    </html>
  );
}
