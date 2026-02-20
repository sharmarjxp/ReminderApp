import { supabase } from './supabase';
import { format, addDays } from 'date-fns';

// ── Fetch all tasks ──────────────────────────────────────────
export const getTasks = async () => {
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) { console.error('getTasks error:', error); return []; }
    return data || [];
};

// ── Add a new task ───────────────────────────────────────────
export const addTask = async (task) => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const { data, error } = await supabase
        .from('tasks')
        .insert([{
            title: task.title,
            message: task.message || '',
            date: task.date,
            time: task.time,
            completed: false,
            notified: false,
            user_id: userId,
        }])
        .select()
        .single();
    if (error) { console.error('addTask error:', error); return null; }
    return data;
};

// ── Update a task ────────────────────────────────────────────
export const updateTask = async (id, updates) => {
    const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('updateTask error:', error); return null; }
    return data;
};

// ── Delete a task ────────────────────────────────────────────
export const deleteTask = async (id) => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
    if (error) console.error('deleteTask error:', error);
};

// ── Reschedule single task to next day ───────────────────────
export const rescheduleToNextDay = async (id) => {
    const nextDay = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const { data, error } = await supabase
        .from('tasks')
        .update({ date: nextDay, notified: false, completed: false })
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('rescheduleToNextDay error:', error); return null; }
    return data;
};

// ── Reschedule ALL overdue tasks to next day ─────────────────
export const rescheduleAllOverdue = async () => {
    const nextDay = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    // Fetch all notified tasks
    const { data: notifiedTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('notified', true)
        .eq('completed', false);
    if (fetchError) { console.error('rescheduleAllOverdue fetch error:', fetchError); return []; }

    // Also include tasks with past dates that haven't been notified yet
    const { data: allTasks, error: allError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false);
    if (allError) { console.error('rescheduleAllOverdue allTasks error:', allError); return []; }

    const overdueIds = (allTasks || [])
        .filter(t => t.notified || isTaskOverdue(t))
        .map(t => t.id);

    if (overdueIds.length === 0) return allTasks || [];

    const { error: updateError } = await supabase
        .from('tasks')
        .update({ date: nextDay, notified: false, completed: false })
        .in('id', overdueIds);
    if (updateError) { console.error('rescheduleAllOverdue update error:', updateError); }

    // Return fresh list
    return await getTasks();
};

// ── Reschedule overdue tasks within a date range to next day ──
export const rescheduleByDateRange = async (fromDate, toDate) => {
    const nextDay = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const { data: allTasks, error: allError } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .gte('date', fromDate)
        .lte('date', toDate);
    if (allError) { console.error('rescheduleByDateRange fetch error:', allError); return []; }

    const overdueIds = (allTasks || [])
        .filter(t => t.notified || isTaskOverdue(t))
        .map(t => t.id);

    if (overdueIds.length === 0) return await getTasks();

    const { error: updateError } = await supabase
        .from('tasks')
        .update({ date: nextDay, notified: false, completed: false })
        .in('id', overdueIds);
    if (updateError) { console.error('rescheduleByDateRange update error:', updateError); }

    return await getTasks();
};

// ── Check if a task's time has passed ────────────────────────
export const isTaskOverdue = (task) => {
    if (!task.date || !task.time) return false;
    const now = new Date();
    const [year, month, day] = task.date.split('-').map(Number);
    let hour = task.time.hour;
    if (task.time.ampm === 'PM' && hour !== 12) hour += 12;
    if (task.time.ampm === 'AM' && hour === 12) hour = 0;
    const minute = task.time.minute === 60 ? 0 : task.time.minute;
    const taskDate = new Date(year, month - 1, day, hour, minute, 0);
    return taskDate < now;
};
