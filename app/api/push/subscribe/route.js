import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
    try {
        const body = await request.json();
        const { endpoint, p256dh, auth, timezone } = body;

        if (!endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Verify the user via their access token
        const authorization = request.headers.get('Authorization');
        if (!authorization) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authorization.replace('Bearer ', '');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Use service role to bypass RLS for insert
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error: insertError } = await adminSupabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint,
                p256dh,
                auth,
                timezone: timezone || 'UTC',
            }, { onConflict: 'endpoint' });

        if (insertError) {
            console.error('[push/subscribe] Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        console.log('[push/subscribe] Saved subscription for user:', user.id);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[push/subscribe] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
