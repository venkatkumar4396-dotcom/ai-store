import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ToastProvider } from "@/components/ui/toaster";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { DevContrastGuard } from "@/components/shared/DevContrastGuard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Nexora — Intelligence, Automated.",
  description: "Deploy powerful AI agents for travel booking, stock analysis, career acceleration, productivity, and document processing. The premium AI automation platform.",
  keywords: ["AI agents", "automation", "travel booking", "stock analysis", "productivity", "AI platform"],
  openGraph: {
    title: "Nexora — Intelligence, Automated.",
    description: "Deploy powerful AI agents that automate your work. Travel, finance, career, productivity — all in one platform.",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} light h-full antialiased font-sans`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#f8fafc" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('nexusforge_theme');
                  var theme = (savedTheme === 'dark') ? 'dark' : 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <CommandPalette />
            <DevContrastGuard />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
