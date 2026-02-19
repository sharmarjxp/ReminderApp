
'use client';

import React from 'react';
import { Edit2, Trash2, RotateCcw, CalendarClock } from 'lucide-react';
import { isTaskOverdue } from '../lib/store';
import { format, addDays } from 'date-fns';

export default function TaskItem({ task, onEdit, onDelete, onToggleComplete, onReschedule }) {
    const { hour, minute, ampm } = task.time;
    const displayMinute = (minute === 60 ? 0 : minute).toString().padStart(2, '0');
    const timeStr = `${hour}:${displayMinute} ${ampm}`;

    const isOverdue = task.notified || isTaskOverdue(task);
    const isCompleted = task.completed;

    // Color logic
    const cardBg = isCompleted ? '#f1f5f9' : isOverdue ? '#fef2f2' : '#00897B';
    const cardBorder = isCompleted ? '#cbd5e1' : isOverdue ? '#fca5a5' : '#00796B';
    const titleColor = isCompleted ? '#94a3b8' : isOverdue ? '#dc2626' : '#ffffff';
    const timeColor = isOverdue ? '#dc2626' : isCompleted ? '#94a3b8' : '#1e293b';
    const subColor = isCompleted ? '#94a3b8' : isOverdue ? '#ef4444' : 'rgba(255,255,255,0.75)';

    const tomorrow = format(addDays(new Date(), 1), 'MMM d');

    return (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>

            {/* Time Column */}
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-end', minWidth: '72px',
                paddingTop: '10px',
            }}>
                <span style={{ fontSize: '17px', fontWeight: 900, color: timeColor, lineHeight: 1 }}>
                    {hour}:{displayMinute}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: timeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                    {ampm}
                </span>
                {isOverdue && !isCompleted && (
                    <span style={{
                        marginTop: '6px', fontSize: '9px', fontWeight: 800,
                        color: '#dc2626', textTransform: 'uppercase',
                        letterSpacing: '0.05em', background: '#fee2e2',
                        borderRadius: '4px', padding: '2px 5px',
                    }}>
                        OVERDUE
                    </span>
                )}
            </div>

            {/* Card */}
            <div style={{
                flex: 1, borderRadius: '12px', padding: '12px 14px',
                background: cardBg, border: `1.5px solid ${cardBorder}`,
                boxShadow: isOverdue && !isCompleted ? '0 2px 12px rgba(220,38,38,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', gap: '6px',
            }}
                onClick={() => onEdit(task)}
            >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{
                        fontSize: '15px', fontWeight: 700, color: titleColor,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        margin: 0, lineHeight: 1.3,
                    }}>
                        {task.title}
                    </h3>

                    {/* Action buttons — stop propagation so clicking the card doesn't open modal */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>

                        {/* Auto-reschedule individual */}
                        {isOverdue && !isCompleted && (
                            <button
                                onClick={() => onReschedule(task.id)}
                                title={`Reschedule to ${tomorrow}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: 'rgba(220,38,38,0.1)', color: '#dc2626',
                                    border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px',
                                    padding: '4px 8px', fontSize: '11px', fontWeight: 700,
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                            >
                                <RotateCcw size={11} /> Tomorrow
                            </button>
                        )}

                        {/* Edit */}
                        <button
                            onClick={() => onEdit(task)}
                            style={{
                                background: 'rgba(255,255,255,0.15)', color: isOverdue || isCompleted ? '#64748b' : '#fff',
                                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                                padding: '4px 7px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                            }}
                        >
                            <Edit2 size={12} />
                        </button>

                        {/* Delete */}
                        <button
                            onClick={() => onDelete(task.id)}
                            style={{
                                background: 'rgba(255,255,255,0.15)', color: isOverdue || isCompleted ? '#64748b' : '#fff',
                                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px',
                                padding: '4px 7px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                            }}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>

                {/* Message */}
                {task.message && (
                    <p style={{ fontSize: '12px', color: subColor, margin: 0, lineHeight: 1.4 }}>
                        {task.message}
                    </p>
                )}

                {/* Date badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <CalendarClock size={11} color={subColor} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: subColor }}>
                        {task.date}
                    </span>
                    {isCompleted && (
                        <span style={{
                            fontSize: '9px', fontWeight: 800, color: '#22c55e',
                            background: '#f0fdf4', border: '1px solid #86efac',
                            borderRadius: '4px', padding: '1px 5px', marginLeft: '4px',
                        }}>DONE</span>
                    )}
                </div>
            </div>
        </div>
    );
}
