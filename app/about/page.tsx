
import { Card, CardContent } from '@/components/ui/card';
import { Cpu,  ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container max-w-7xl py-10 animate-fade-in">
      {/* Hero Section with gradient styling */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]">
          About Zuckonit
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] mx-auto my-6 rounded-full"></div>
        <p className="mt-4 text-xl text-foreground max-w-2xl mx-auto leading-relaxed">
          Born out of a midnight burst of inspiration, Zuckonit is my personal playground where code meets creativity. With design liberties taken to new heights and functionality intact, this project is a tribute to the raw drive of building something unique—even when the world is fast asleep.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]">
            My Midnight Manifesto
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] mx-auto my-4 rounded-full"></div>
          <div className="mt-6 max-w-3xl mx-auto">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Every great idea begins in the stillness of the night. Fueled by passion and persistence, Zuckonit was built during those hours when distractions fade and the mind focuses solely on creation. This project isnt just a replication—its an expression of my commitment to building innovative solutions that make a mark.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Section with cards */}
      <div className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]">
            The Technology Behind Zuckonit
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] mx-auto my-4 rounded-full"></div>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Crafted with modern tools to ensure every line of code serves its purpose.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border border-border/40 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <CardContent className="p-6">
              <div className="rounded-full bg-primary/10 h-16 w-16 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Next.js</h3>
              <p className="text-muted-foreground">Leveraging React with server-side rendering for optimal performance</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border/40 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <CardContent className="p-6">
              <div className="rounded-full bg-primary/10 h-16 w-16 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Appwrite</h3>
              <p className="text-muted-foreground">A secure backend service for authentication and data storage</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border/40 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <CardContent className="p-6">
              <div className="rounded-full bg-primary/10 h-16 w-16 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Tailwind CSS</h3>
              <p className="text-muted-foreground">A utility-first framework for rapid UI development</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-border/40 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <CardContent className="p-6">
              <div className="rounded-full bg-primary/10 h-16 w-16 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 10L14 14L10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 22V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 2V14C4 15.0609 4.42143 16.0783 5.17157 16.8284C5.92172 17.5786 6.93913 18 8 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg mb-2">TypeScript</h3>
              <p className="text-muted-foreground">Typed JavaScript for robust, maintainable code</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center py-10 mb-10 bg-muted/40 rounded-xl border border-border/40">
        <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Join our community and start sharing your own creative ideas.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="/create" className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-6 rounded-md flex items-center justify-center">
            Start Writing
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <a href="/register" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground py-2 px-6 rounded-md flex items-center justify-center">
            Join the Community
          </a>
        </div>
      </div>
    </div>
  );
}
