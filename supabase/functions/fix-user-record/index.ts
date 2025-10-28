// @ts-nocheck
// Deno edge function: TypeScript checking is disabled in the editor to avoid Node/TS tooling errors.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-site-url, x-supabase-authorization, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  email: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>["auth"]["admin"], email: string) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 100;
  while (page <= 10) {
    const { data, error } = await adminClient.listUsers({ page, perPage } as any);
    if (error) {
      console.error('fix-user-record: admin.listUsers error on page', page, error);
      break;
    }
    const users = (data as any)?.users || [];
    const found = users.find((u: any) => (u?.email || '').toLowerCase() === target);
    if (found) return found;
    if (!users.length || users.length < perPage) break;
    page += 1;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
      console.log('fix-user-record: request received');
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("fix-user-record: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.");
      return new Response(JSON.stringify({ success: false, error: "Server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    const body: Body = await req.json();
      console.log('fix-user-record: body parsed userType=', body?.userType);
    const { email, firstName = "", lastName = "", userType = "buyer" } = body;
    const siteUrl = req.headers.get('x-site-url') || 'http://localhost:3000';

  // 1) Find auth user by email
  const authUser = await findAuthUserByEmail(supabase.auth.admin as any, email);
    if (!authUser) {
      return new Response(JSON.stringify({ success: false, error: 'No auth user found for email' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2) Ensure users row exists (or update user_type to include desired role when appropriate)
  const { data: userRow, error: userRowErr } = await supabase
      .from('users')
      .select('id, user_type, verification_status, status')
      .eq('id', authUser.id)
      .maybeSingle();
      console.log('fix-user-record: users row exists?', !!userRow);
  if (userRowErr) console.error("fix-user-record: fetch users row error:", userRowErr);

    if (!userRow) {
      let { error: insUserErr } = await supabase.from('users').insert({
        id: authUser.id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
        status: userType === 'buyer' ? 'active' : 'pending',
        verification_status: userType === 'buyer' ? 'verified' : 'pending',
        email_verified: false
      });
        console.log('fix-user-record: inserted users row');
      if (insUserErr) {
        const msg = (insUserErr.message || '').toLowerCase();
        const isDup = msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('users_email_key');
        console.error("fix-user-record: insert users row error:", insUserErr);
        if (isDup) {
          console.warn('fix-user-record: recovering from duplicate email by replacing stale users row');
          const { data: existingByEmail } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
          if (existingByEmail && existingByEmail.id !== authUser.id) {
            await supabase.from('users').delete().eq('id', existingByEmail.id);
            const retry = await supabase.from('users').insert({
              id: authUser.id,
              email: email.toLowerCase(),
              first_name: firstName,
              last_name: lastName,
              user_type: userType,
              status: userType === 'buyer' ? 'active' : 'pending',
              verification_status: userType === 'buyer' ? 'verified' : 'pending',
              email_verified: false
            });
            insUserErr = retry.error as any;
          }
        }
        if (insUserErr) {
          return new Response(JSON.stringify({ success: false, error: insUserErr.message || 'Failed to insert user row' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      if (userType === 'agent') {
  const { error: uaInsErrA } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
  if (uaInsErrA) console.error("fix-user-record: insert user_approvals (agent) error:", uaInsErrA);
      }
      if (userType === 'seller') {
  const { error: spInsErr } = await supabase.from('seller_profiles').insert({ user_id: authUser.id, business_name: '', business_type: '', verification_status: 'pending', status: 'pending' });
  if (spInsErr) console.error("fix-user-record: insert seller_profiles error:", spInsErr);
  const { error: uaInsErrS } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
  if (uaInsErrS) console.error("fix-user-record: insert user_approvals (seller) error:", uaInsErrS);
      }
    } else {
      // If the user exists and is a buyer, but trying to become agent or seller, add the role-specific rows
      if (userType === 'agent') {
        const { data: ap } = await supabase.from('agent_profiles').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!ap) {
          const { error: apInsErr } = await supabase.from('agent_profiles').insert({ user_id: authUser.id, specialization: '', bio: '', experience_years: 0 });
          if (apInsErr) console.error("fix-user-record: insert agent_profiles (upgrade) error:", apInsErr);
            console.log('fix-user-record: created agent_profiles');
        }
        const { data: ua } = await supabase.from('user_approvals').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!ua) {
          const { error: uaInsErr } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
          if (uaInsErr) console.error("fix-user-record: insert user_approvals (agent upgrade) error:", uaInsErr);
            console.log('fix-user-record: created user_approvals');
        } else {
          const { error: uaUpdErr } = await supabase.from('user_approvals').update({ status: 'pending', submitted_at: new Date().toISOString() }).eq('user_id', authUser.id);
          if (uaUpdErr) console.error("fix-user-record: update user_approvals (agent) error:", uaUpdErr);
        }
        const { error: updUserErr1 } = await supabase.from('users').update({ verification_status: 'pending', status: 'pending' }).eq('id', authUser.id);
        if (updUserErr1) console.error("fix-user-record: update users (agent) error:", updUserErr1);
      }
      if (userType === 'seller') {
        const { data: sp } = await supabase.from('seller_profiles').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!sp) {
          const { error: spInsErr2 } = await supabase.from('seller_profiles').insert({ user_id: authUser.id, business_name: '', business_type: '', verification_status: 'pending', status: 'pending' });
          if (spInsErr2) console.error("fix-user-record: insert seller_profiles (upgrade) error:", spInsErr2);
        } else {
          const { error: spUpdErr } = await supabase.from('seller_profiles').update({ verification_status: 'pending', status: 'pending' }).eq('user_id', authUser.id);
          if (spUpdErr) console.error("fix-user-record: update seller_profiles (upgrade) error:", spUpdErr);
        }
        const { data: ua2 } = await supabase.from('user_approvals').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!ua2) {
          const { error: uaInsErr2 } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
          if (uaInsErr2) console.error("fix-user-record: insert user_approvals (seller upgrade) error:", uaInsErr2);
        } else {
          const { error: uaUpdErr2 } = await supabase.from('user_approvals').update({ status: 'pending', submitted_at: new Date().toISOString() }).eq('user_id', authUser.id);
          if (uaUpdErr2) console.error("fix-user-record: update user_approvals (seller) error:", uaUpdErr2);
        }
        const { error: updUserErr2 } = await supabase.from('users').update({ verification_status: 'pending', status: 'pending' }).eq('id', authUser.id);
        if (updUserErr2) console.error("fix-user-record: update users (seller) error:", updUserErr2);
      }
    }

    // 3) Generate verification token
    const { data: rpcToken, error: tokenError } = await supabase.rpc('generate_verification_token', { user_id_param: authUser.id });
    let tokenData: string | null = null;
    if (tokenError || !rpcToken) {
      console.error("fix-user-record: RPC generate_verification_token failed, falling back:", tokenError);
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { error: insTokErr } = await supabase.from('email_verification_tokens').insert({ user_id: authUser.id, token, expires_at: expiresAt });
      if (insTokErr) {
        console.error("fix-user-record: fallback insert email_verification_tokens error:", insTokErr);
        return new Response(JSON.stringify({ success: false, error: 'Failed to generate token' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      tokenData = token;
    } else {
      tokenData = rpcToken as string;
    }

    const verificationUrl = `${siteUrl}/email-verification?token=${tokenData}`;

    return new Response(JSON.stringify({ success: true, userId: authUser.id, verificationUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error("fix-user-record: unhandled error:", e);
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
