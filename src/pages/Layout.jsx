
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { 
  Home, 
  Users, 
  Briefcase, 
  Target, 
  Handshake, 
  Info,
  Menu,
  X,
  UserCircle,
  LogOut,
  LogIn,
  LayoutDashboard,
  Camera,
  Mail,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import Logo from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";

const navigationItems = [
  { title: "Home", url: createPageUrl("Home"), icon: Home },
  { title: "Athletes", url: createPageUrl("Athletes"), icon: Users },
  { title: "Companies", url: createPageUrl("Companies"), icon: Briefcase },
  { title: "Affiliates", url: createPageUrl("Partners"), icon: Handshake },
  { title: "Pricing", url: createPageUrl("Pricing"), icon: Target },
  { title: "Book a Campaign", url: createPageUrl("BookCampaign"), icon: Camera },
  { title: "About", url: createPageUrl("About"), icon: Info },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [hasSubscribedThisSession, setHasSubscribedThisSession] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async (email) => {
        const existingUsers = await base44.entities.User.filter({ email: email });
        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            if (existingUser.is_newsletter_subscriber) {
                throw new Error("This email is already subscribed.");
            } else {
                await base44.entities.User.update(existingUser.id, { is_newsletter_subscriber: true });
                return;
            }
        }
        
        const existingSubscribers = await base44.entities.NewsletterSubscriber.filter({ email: email });
        if (existingSubscribers.length > 0) {
            throw new Error("This email is already subscribed.");
        }

        return base44.entities.NewsletterSubscriber.create({ email: email });
    },
    onSuccess: () => {
        setNewsletterMessage("Thanks for subscribing!");
        setNewsletterEmail('');
        setTimeout(() => setNewsletterMessage(''), 3000);
    },
    onError: (error) => {
        setNewsletterMessage(error.message || "An error occurred.");
        setTimeout(() => setNewsletterMessage(''), 3000);
    }
  });

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) {
        setNewsletterMessage("Please enter a valid email.");
        setTimeout(() => setNewsletterMessage(''), 3000);
        return;
    }
    subscribeMutation.mutate(newsletterEmail);
  };
  
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Only auto-subscribe ONCE per session and only if they just logged in
        if (currentUser && !currentUser.is_newsletter_subscriber && !hasSubscribedThisSession) {
          await base44.auth.updateMe({ is_newsletter_subscriber: true });
          setHasSubscribedThisSession(true);
          setUser(prevUser => ({ ...prevUser, is_newsletter_subscriber: true }));
        }
      } catch (error) {
        // User is not logged in, this is expected for public pages
        console.log('User not authenticated (this is normal for public pages)');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []); // Only run once on mount


  if (currentPageName === "Admin" || currentPageName === "StripeCheckout" || currentPageName === "AthleticDepartmentPortal") {
    return <>{children}</>;
  }

  const renderUserActions = (isMobile = false) => {
    if (isLoading) {
      return <Skeleton className="h-10 w-24" />;
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 hover:text-white px-3">
              <UserCircle className="w-5 h-5" />
              <span className="hidden md:inline">{user.full_name?.split(' ')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user.account_type === 'athlete' && (
                <DropdownMenuItem asChild><Link to={createPageUrl('AthleteDashboard')}><LayoutDashboard className="mr-2 h-4 w-4" /><span>Dashboard</span></Link></DropdownMenuItem>
            )}
            {user.account_type === 'company' && (
                <DropdownMenuItem asChild><Link to={createPageUrl('CompanyDashboard')}><LayoutDashboard className="mr-2 h-4 w-4" /><span>Dashboard</span></Link></DropdownMenuItem>
            )}
            {user.role === 'admin' && (
               <DropdownMenuItem asChild>
                 <Link to={createPageUrl('Admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                 </Link>
               </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => base44.auth.logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className={`flex items-center gap-2 ${isMobile ? 'flex-col w-full' : ''}`}>
        <Button variant="outline" className="bg-transparent text-white border-white/50 hover:bg-white hover:text-[#1C2E45] w-full" onClick={() => base44.auth.redirectToLogin()}>
          <LogIn className="w-4 h-4 mr-2" />
          Log In
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-[#DED4C4] text-[#1C2E45] hover:bg-[#E7E0DA] w-full">Sign Up</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('AthleteSignup')}>Join as Athlete</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('CompanySignup')}>Join as Company</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600&family=Montserrat:wght@300;500;700&display=swap');
        
        :root {
          --primary: #1C2E45;
          --primary-foreground: #FFFFFF;
          --secondary: #FFFFFF;
          --secondary-foreground: #1C2E45;
          --muted: #F8F5F2;
          --muted-foreground: #666666;
          --accent: #946b56;
          --accent-foreground: #FFFFFF;
          --contrast: #DED4C4;
          --destructive: #D9534F;
          --border: #E7E0DA;
          --input: #E7E0DA;
          --ring: #1C2E45;
          --background: #F8F5F2;
          --foreground: #333333;
          --surface: #F6F4F0;
          
          --font-heading: 'Lora', serif;
          --font-body: 'Montserrat', sans-serif;
        }
        
        body {
          font-family: var(--font-body);
          font-weight: 500;
          color: var(--foreground);
        }
        
        h1, h2, h3, h4, h5, h6, .heading-font {
          font-family: var(--font-heading);
          font-weight: 600;
        }
        
        .button, .btn, button, [role="button"] {
            font-weight: 300 !important;
            letter-spacing: 0.5px;
        }

        .text-medium {
          font-weight: 500;
        }
        
        .text-semibold {
          font-weight: 700;
        }
      `}</style>
      
      {/* Navigation */}
      <nav className="bg-[#1C2E45] border-b border-[#E7E0DA]/20 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Logo />

            <div className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? "bg-[#DED4C4] text-[#1C2E45]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>

            <div className="hidden md:flex items-center">
              {renderUserActions()}
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#1C2E45] border-[#E7E0DA]/20 flex flex-col">
                <div className="flex flex-col gap-4 mt-8 flex-grow">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.title}
                        to={item.url}
                        onClick={() => setMobileOpen(false)}
                        className={`px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-3 ${
                          isActive
                            ? "bg-[#DED4C4] text-[#1C2E45]"
                            : "text-white hover:bg-white/10"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
                 <div className="mt-auto p-4 border-t border-white/10">
                  {renderUserActions(true)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-5rem)]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1C2E45] text-white border-t border-[#E7E0DA]/20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <Logo size="small" />
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                Bridged: A future beyond the game.
              </p>
              {base44.agents?.getWhatsAppConnectURL && (
                <div className="mt-4">
                    <a href={base44.agents.getWhatsAppConnectURL('bridged_assistant')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#DED4C4] transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        Chat on WhatsApp
                    </a>
                </div>
              )}
            </div>
            
            <div className="md:col-start-2 lg:col-start-auto">
              <h3 className="font-semibold mb-4 text-[#DED4C4] heading-font">Quick Links</h3>
              <ul className="space-y-2">
                {navigationItems
                  .filter(item => item.title !== "Book a Campaign" && item.title !== "Home") 
                  .map((item) => (
                  <li key={item.title}>
                    <Link
                      to={item.url}
                      className="text-gray-300 hover:text-[#DED4C4] transition-colors text-sm"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
                 <li>
                  <a href="mailto:nbowles@bridged.agency" className="text-gray-300 hover:text-[#DED4C4] transition-colors text-sm">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h3 className="font-semibold mb-4 text-[#DED4C4] heading-font">Newsletter</h3>
              <p className="text-gray-300 text-sm mb-4">
                Get the latest tips, opportunities, and success stories.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input 
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-[#DED4C4]"
                  disabled={subscribeMutation.isPending}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="bg-[#DED4C4] text-[#1C2E45] hover:bg-[#E7E0DA] flex-shrink-0"
                  disabled={subscribeMutation.isPending}
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </form>
              {newsletterMessage && <p className="text-sm mt-2 text-[#DED4C4]">{newsletterMessage}</p>}
              <p className="text-xs text-gray-400 mt-2">
                All account sign-ups automatically subscribe.
              </p>
            </div>
          </div>
          
          <div className="border-t border-[#E7E0DA]/20 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 Bridged. All rights reserved. Empowering athletes to build their future.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
