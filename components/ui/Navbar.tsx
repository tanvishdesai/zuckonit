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
import { PlusCircle, LogOut, User, Home, Menu, X, Settings, Compass, Info, Users, FileText } from 'lucide-react';
import { useState } from 'react';
import { getProfilePictureUrl } from '@/lib/appwrite';

export function Navbar() {
  const { user, logout, getProfilePicture } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profilePictureId = user ? getProfilePicture() : null;
  const profilePictureUrl = profilePictureId ? getProfilePictureUrl(profilePictureId).toString() : null;

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl text-primary">Zuckonit</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link href="/explore" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <span className="flex items-center gap-1">
              <Compass className="h-4 w-4" />
              Explore
            </span>
          </Link>
          {user && (
            <Link href="/groups" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Groups
              </span>
            </Link>
          )}
          <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <span className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              About
            </span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-md hover:bg-accent"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* User Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link href="/create">
                  <PlusCircle className="h-4 w-4" />
                  <span>New Post</span>
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={profilePictureUrl || "/placeholder-avatar.jpg"} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-drafts" className="cursor-pointer">
                      <FileText className="mr-2 h-4 w-4" />
                      My Drafts
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t animate-fade-in">
          <div className="container py-4 space-y-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/" 
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link 
                href="/explore" 
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Compass className="h-4 w-4" />
                Explore
              </Link>
              {user && (
                <Link 
                  href="/groups" 
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded text-muted-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  Groups
                </Link>
              )}
              <Link 
                href="/about" 
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Info className="h-4 w-4" />
                About
              </Link>
            </div>

            <div className="pt-2 border-t">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profilePictureUrl || "/placeholder-avatar.jpg"} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link 
                    href="/my-drafts" 
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    My Drafts
                  </Link>
                  
                  <Link 
                    href="/create" 
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    New Post
                  </Link>
                  
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded text-red-600 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link 
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link 
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 