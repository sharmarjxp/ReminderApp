
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Bell, BellOff, ArrowUp, ArrowDown, RotateCcw, LogOut } from 'lucide-react';
import TaskModal from '../components/TaskModal';
import RescheduleRangeModal from '../components/RescheduleRangeModal';
import LoginPage from '../components/LoginPage';
import TaskItem from '../components/TaskItem';
import { useAuth } from '../components/AuthProvider';
import { getTasks, addTask, updateTask, deleteTask, rescheduleToNextDay, rescheduleAllOverdue, rescheduleByDateRange, adjustTaskDate, isTaskOverdue } from '../lib/store';
import useNotifications from '../hooks/useNotifications';
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
import { cn } from '../lib/utils';

export default function Home() {
  const { session, signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);

  const { permission, requestPermission, triggerNotification } = useNotifications();

  // Load tasks on mount — only when logged in
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setLoading(false);
    };
    load();
  }, [session]);

  // Check for reminders every minute — only when logged in
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      const now = new Date();
      const currentFormattedDate = format(now, 'yyyy-MM-dd');
      const currentHour = parseInt(format(now, 'h'));
      const currentMinute = parseInt(format(now, 'mm'));
      const currentAMPM = format(now, 'a').toUpperCase();

      const overdueTasks = tasks.filter(task => {
        if (task.completed || task.notified) return false;
        if (task.date !== currentFormattedDate) return false;
        const { hour, minute, ampm } = task.time;
        const taskMinute = minute === 60 ? 0 : minute;
        return hour === currentHour && taskMinute === currentMinute && ampm === currentAMPM;
      });

      for (const task of overdueTasks) {
        triggerNotification({ title: task.title, message: task.message || 'Time to get it done!' });
        const updated = await updateTask(task.id, { notified: true });
        if (updated) setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notified: true } : t));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [session, tasks, triggerNotification]);

  const handleCreateTask = async (data) => {
    const newTask = await addTask(data);
    if (newTask) setTasks(prev => [...prev, newTask]);
  };

  const handleUpdateTask = async (data) => {
    if (editingTask) {
      const updated = await updateTask(editingTask.id, { ...data, notified: false });
      if (updated) setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id) => {
    if (confirm('Delete this reminder?')) {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    const updated = await updateTask(id, { completed: !task.completed });
    if (updated) setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  // Reschedule a single task to tomorrow
  const handleRescheduleOne = async (id) => {
    const updated = await rescheduleToNextDay(id);
    if (updated) setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  // Reschedule ALL overdue / notified tasks to tomorrow
  const handleRescheduleAll = async () => {
    const updated = await rescheduleAllOverdue();
    setTasks(updated);
  };

  // Adjust a single task's date by ±N days
  const handleAdjustDate = async (id, delta) => {
    const updated = await adjustTaskDate(id, delta);
    if (updated) setTasks(prev => prev.map(t => t.id === id ? updated : t));
  };

  // Reschedule overdue tasks in a date range to tomorrow
  const handleRescheduleByRange = async (fromDate, toDate) => {
    const updated = await rescheduleByDateRange(fromDate, toDate);
    setTasks(updated);
  };

  const overdueCount = tasks.filter(t => !t.completed && (t.notified || isTaskOverdue(t))).length;


  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // Sort by date then time
        const dateCompare = sortOrder === 'asc'
          ? a.date.localeCompare(b.date)
          : b.date.localeCompare(a.date);

        if (a.date !== b.date) return dateCompare;

        // Complex time sort (AM/PM handling)
        const getMinutes = (t) => {
          let h = t.time.hour === 12 ? 0 : t.time.hour;
          if (t.time.ampm === 'PM') h += 12;
          return h * 60 + (t.time.minute === 60 ? 0 : t.time.minute);
        };
        const timeCompare = getMinutes(a) - getMinutes(b);
        return sortOrder === 'asc' ? timeCompare : -timeCompare;
      });
  }, [tasks, searchTerm, sortOrder]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups = {};
    filteredTasks.forEach(task => {
      let label = task.date;
      if (isToday(parseISO(task.date))) label = 'TODAY';
      else if (isTomorrow(parseISO(task.date))) label = 'TOMORROW';
      else label = format(parseISO(task.date), 'MMM d').toUpperCase();

      if (!groups[label]) groups[label] = [];
      groups[label].push(task);
    });
    return groups;
  }, [filteredTasks]);

  // Flatten grouped tasks into virtual rows for windowed rendering
  const virtualRows = useMemo(() => {
    const rows = [];
    Object.entries(groupedTasks).forEach(([label, tasksInGroup]) => {
      rows.push({ type: 'header', label, count: tasksInGroup.length });
      tasksInGroup.forEach(task => rows.push({ type: 'card', task }));
    });
    return rows;
  }, [groupedTasks]);

  // Virtualizer — must be declared before any early returns (Rules of Hooks)
  const listRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => listRef.current,
    estimateSize: (i) => (virtualRows[i]?.type === 'header' ? 44 : 88),
    overscan: 8,
  });

  // ── Auth renders (after all hooks) ────────────────────────────
  if (session === undefined) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0f172a',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid rgba(13,148,136,0.3)', borderTopColor: '#0d9488',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return (
    <main style={{
      minHeight: '100vh', background: '#f8fafc',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* ── Top Nav Bar ── */}
      <style>{`
        .nav-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 8px 32px 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-title {
          font-size: 26px;
          font-weight: 900;
          color: #1e293b;
          text-transform: uppercase;
          font-style: italic;
          letter-spacing: -0.03em;
          margin: 0;
          line-height: 1;
        }
        .brand-subtitle {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-top: 4px;
        }
        .new-reminder-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0d9488;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 12px rgba(13,148,136,0.35);
          transition: all 0.15s;
        }
        .controls-bar, .task-list-container {
          max-width: 900px;
          margin: 0 auto;
          padding-left: 32px;
          padding-right: 32px;
        }
        @media (max-width: 640px) {
          .nav-inner {
            padding: 10px 8px;
            gap: 6px;
          }
          .brand-title {
            font-size: 19px;
          }
          .brand-subtitle {
            font-size: 8.5px;
            letter-spacing: 0.1em;
          }
          .new-reminder-btn {
            padding: 7px 10px;
            font-size: 11.5px;
            gap: 3px;
          }
          .sign-out-label {
            display: none;
          }
          .controls-bar, .task-list-container {
            padding-left: 8px;
            padding-right: 8px;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}>
        <div className="nav-inner">
          {/* Brand */}
          <div>
            <h1 className="brand-title">
              Pi<span style={{ color: '#0d9488' }}>Reminder</span>
            </h1>
            <p className="brand-subtitle">
              Tasks &amp; Follow-ups
            </p>
          </div>

          {/* Right side actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* New Reminder Button */}
            <button
              onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
              className="new-reminder-btn"
              onMouseEnter={e => e.currentTarget.style.background = '#0f766e'}
              onMouseLeave={e => e.currentTarget.style.background = '#0d9488'}
            >
              <Plus size={18} />
              New Reminder
            </button>
            {/* Sign Out */}
            <button
              onClick={signOut}
              title="Sign out"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', color: '#94a3b8',
                border: '1.5px solid #e2e8f0', borderRadius: '10px',
                padding: '10px 14px', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              <LogOut size={15} />
              <span className="sign-out-label">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Controls Bar (sticky with nav) ── */}
        <div className="controls-bar" style={{ padding: '2px 0 6px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Search */}
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1, minWidth: '120px',
                background: '#f8fafc', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', padding: '8px 14px',
                fontSize: '13px', color: '#1e293b',
                outline: 'none', boxShadow: 'none',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#0d9488'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />

            {/* Sort Button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#f8fafc', color: '#475569',
                border: '1.5px solid #e2e8f0', borderRadius: '10px',
                padding: '8px 14px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.color = '#0d9488'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >
              {sortOrder === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </button>

            {/* Alerts Button */}
            <button
              onClick={requestPermission}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: permission === 'granted' ? '#f0fdf4' : '#f8fafc',
                color: permission === 'granted' ? '#15803d' : '#64748b',
                border: `1.5px solid ${permission === 'granted' ? '#86efac' : '#e2e8f0'}`,
                borderRadius: '10px', padding: '8px 14px',
                fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {permission === 'granted' ? <Bell size={13} /> : <BellOff size={13} />}
              {permission === 'granted' ? 'Alerts On' : 'Alerts'}
            </button>

            {/* Auto-Reschedule All */}
            {overdueCount > 0 && (
              <button
                onClick={() => setIsRescheduleModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#fff7ed', color: '#c2410c',
                  border: '1.5px solid #fed7aa', borderRadius: '10px',
                  padding: '8px 14px', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                title={`Reschedule ${overdueCount} overdue reminder(s) to tomorrow`}
              >
                <RotateCcw size={13} />
                Reschedule ({overdueCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Task List (virtualized) ── */}
      <div
        className="task-list-container"
        ref={listRef}
        style={{
          paddingTop: '130px',
          paddingBottom: '80px',
          overflowY: 'auto',
          height: '100vh',
          position: 'relative',
        }}
      >
        {loading && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#0d9488',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
            }} />
            <p style={{ color: '#94a3b8', fontWeight: 600 }}>Loading reminders...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', padding: '24px',
              background: '#f1f5f9', borderRadius: '9999px', color: '#cbd5e1',
              marginBottom: '16px',
            }}>
              <BellOff size={48} />
            </div>
            <p style={{ color: '#94a3b8', fontWeight: 600, fontStyle: 'italic' }}>
              No reminders yet. Hit &ldquo;New Reminder&rdquo; to get started!
            </p>
          </div>
        )}

        {!loading && virtualRows.length > 0 && (
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map(vItem => {
              const row = virtualRows[vItem.index];
              return (
                <div
                  key={vItem.key}
                  data-index={vItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${vItem.start}px)`,
                    paddingBottom: row.type === 'card' ? '10px' : '0px',
                  }}
                >
                  {row.type === 'header' ? (
                    <h2 style={{
                      fontSize: '15px', fontWeight: 500, color: '#2563eb',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      margin: '0 0 2px', paddingLeft: '4px',
                      paddingTop: vItem.index === 0 ? '0' : '18px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      {row.label}
                      <span style={{
                        fontSize: '12px', fontWeight: 600,
                        background: '#eff6ff', color: '#3b82f6',
                        border: '1px solid #bfdbfe',
                        borderRadius: '20px', padding: '1px 8px',
                        letterSpacing: '0.04em', textTransform: 'none',
                      }}>{row.count}</span>
                    </h2>
                  ) : (
                    <TaskItem
                      task={row.task}
                      onEdit={(t) => { setEditingTask(t); setIsModalOpen(true); }}
                      onDelete={handleDeleteTask}
                      onToggleComplete={toggleComplete}
                      onReschedule={handleRescheduleOne}
                      onAdjustDate={handleAdjustDate}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        taskToEdit={editingTask}
        onReschedule={handleRescheduleOne}
      />
      <RescheduleRangeModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        onSubmit={handleRescheduleByRange}
        overdueCount={overdueCount}
      />
    </main>
  );
}
