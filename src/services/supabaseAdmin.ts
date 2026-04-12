/**
 * Supabase Admin Client (서버 전용)
 *
 * Service Role 키를 사용하여 RLS를 우회한다. 서버 API Route에서만 import 하며,
 * 절대 클라이언트 번들에 포함되어서는 안 된다.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !serviceRoleKey) {
  // 빌드 타임 경고 (런타임에는 라우트별로 체크)
  console.warn(
    '[supabaseAdmin] SUPABASE env not fully configured. Server routes that require admin access will fail.'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
