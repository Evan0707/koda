import { AuthBackground } from '@/components/auth/auth-background'

export default function AuthLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
  <div className="min-h-screen flex items-center justify-center p-4">
   <AuthBackground />

   <div className="w-full max-w-md">
    {/* Logo */}
    <div className="text-center mb-8 relative z-10">
     <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
      Koda<span className="text-foreground">Flow</span>
     </h1>
     <p className="text-muted-foreground mt-2 text-sm font-medium">Tout-en-un pour freelances</p>
    </div>

    {/* Auth Card */}
    <div className="bg-background/40 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/5 p-8 shadow-2xl relative z-10 overflow-hidden">
     {/* Subtle highlight effect */}
     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
     {children}
    </div>
   </div>
  </div>
 )
}
