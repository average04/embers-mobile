import { supabase } from '@/lib/supabase/client'

export function useAuth() {

  async function signIn(email: string, password: string, captchaToken?: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, captchaToken?: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    })
    return { error: error?.message ?? null }
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut()
    // clear() is handled by onAuthStateChange in _layout.tsx
  }

  async function resetPassword(email: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error: error?.message ?? null }
  }

  return { signIn, signUp, signOut, resetPassword }
}
