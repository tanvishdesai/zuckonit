'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserCircle2 } from 'lucide-react';

export default function ProfileRedirectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        router.push(`/user/${user.$id}`);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <section
        className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 rounded-3xl shadow-2xl p-10 flex flex-col items-center gap-6 max-w-md w-full border border-white/30 dark:border-gray-700/40"
        aria-label="Redirecting to profile"
      >
        <div className="relative flex items-center justify-center">
          <span className="absolute animate-ping inline-flex h-24 w-24 rounded-full bg-primary/30 opacity-75"></span>
          <UserCircle2 className="h-24 w-24 text-primary drop-shadow-lg" aria-hidden="true" />
          <Loader2 className="h-10 w-10 text-primary absolute animate-spin" aria-label="Loading" />
        </div>
        <h1 className="text-4xl font-extrabold text-center text-foreground drop-shadow-sm">
          {user?.name ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Welcome Back!'}
        </h1>
        <p className="text-lg text-center text-muted-foreground">
          {isLoading ? 'Redirecting you to your profile...' : 'Almost there!'}
        </p>
        <div className="w-full flex justify-center mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">If you are not redirected, please check your connection.</span>
        </div>
      </section>
    </main>
  );
} 