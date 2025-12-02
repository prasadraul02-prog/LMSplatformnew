import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { RegisterServiceWorker } from "@/components/register-sw";
import { Toaster } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "LMS Portal - Learning Management System",
    description: "Modern Learning Management System with advanced features",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "LMS Portal",
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
        { media: "(prefers-color-scheme: dark)", color: "#7c3aed" },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className={inter.className}>
                <Providers attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                    <RegisterServiceWorker />
                    <Toaster position="top-center" richColors />

                    <div className="flex min-h-screen bg-background">
                        {/* Sidebar Navigation */}
                        <Sidebar />

                        {/* Main Content Area */}
                        <main className="flex-1 lg:pl-[18rem] transition-all duration-300 ease-in-out min-h-screen">
                            <div className="container-responsive py-6 lg:py-8 px-4 lg:px-8 animate-in-fade">
                                {children}
                            </div>
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
