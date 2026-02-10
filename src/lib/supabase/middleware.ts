import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
 let supabaseResponse = NextResponse.next({
  request,
 })

 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

 // Skip Supabase auth if credentials are not configured
 if (!supabaseUrl || !supabaseAnonKey) {
  return supabaseResponse
 }

 const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
   getAll() {
    return request.cookies.getAll()
   },
   setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
    supabaseResponse = NextResponse.next({
     request,
    })
    cookiesToSet.forEach(({ name, value, options }) =>
     supabaseResponse.cookies.set(name, value, options)
    )
   },
  },
 })

 // Refresh session if expired
 const {
  data: { user },
 } = await supabase.auth.getUser()

 // Define route patterns
 const pathname = request.nextUrl.pathname
 const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password')
 const isOnboardingRoute = pathname.startsWith('/onboarding')
 const isDashboardRoute = pathname.startsWith('/dashboard')
 const isUpdatePasswordRoute = pathname.startsWith('/update-password')
 const isProtectedRoute = isDashboardRoute || isOnboardingRoute || isUpdatePasswordRoute

 // Redirect logic
 if (isProtectedRoute && !user) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
 }

 if (isAuthRoute && user) {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  return NextResponse.redirect(url)
 }

 // Check if user has completed onboarding (has a profile in users table)
 if (user && isDashboardRoute) {
  const { data: profile } = await supabase
   .from('users')
   .select('id')
   .eq('id', user.id)
   .single()

  // If no profile, redirect to onboarding
  if (!profile) {
   const url = request.nextUrl.clone()
   url.pathname = '/onboarding'
   return NextResponse.redirect(url)
  }
 }

 // If user has profile and tries to access onboarding, redirect to dashboard
 if (user && isOnboardingRoute) {
  const { data: profile } = await supabase
   .from('users')
   .select('id')
   .eq('id', user.id)
   .single()

  if (profile) {
   const url = request.nextUrl.clone()
   url.pathname = '/dashboard'
   return NextResponse.redirect(url)
  }
 }

 return supabaseResponse
}
