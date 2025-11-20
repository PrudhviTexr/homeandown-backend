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
  password: string;
  firstName: string;
  lastName: string;
  userType: 'buyer' | 'seller' | 'agent';
  phone?: string;
  city?: string;
  state?: string;
}

// Helper: find an Auth user by email using admin.listUsers (paginate up to 10 pages)
async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>["auth"]["admin"], email: string) {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 100;
  while (page <= 10) {
    const { data, error } = await adminClient.listUsers({ page, perPage } as any);
    if (error) {
      console.error('signup-user: admin.listUsers error on page', page, error);
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
  console.log("signup-user: request received");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("signup-user: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env.");
      return new Response(JSON.stringify({ success: false, error: "Server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const siteUrl = req.headers.get('x-site-url') || 'http://localhost:3000';
    const body: Body = await req.json();
  console.log("signup-user: body parsed, userType=", body?.userType);
    const email = body.email.toLowerCase();

  // Create auth user first; if it already exists, fetch it via admin.listUsers
  let authUser: any = null;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: body.password,
    user_metadata: { first_name: body.firstName, last_name: body.lastName, user_type: body.userType },
    email_confirm: false
  });
  if (createErr) {
    const msg = (createErr.message || '').toLowerCase();
    const isExisting = msg.includes('already') || msg.includes('registered') || msg.includes('exists') || (createErr.status === 422);
    if (!isExisting) {
      console.error("signup-user: createUser error:", createErr);
      return new Response(JSON.stringify({ success: false, error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    console.log('signup-user: user already exists in auth, searching by email');
    authUser = await findAuthUserByEmail(supabase.auth.admin as any, email);
    if (!authUser) {
      return new Response(JSON.stringify({ success: false, error: 'User already exists but could not be retrieved' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } else {
    authUser = created.user;
    console.log("signup-user: auth user created", authUser?.id);
  }

  // Ensure users row and role-specific rows
  const { data: userRow, error: userRowErr } = await supabase.from('users').select('id, user_type').eq('id', authUser.id).maybeSingle();
  if (userRowErr) {
    console.error("signup-user: fetch users row error:", userRowErr);
  }
  if (!userRow) {
  console.log("signup-user: inserting users row");
      let { error: insUserErr } = await supabase.from('users').insert({
        id: authUser.id,
        email,
        first_name: body.firstName,
        last_name: body.lastName,
        user_type: body.userType,
        phone_number: body.phone || '',
        city: body.city || '',
        state: body.state || '',
        status: body.userType === 'buyer' ? 'active' : 'pending',
        verification_status: body.userType === 'buyer' ? 'verified' : 'pending',
        email_verified: false
      });
      if (insUserErr) {
        const msg = (insUserErr.message || '').toLowerCase();
        const isDup = msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('users_email_key');
        console.error("signup-user: insert users row error:", insUserErr);
        if (isDup) {
          console.warn('signup-user: recovering from duplicate email by replacing stale users row');
          const { data: existingByEmail } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
          if (existingByEmail && existingByEmail.id !== authUser.id) {
            // Delete stale user row (will cascade to dependent tables), then reinsert
            await supabase.from('users').delete().eq('id', existingByEmail.id);
            const retry = await supabase.from('users').insert({
              id: authUser.id,
              email,
              first_name: body.firstName,
              last_name: body.lastName,
              user_type: body.userType,
              phone_number: body.phone || '',
              city: body.city || '',
              state: body.state || '',
              status: body.userType === 'buyer' ? 'active' : 'pending',
              verification_status: body.userType === 'buyer' ? 'verified' : 'pending',
              email_verified: false
            });
            insUserErr = retry.error as any;
          }
        }
        if (insUserErr) {
          return new Response(JSON.stringify({ success: false, error: insUserErr.message || 'Failed to insert user row' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      if (body.userType === 'seller') {
        const { error: spErr } = await supabase.from('seller_profiles').insert({ user_id: authUser.id, business_name: '', business_type: '', verification_status: 'pending', status: 'pending' });
        if (spErr) console.error("signup-user: insert seller_profiles error:", spErr);
        const { error: uaErr } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
        if (uaErr) console.error("signup-user: insert user_approvals error:", uaErr);
      }
      if (body.userType === 'agent') {
        const { error: apErr } = await supabase.from('agent_profiles').insert({ user_id: authUser.id, specialization: '', bio: '', experience_years: 0 });
        if (apErr) console.error("signup-user: insert agent_profiles error:", apErr);
        const { error: uaErr2 } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
        if (uaErr2) console.error("signup-user: insert user_approvals (agent) error:", uaErr2);
      }
    } else {
      // Existing user wants to sign up for another role (e.g., buyer -> agent)
      if (body.userType === 'agent') {
        const { data: ap } = await supabase.from('agent_profiles').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!ap) {
          await supabase.from('agent_profiles').insert({ user_id: authUser.id, specialization: '', bio: '', experience_years: 0 });
        }
        const { data: ua } = await supabase.from('user_approvals').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!ua) {
          await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
        }
        const { error: updUserErr1 } = await supabase.from('users').update({ verification_status: 'pending', status: 'pending' }).eq('id', authUser.id);
        if (updUserErr1) console.error("signup-user: update users (agent) error:", updUserErr1);
      }
      if (body.userType === 'seller') {
        const { data: sp } = await supabase.from('seller_profiles').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!sp) {
          const { error: insSpErr } = await supabase.from('seller_profiles').insert({ user_id: authUser.id, business_name: '', business_type: '', verification_status: 'pending', status: 'pending' });
          if (insSpErr) console.error("signup-user: insert seller_profiles (upgrade) error:", insSpErr);
        }
        const { data: ua2 } = await supabase.from('user_approvals').select('user_id').eq('user_id', authUser.id).maybeSingle();
        if (!ua2) {
          const { error: insUaErr } = await supabase.from('user_approvals').insert({ user_id: authUser.id, status: 'pending', submitted_at: new Date().toISOString() });
          if (insUaErr) console.error("signup-user: insert user_approvals (seller upgrade) error:", insUaErr);
        }
        const { error: updUserErr2 } = await supabase.from('users').update({ verification_status: 'pending', status: 'pending' }).eq('id', authUser.id);
        if (updUserErr2) console.error("signup-user: update users (seller) error:", updUserErr2);
      }
    }

    // Generate token via RPC; on failure, fallback to local generation + direct insert
    let tokenData: string | null = null;
    const { data: rpcToken, error: tokenError } = await supabase.rpc('generate_verification_token', { user_id_param: authUser.id });
    console.log("signup-user: RPC generate_verification_token result", { hasToken: !!rpcToken, hasError: !!tokenError });
    if (tokenError || !rpcToken) {
      console.error("signup-user: RPC generate_verification_token failed, falling back:", tokenError);
      // Fallback: local token generation
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const { error: insTokErr } = await supabase.from('email_verification_tokens').insert({
        user_id: authUser.id,
        token,
        expires_at: expiresAt
      });
      if (insTokErr) {
        console.error("signup-user: fallback insert email_verification_tokens error:", insTokErr);
        return new Response(JSON.stringify({ success: false, error: 'Failed to generate token' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      tokenData = token;
    } else {
      tokenData = rpcToken as string;
    }

  const verificationUrl = `${siteUrl}/email-verification?token=${tokenData}`;
  console.log("signup-user: success for", email);
  return new Response(JSON.stringify({ success: true, userId: authUser.id, verificationUrl, token: tokenData }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error("signup-user: unhandled error:", e);
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
