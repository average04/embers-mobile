import { supabase } from '@/lib/supabase/client'

export function useAuth() {

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    // clear() is handled by onAuthStateChange in _layout.tsx
  }

  async function sendMagicLink(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error: error?.message ?? null }
  }

  return { signIn, signUp, signOut, sendMagicLink }
}
