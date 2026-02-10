import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
 Settings,
 HelpCircle,
 LogOut,
 ChevronDown,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmProvider } from '@/components/confirm-dialog'
import { NotificationsPopover } from '@/components/notifications-popover'
import { CommandPalette } from '@/components/command-palette'
import { MobileNav } from '@/components/mobile-nav'
import { Sidebar } from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProductTour } from '@/components/product-tour'

import { getUserProfile } from '@/lib/actions/settings'

async function signOut() {
 'use server'
 const supabase = await createClient()
 await supabase.auth.signOut()
 redirect('/login')
}

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode
}) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
  redirect('/login')
 }

 // Fetch user profile for avatar
 const result = await getUserProfile()
 // If error or no profile, we still have user from auth
 const profile = 'profile' in result ? result.profile : null

 return (
  <ConfirmProvider>
   <div className="min-h-screen bg-muted/20 dark:bg-background">
    {/* Sidebar - Client Component */}
    <Sidebar />

    {/* Main Content */}
    <main className="lg:pl-60 min-h-screen flex flex-col">
     <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      {/* Mobile Menu + Command Palette */}
      <div className="flex items-center gap-3">
       <MobileNav />
       <div id="command-palette-trigger" className="hidden sm:block">
        <CommandPalette />
       </div>
      </div>

      {/* Right side: Notifications + Account */}
      <div className="flex items-center gap-4">
       <div id="theme-toggle">
        <ThemeToggle />
       </div>
       <div id="notifications-trigger">
        <NotificationsPopover />
       </div>

       {/* Account Dropdown */}
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
         <button className="flex items-center gap-2 hover:bg-muted rounded-lg px-3 py-2 transition-colors">
          <Avatar className="h-8 w-8">
           <AvatarImage src={profile?.avatarUrl || ''} />
           <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
            {profile?.firstName?.[0] || user.email?.[0].toUpperCase()}
           </AvatarFallback>
          </Avatar>
          <div className="text-left hidden sm:block">
           <p className="text-sm font-medium text-foreground">
            {user.email?.split('@')[0]}
           </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
         </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
         <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.email?.split('@')[0]}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
         </div>
         <DropdownMenuSeparator />
         <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="cursor-pointer">
           <Settings className="w-4 h-4 mr-2" />
           Paramètres
          </Link>
         </DropdownMenuItem>
         <DropdownMenuItem asChild>
          <Link href="/dashboard/help" className="cursor-pointer">
           <HelpCircle className="w-4 h-4 mr-2" />
           Aide
          </Link>
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <form action={signOut}>
          <DropdownMenuItem asChild>
           <button type="submit" className="w-full cursor-pointer text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
           </button>
          </DropdownMenuItem>
         </form>
        </DropdownMenuContent>
       </DropdownMenu>
      </div>
     </header>
     <div className="p-4 lg:p-8 flex-1 animate-fade-in">
      {children}
     </div>
    </main>
   </div>
   <ProductTour />
  </ConfirmProvider>
 )
}
