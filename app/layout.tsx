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
import { Github, Instagram, Twitter, Mail, Send, Linkedin, ExternalLink } from "lucide-react";

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
              
              <footer className="relative z-10 mt-20">
                {/* Decorative top border with gradient */}
                <div className="h-1 bg-gradient-to-r from-[var(--gradient-start)] via-primary to-[var(--gradient-end)]"></div>
                
                {/* Subtle wave pattern */}
                <div className="h-16 relative overflow-hidden bg-card/30">
                  <svg className="absolute inset-0 w-full" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                      fill="var(--background)" 
                      fillOpacity="0.4"
                    />
                  </svg>
                </div>
                
                {/* Main footer content */}
                <div className="bg-card/30 backdrop-blur-sm pt-8 pb-12">
                  <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                      {/* Brand and mission */}
                      <div className="md:col-span-5 space-y-4">
                        <div className="flex items-baseline">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-transparent bg-clip-text">Zuckonit</h2>
                          <span className="ml-2 text-xs bg-primary/10 text-primary py-0.5 px-2 rounded-full">Beta</span>
                        </div>
                        
                        <p className="text-muted-foreground">
                          A minimalist platform for sharing your thoughts, ideas, and creative work with a focus on simplicity and elegance.
                        </p>
                        
                        <div className="pt-4 flex gap-5">
                          <a href="https://twitter.com" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter">
                            <Twitter size={18} />
                          </a>
                          <a href="https://www.instagram.com/tanvish.desai" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                            <Instagram size={18} />
                          </a>
                          <a href="https://github.com/tanvishdesai" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                            <Github size={18} />
                          </a>
                          <a href="https://linkedin.com" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                            <Linkedin size={18} />
                          </a>
                        </div>
                      </div>
                      
                      {/* Quick links section */}
                      <div className="md:col-span-2 space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Platform</h3>
                        <ul className="space-y-2.5">
                          <li>
                            <Link href="/about" className="text-sm hover:text-primary transition-all flex items-center gap-1 group">
                              About
                              <span className="inline-block transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                <ExternalLink size={12} />
                              </span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/explore" className="text-sm hover:text-primary transition-all flex items-center gap-1 group">
                              Explore
                              <span className="inline-block transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                <ExternalLink size={12} />
                              </span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/groups" className="text-sm hover:text-primary transition-all flex items-center gap-1 group">
                              Groups
                              <span className="inline-block transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                <ExternalLink size={12} />
                              </span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Account section */}
                      <div className="md:col-span-2 space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Account</h3>
                        <ul className="space-y-2.5">
                          <li>
                            <Link href="/register" className="text-sm hover:text-primary transition-all flex items-center gap-1 group">
                              Register
                              <span className="inline-block transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                <ExternalLink size={12} />
                              </span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/login" className="text-sm hover:text-primary transition-all flex items-center gap-1 group">
                              Login
                              <span className="inline-block transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                <ExternalLink size={12} />
                              </span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/settings" className="text-sm hover:text-primary transition-all flex items-center gap-1 group">
                              Settings
                              <span className="inline-block transition-transform group-hover:translate-x-1 opacity-0 group-hover:opacity-100">
                                <ExternalLink size={12} />
                              </span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Contact section */}
                      <div className="md:col-span-3 space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Get In Touch</h3>
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-full">
                            <Mail size={16} className="text-primary" />
                          </div>
                          <a href="mailto:tanvishdesai.05@gmail.com" className="text-sm hover:text-primary transition-colors">
                            tanvishdesai.05@gmail.com
                          </a>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-full">
                            <Send size={16} className="text-primary" />
                          </div>
                          <span className="text-sm">+91 901 650 5667</span>
                        </div>
                        <div className="pt-2">
                          <div className="relative group">
                            <div className="relative border border-border/50 rounded-lg overflow-hidden transition-all focus-within:ring-1 focus-within:ring-primary">
                              <input type="email" placeholder="Subscribe to newsletter..." className="w-full py-2.5 pl-3 pr-10 bg-transparent text-sm focus:outline-none" />
                              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors">
                                <Send size={16} />
                              </button>
                            </div>
                            <div className="absolute inset-0 border border-primary/50 rounded-lg scale-105 opacity-0 group-focus-within:opacity-100 group-focus-within:scale-100 transition-all duration-300"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Copyright section */}
                <div className="bg-background/80 backdrop-blur-md py-4 border-t border-border/10">
                  <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                      <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Zuckonit. All rights reserved.
                      </p>
                      <div className="flex gap-6">
                        <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Terms of Service
                        </Link>
                        <Link href="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          Cookies
                        </Link>
                      </div>
                    </div>
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
