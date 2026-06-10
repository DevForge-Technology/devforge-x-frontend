import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (token) {
    await client.auth.setSession({
      access_token: token,
      refresh_token: cookieStore.get('sb-refresh-token')?.value ?? '',
    });
  }

  return client;
}
