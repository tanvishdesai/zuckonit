'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, LogOut, User, Home, Menu, X, Settings, Compass, Info, Users, FileText, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getProfilePictureUrl } from '@/lib/appwrite';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout, getProfilePicture } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profilePictureId = user ? getProfilePicture() : null;
  const profilePictureUrl = profilePictureId ? getProfilePictureUrl(profilePictureId).toString() : null;

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 60) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <motion.nav 
      className={cn(
        "sticky top-0 z-40 w-full border-b backdrop-blur transition-all duration-300",
        scrolled 
          ? "bg-background/95 border-border/60 shadow-sm" 
          : "bg-background/40 border-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto flex h-16 items-center justify-between">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] group-hover:scale-105 transition-transform duration-300">Zuckonit</span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <motion.div 
            className="flex items-center gap-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/" className="text-sm font-medium relative group">
              <span className="flex items-center gap-1 transition-colors group-hover:text-primary">
                <Home className="h-4 w-4" />
                Home
              </span>
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Link>
            
            <Link href="/explore" className="text-sm font-medium text-muted-foreground relative group">
              <span className="flex items-center gap-1 transition-colors group-hover:text-primary">
                <Compass className="h-4 w-4" />
                Explore
              </span>
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Link>
            
            {user && (
              <Link href="/groups" className="text-sm font-medium text-muted-foreground relative group">
                <span className="flex items-center gap-1 transition-colors group-hover:text-primary">
                  <Users className="h-4 w-4" />
                  Groups
                </span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
              </Link>
            )}
            
            <Link href="/about" className="text-sm font-medium text-muted-foreground relative group">
              <span className="flex items-center gap-1 transition-colors group-hover:text-primary">
                <Info className="h-4 w-4" />
                About
              </span>
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
            </Link>
          </motion.div>
        </div>

        {/* Mobile menu button */}
        <motion.button 
          className="md:hidden p-2 rounded-full hover:bg-primary/10 transition-colors"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? 
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={20} />
              </motion.div> 
              : 
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={20} />
              </motion.div>
            }
          </AnimatePresence>
        </motion.button>

        {/* User Actions */}
        <motion.div 
          className="hidden md:flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1 rounded-full px-4 hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                <Link href="/create">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Post</span>
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full"></span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden group">
                    <Avatar className="h-9 w-9 border border-border/50 group-hover:border-primary transition-colors">
                      <AvatarImage src={profilePictureUrl || "/placeholder-avatar.jpg"} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 p-1 backdrop-blur-lg bg-card/95 border border-border/50 rounded-xl shadow-lg">
                  <div className="flex items-center justify-start gap-2 p-3 border-b border-border/30">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profilePictureUrl || "/placeholder-avatar.jpg"} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="p-1">
                    <DropdownMenuItem asChild className="rounded-lg flex items-center gap-2 py-2 transition-colors">
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg flex items-center gap-2 py-2 transition-colors">
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg flex items-center gap-2 py-2 transition-colors">
                      <Link href="/my-drafts" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        My Drafts
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg flex items-center gap-2 py-2 transition-colors">
                      <Link href="/" className="cursor-pointer">
                        <Home className="mr-2 h-4 w-4" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                  </div>
                  
                  <DropdownMenuSeparator className="my-1" />
                  
                  <div className="p-1">
                    <DropdownMenuItem 
                      onClick={handleLogout} 
                      className="rounded-lg flex items-center gap-2 py-2 text-red-600 focus:text-red-600 hover:bg-red-600/10 focus:bg-red-600/10 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="rounded-full px-4 hover:bg-primary/10 transition-colors" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" className="rounded-full px-5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:shadow-md hover:scale-105 transition-all duration-300" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </motion.div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden border-t"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="container py-6 space-y-4">
              <motion.div 
                className="flex flex-col space-y-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Link 
                  href="/" 
                  className="flex items-center gap-2 px-3 py-2.5 text-sm bg-muted/40 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link 
                  href="/explore" 
                  className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Compass className="h-4 w-4" />
                  Explore
                </Link>
                {user && (
                  <Link 
                    href="/groups" 
                    className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    Groups
                  </Link>
                )}
                <Link 
                  href="/about" 
                  className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Info className="h-4 w-4" />
                  About
                </Link>
              </motion.div>

              <motion.div 
                className="pt-2 border-t"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={profilePictureUrl || "/placeholder-avatar.jpg"} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Link 
                        href="/profile" 
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-muted/20 hover:bg-primary/10 rounded-lg hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      
                      <Link 
                        href="/settings" 
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-muted/20 hover:bg-primary/10 rounded-lg hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </div>
                    
                    <Link 
                      href="/create" 
                      className="flex items-center justify-center gap-2 py-2.5 text-sm bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-primary-foreground rounded-lg mt-2 hover:shadow-md transition-shadow"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      New Post
                    </Link>
                    
                    <Link 
                      href="/my-drafts" 
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      My Drafts
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm w-full text-left text-red-600 hover:bg-red-600/10 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-lg border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                      asChild
                    >
                      <Link 
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </Button>
                    
                    <Button 
                      className="w-full rounded-lg bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:shadow-md transition-shadow"
                      asChild
                    >
                      <Link 
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
} 