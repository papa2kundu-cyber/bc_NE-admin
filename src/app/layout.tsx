import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "@/components/Providers";
import AdminLayoutClient from "@/components/AdminLayoutClient";

export const metadata: Metadata = {
  title: "Brightocity Interior Admin",
  description: "Admin panel for Brightocity Interior",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
        <link rel="icon" href="/images/favicon.svg" sizes="any" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AdminLayoutClient>{children}</AdminLayoutClient>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
