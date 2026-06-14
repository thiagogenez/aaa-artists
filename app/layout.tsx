import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "AAA Artists — Artist Management & Bookings",
  description:
    "AAA Artists represents world-class electronic music artists. Trance, techno, progressive and more. Book our artists for your event.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('aaa-theme')||'light';document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(t);})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <Navbar />
          <main className="pt-[73px]">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
