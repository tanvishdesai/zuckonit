import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles/effects.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeProvider from "@/app/components/ThemeProvider";
import { Navbar } from "@/components/ui/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ScrollGradient } from "./components/ScrollGradient";
import { GradientStrengthControl } from "./components/GradientStrengthControl";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zuckonit | Personal Blogging Platform",
  description: "A minimal platform for personal updates, thoughts, and project progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col relative">
              {/* Dynamic gradient background that changes with scroll */}
              <ScrollGradient strength="medium" />
              
              {/* Noise texture overlay */}
              <div className="noise-overlay" />
              
              <Navbar />
              <main className="flex-1 container mx-auto py-8 relative z-10">
                {children}
              </main>
              <footer className="border-t py-10 bg-muted/30 relative z-10">
                <div className="container mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-3">
                      <h3 className="font-bold text-lg bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-transparent bg-clip-text">Zuckonit</h3>
                      <p className="text-sm text-muted-foreground">A minimalist platform for sharing your thoughts, ideas, and creative work.</p>
                    </div>
                    
                   
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Get Started</h4>
                      <ul className="space-y-2 text-sm">
                        <li><Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Create an account</Link></li>
                        <li><Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link></li>
                        <li><Link href="/create" className="text-muted-foreground hover:text-foreground transition-colors">Create a post</Link></li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Contact</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="text-muted-foreground">tanvishdesai.05@gmail.com</li>
                        <li className="text-muted-foreground">+91 901 650 5667</li>
                      </ul>
                      <div className="flex space-x-4 pt-2">
                        <a href="https://www.instagram.com/tanvish.desai" className="text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
                        <a href="https://github.com/tanvishdesai" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Zuckonit. All rights reserved.
                  </div>
                </div>
              </footer>
              
              {/* Gradient strength control */}
              <GradientStrengthControl />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
