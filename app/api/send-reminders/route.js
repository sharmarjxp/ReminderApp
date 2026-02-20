import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Use Node.js runtime (web-push requires Node crypto)
export const runtime = 'nodejs';

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Helpers to convert local time parts from a Date + timezone
function getLocalTimeParts(date, timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
    const parts = formatter.formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value ?? '';

    const year = get('year');
    const month = get('month');
    const day = get('day');
    const localDate = `${year}-${month}-${day}`;                   // YYYY-MM-DD
    const localHour = parseInt(get('hour'), 10);                   // 1–12
    const localMinute = parseInt(get('minute'), 10);               // 0–59
    const localAmPm = (get('dayPeriod') || get('literal')).toUpperCase().includes('PM') ? 'PM' : 'AM';

    return { localDate, localHour, localMinute, localAmPm };
}

export async function GET(request) {
    // Security: require the cron secret
    const authHeader = request.headers.get('Authorization') || '';
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch all push subscriptions
    const { data: subscriptions, error: subError } = await adminSupabase
        .from('push_subscriptions')
        .select('*');

    if (subError) {
        console.error('[send-reminders] Failed to fetch subscriptions:', subError);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }

    const now = new Date();
    let totalSent = 0;
    let totalChecked = 0;

    for (const sub of subscriptions || []) {
        const { localDate, localHour, localMinute, localAmPm } = getLocalTimeParts(
            now,
            sub.timezone || 'UTC'
        );

        // 2. Fetch incomplete, unnotified tasks that match today's date
        // Note: Filters by date but NOT user_id as the existing schema lacks user_id
        const { data: tasks, error: taskError } = await adminSupabase
            .from('tasks')
            .select('*')
            .eq('date', localDate)
            .eq('completed', false)
            .eq('notified', false);

        if (taskError) {
            console.error(`[send-reminders] Task fetch error:`, taskError);
            continue;
        }

        // 3. Filter tasks due at this exact minute (matching the same logic as the frontend)
        const dueTasks = (tasks || []).filter(task => {
            const { hour, minute, ampm } = task.time;
            const taskMinute = minute === 60 ? 0 : parseInt(minute, 10);
            return (
                parseInt(hour, 10) === localHour &&
                taskMinute === localMinute &&
                ampm.toUpperCase() === localAmPm
            );
        });

        totalChecked += tasks?.length ?? 0;

        // 4. Send a push for each due task
        for (const task of dueTasks) {
            const payload = JSON.stringify({
                id: task.id,
                title: task.title,
                message: task.message || 'Time to get it done!',
            });

            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            };

            try {
                await webpush.sendNotification(pushSubscription, payload);
                totalSent++;

                // Mark as notified so it doesn't fire again
                await adminSupabase
                    .from('tasks')
                    .update({ notified: true })
                    .eq('id', task.id);

            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired — clean it up
                    console.log('[send-reminders] Removing expired subscription:', sub.endpoint);
                    await adminSupabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                } else {
                    console.error('[send-reminders] Push error:', err.statusCode, err.body);
                }
            }
        }
    }

    console.log(`[send-reminders] ${new Date().toISOString()} — checked: ${totalChecked}, sent: ${totalSent}`);
    return NextResponse.json({
        ok: true,
        time: now.toISOString(),
        checked: totalChecked,
        sent: totalSent,
    });
}
