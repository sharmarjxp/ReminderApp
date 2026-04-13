
'use client';

import React, { useState } from 'react';
import { Edit2, Trash2, RotateCcw, CalendarClock } from 'lucide-react';
import { isTaskOverdue } from '../lib/store';
import { format, addDays, addWeeks, addMonths } from 'date-fns';

// Splits text into plain strings and URL <a> tags
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
function renderMessage(text, subColor) {
    const parts = text.split(URL_REGEX);
    return parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                        color: '#93c5fd',
                        textDecoration: 'underline',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                        display: 'inline',
                    }}
                >
                    {part}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

export default function TaskItem({ task, onEdit, onDelete, onToggleComplete, onReschedule, onAdjustDate, positionInGroup, groupTotal }) {
    const { hour, minute, ampm } = task.time;
    const displayMinute = (minute === 60 ? 0 : minute).toString().padStart(2, '0');
    const timeStr = `${hour}:${displayMinute} ${ampm}`;

    const isOverdue = task.notified || isTaskOverdue(task);
    const isCompleted = task.completed;

    const [pressedBtn, setPressedBtn] = useState(null);
    const flash = (key, fn) => {
        setPressedBtn(key);
        fn();
        setTimeout(() => setPressedBtn(null), 250);
    };

    // Color logic — overdue: only time label goes red, everything else stays teal
    const cardBg = isCompleted ? '#f1f5f9' : '#00897B';
    const cardBorder = isCompleted ? '#cbd5e1' : '#00796B';
    const titleColor = isCompleted ? '#94a3b8' : '#ffffff';
    const timeColor = isOverdue ? '#ef4444' : isCompleted ? '#94a3b8' : '#1e293b';
    const subColor = isCompleted ? '#94a3b8' : 'rgba(255,255,255,0.75)';
    const cardShadow = '0 1px 3px rgba(0,0,0,0.06)';

    const tomorrow = format(addDays(new Date(), 1), 'MMM d');

    return (
        <div className="task-item-row" style={{
            display: 'flex', gap: '8px', alignItems: 'stretch',
            minWidth: 0, overflow: 'hidden', width: '100%',
            boxSizing: 'border-box'
        }}>
            <style>{`
                @keyframes adj-flash {
                    0%   { background: rgba(255,255,255,0.78); transform: scale(0.86); box-shadow: 0 0 0 3px rgba(255,255,255,0.45); }
                    55%  { background: rgba(255,255,255,0.28); transform: scale(0.94); box-shadow: none; }
                    100% { background: rgba(255,255,255,0.15); transform: scale(1);    box-shadow: none; }
                }
                @media (max-width: 480px) {
                    .time-column { min-width: 58px !important; }
                    .task-card { padding: 10px 12px !important; gap: 4px !important; }
                    .task-title { font-size: 17px !important; }
                    .task-message { font-size: 11.5px !important; line-height: 1.4 !important; }
                }
                .adj-btn {
                    background: rgba(255,255,255,0.15);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 6px;
                    padding: 3px 7px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    font-size: 11px;
                    font-weight: 700;
                    line-height: 1;
                    user-select: none;
                }
                .adj-btn.pressed {
                    animation: adj-flash 0.25s ease-out forwards;
                }
            `}</style>

            {/* Time Column */}
            <div className="time-column" style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'flex-end', minWidth: '70px',
                paddingTop: '8px', flexShrink: 0
            }}>
                <span style={{ fontSize: '19px', fontWeight: 500, color: timeColor, lineHeight: 1 }}>
                    {hour}:{displayMinute}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: timeColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '1px' }}>
                    {ampm}
                </span>
                {isOverdue && !isCompleted && (
                    <span style={{
                        marginTop: '4px', fontSize: '8px', fontWeight: 800,
                        color: '#dc2626', textTransform: 'uppercase',
                        letterSpacing: '0.04em', background: '#fee2e2',
                        borderRadius: '4px', padding: '1px 4px',
                    }}>
                        OVERDUE
                    </span>
                )}
            </div>

            {/* Card */}
            <div className="task-card" style={{
                flex: 1, minWidth: 0, borderRadius: '12px', padding: '11px 13px',
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
                boxShadow: cardShadow,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', gap: '5px',
                overflow: 'hidden',
            }}
                onClick={() => onEdit(task)}
            >
                {/* Buttons row — above the title so title gets full width */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '3px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    {isOverdue && !isCompleted && (
                        <button
                            onClick={() => onReschedule(task.id)}
                            title="Reschedule (today if time is future, else tomorrow)"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '3px',
                                background: 'rgba(239,68,68,0.08)', color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.18)', borderRadius: '6px',
                                padding: '3px 6px', fontSize: '10px', fontWeight: 600,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            <RotateCcw size={10} /> Reschedule
                        </button>
                    )}
                    {/* Position badge — right after Reschedule button */}
                    {positionInGroup != null && (
                        <span style={{
                            fontSize: '11px', fontWeight: 700, lineHeight: 1,
                            color: isCompleted ? '#94a3b8' : 'rgba(255,255,255,0.55)',
                            padding: '3px 6px',
                            border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.08)',
                            minWidth: '24px',
                            textAlign: 'center',
                            letterSpacing: 0,
                        }}>
                            {positionInGroup}
                        </span>
                    )}
                    {/* −1 Day */}
                    <button
                        onClick={() => flash('d-', () => onAdjustDate(task.id, -1))}
                        title="Move back 1 day"
                        className={`adj-btn${pressedBtn === 'd-' ? ' pressed' : ''}`}
                        style={{ color: isCompleted ? '#94a3b8' : '#fff' }}
                    >−</button>
                    {/* +1 Day */}
                    <button
                        onClick={() => flash('d+', () => onAdjustDate(task.id, +1))}
                        title="Move forward 1 day"
                        className={`adj-btn${pressedBtn === 'd+' ? ' pressed' : ''}`}
                        style={{ color: isCompleted ? '#94a3b8' : '#fff' }}
                    >+</button>
                    {/* −1 Week */}
                    <button
                        onClick={() => flash('w-', () => {
                            const cur = new Date(task.date + 'T00:00:00');
                            const next = format(addWeeks(cur, -1), 'yyyy-MM-dd');
                            onAdjustDate(task.id, Math.round((new Date(next) - cur) / 86400000));
                        })}
                        title="Move back 1 week"
                        className={`adj-btn${pressedBtn === 'w-' ? ' pressed' : ''}`}
                        style={{ color: isCompleted ? '#94a3b8' : 'rgba(255,255,255,0.85)' }}
                    >−W</button>
                    {/* +1 Week */}
                    <button
                        onClick={() => flash('w+', () => {
                            const cur = new Date(task.date + 'T00:00:00');
                            const next = format(addWeeks(cur, 1), 'yyyy-MM-dd');
                            onAdjustDate(task.id, Math.round((new Date(next) - cur) / 86400000));
                        })}
                        title="Move forward 1 week"
                        className={`adj-btn${pressedBtn === 'w+' ? ' pressed' : ''}`}
                        style={{ color: isCompleted ? '#94a3b8' : 'rgba(255,255,255,0.85)' }}
                    >+W</button>
                    {/* −1 Month */}
                    <button
                        onClick={() => flash('m-', () => {
                            const cur = new Date(task.date + 'T00:00:00');
                            const next = format(addMonths(cur, -1), 'yyyy-MM-dd');
                            onAdjustDate(task.id, Math.round((new Date(next) - cur) / 86400000));
                        })}
                        title="Move back 1 month"
                        className={`adj-btn${pressedBtn === 'm-' ? ' pressed' : ''}`}
                        style={{ color: isCompleted ? '#94a3b8' : 'rgba(255,255,255,0.7)' }}
                    >−M</button>
                    {/* +1 Month */}
                    <button
                        onClick={() => flash('m+', () => {
                            const cur = new Date(task.date + 'T00:00:00');
                            const next = format(addMonths(cur, 1), 'yyyy-MM-dd');
                            onAdjustDate(task.id, Math.round((new Date(next) - cur) / 86400000));
                        })}
                        title="Move forward 1 month"
                        className={`adj-btn${pressedBtn === 'm+' ? ' pressed' : ''}`}
                        style={{ color: isCompleted ? '#94a3b8' : 'rgba(255,255,255,0.7)' }}
                    >+M</button>
                    <button
                        onClick={() => onEdit(task)}
                        style={{
                            background: 'rgba(255,255,255,0.15)', color: isCompleted ? '#64748b' : '#fff',
                            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                            padding: '3px 6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <Edit2 size={11} />
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        style={{
                            background: 'rgba(255,255,255,0.15)', color: isCompleted ? '#64748b' : '#fff',
                            border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                            padding: '3px 6px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <Trash2 size={11} />
                    </button>
                </div>

                {/* Title — full width now that buttons are above */}
                <h3 className="task-title" style={{
                    fontSize: '20px', fontWeight: 500, color: titleColor,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    margin: 0, lineHeight: 1.15,
                    wordBreak: 'break-word', overflowWrap: 'anywhere',
                }} onClick={() => onEdit(task)}>
                    {task.title}
                </h3>

                {/* Message */}
                {task.message && (
                    <p className="task-message"
                        onClick={e => e.stopPropagation()}
                        style={{
                            fontSize: '12px', color: subColor, margin: 0, lineHeight: 1.5,
                            wordBreak: 'break-all', overflowWrap: 'anywhere',
                            cursor: 'auto',
                        }}
                    >
                        {renderMessage(task.message, subColor)}
                    </p>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                    <CalendarClock size={10} color={subColor} />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: subColor }}>
                        {task.date}
                    </span>
                    {isCompleted && (
                        <span style={{
                            fontSize: '8px', fontWeight: 800, color: '#22c55e',
                            background: '#f0fdf4', border: '1px solid #86efac',
                            borderRadius: '4px', padding: '0px 4px', marginLeft: '4px',
                        }}>DONE</span>
                    )}
                </div>
            </div>
        </div>
    );
}
