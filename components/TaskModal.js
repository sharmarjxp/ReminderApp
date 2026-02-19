
'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Type, MessageSquare, Check, RotateCcw } from 'lucide-react';
import TimePicker from './TimePicker';
import { format, addDays } from 'date-fns';
import { isTaskOverdue } from '../lib/store';

export default function TaskModal({ isOpen, onClose, onSave, taskToEdit, onReschedule }) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState({ hour: 12, minute: 0, ampm: 'PM' });

    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title || '');
            setMessage(taskToEdit.message || '');
            setDate(taskToEdit.date || format(new Date(), 'yyyy-MM-dd'));
            setTime(taskToEdit.time || { hour: 12, minute: 0, ampm: 'PM' });
        } else {
            setTitle('');
            setMessage('');
            setDate(format(new Date(), 'yyyy-MM-dd'));
            setTime({
                hour: parseInt(format(new Date(), 'h')),
                minute: Math.ceil(parseInt(format(new Date(), 'mm')) / 5) * 5,
                ampm: format(new Date(), 'a').toUpperCase()
            });
        }
    }, [taskToEdit, isOpen]);

    if (!isOpen) return null;

    const isOverdue = taskToEdit && (taskToEdit.notified || isTaskOverdue(taskToEdit));
    const tomorrow = format(addDays(new Date(), 1), 'MMM d');

    const handleSave = () => {
        if (!title.trim()) { alert('Please enter a title'); return; }
        onSave({ title, message, date, time });
        onClose();
    };

    const handleRescheduleClick = () => {
        if (onReschedule && taskToEdit) {
            onReschedule(taskToEdit.id);
            onClose();
        }
    };

    return (
        <>
            {/* ── Responsive styles ── */}
            <style>{`
                .task-modal-panel {
                    position: fixed;
                    z-index: 9999;
                    top: 16px;
                    bottom: 16px;
                    right: 16px;
                    width: calc(50% - 16px);
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.35);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                @media (max-width: 640px) {
                    .task-modal-panel {
                        top: 0;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        width: 100%;
                        border-radius: 0;
                    }
                    /* Header */
                    .modal-header {
                        padding: 11px 16px !important;
                    }
                    .modal-header h2 {
                        font-size: 15px !important;
                    }
                    .modal-header p {
                        font-size: 9px !important;
                        margin-top: 2px !important;
                    }
                    /* Section labels */
                    .modal-section-label {
                        padding: 7px 16px !important;
                        font-size: 10px !important;
                    }
                    /* Text / date inputs */
                    .modal-input {
                        padding: 10px 16px !important;
                        font-size: 14px !important;
                    }
                    /* Time picker wrapper */
                    .modal-time-wrap {
                        padding: 12px 16px !important;
                    }
                    /* Textarea */
                    .modal-textarea {
                        padding: 10px 16px !important;
                        font-size: 13px !important;
                        min-height: 72px !important;
                    }
                    /* Footer */
                    .modal-footer {
                        padding: 10px 14px !important;
                        gap: 8px !important;
                    }
                    .modal-btn-save,
                    .modal-btn-cancel {
                        padding: 10px 12px !important;
                        font-size: 12px !important;
                    }
                    .modal-btn-reschedule {
                        padding: 9px 12px !important;
                        font-size: 11px !important;
                    }
                }
            `}</style>

            {/* ── Backdrop ── */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    background: 'rgba(15,23,42,0.65)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* ── Modal Panel ── */}
            <div
                onClick={e => e.stopPropagation()}
                className="task-modal-panel"
            >
                {/* Header */}
                <div className="modal-header" style={{
                    background: '#0d9488',
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div>
                        <h2 style={{
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: '18px',
                            letterSpacing: '-0.03em',
                            textTransform: 'uppercase',
                            fontStyle: 'italic',
                            margin: 0,
                        }}>
                            {taskToEdit ? 'Edit Reminder' : 'New Reminder'}
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.55)',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.35em',
                            textTransform: 'uppercase',
                            marginTop: '4px',
                        }}>
                            Set your focus
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: '2px solid transparent',
                            borderRadius: '6px',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>

                    {/* ── Title ── */}
                    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <label className="modal-section-label" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#f8fafc', padding: '10px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#64748b', fontSize: '11px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            <Type size={13} color="#0d9488" /> What&apos;s on your mind?
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Task Title..."
                            className="modal-input"
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                border: 'none', outline: 'none',
                                padding: '16px 24px', fontSize: '16px',
                                fontWeight: 600, color: '#1e293b',
                                background: '#fff',
                            }}
                        />
                    </div>

                    {/* ── Date ── */}
                    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <label className="modal-section-label" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#f8fafc', padding: '10px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#64748b', fontSize: '11px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            <CalendarIcon size={13} color="#0d9488" /> Pick Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="modal-input"
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                border: 'none', outline: 'none',
                                padding: '16px 24px', fontSize: '16px',
                                fontWeight: 600, color: '#1e293b',
                                background: '#fff',
                            }}
                        />
                    </div>

                    {/* ── Time ── */}
                    <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <label className="modal-section-label" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#f8fafc', padding: '10px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#64748b', fontSize: '11px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            <Clock size={13} color="#0d9488" /> Pick Time
                        </label>
                        <div className="modal-time-wrap" style={{ padding: '20px 24px' }}>
                            <TimePicker value={time} onChange={setTime} />
                        </div>
                    </div>

                    {/* ── Details ── */}
                    <div>
                        <label className="modal-section-label" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            background: '#f8fafc', padding: '10px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            color: '#64748b', fontSize: '11px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                            <MessageSquare size={13} color="#0d9488" /> Details
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Add some context..."
                            rows={4}
                            className="modal-textarea"
                            style={{
                                width: '100%', boxSizing: 'border-box',
                                border: 'none', outline: 'none', resize: 'vertical',
                                padding: '16px 24px', fontSize: '15px',
                                fontWeight: 500, color: '#475569',
                                background: '#fff', minHeight: '100px',
                            }}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="modal-footer" style={{
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    padding: '16px 20px',
                    borderTop: '1px solid #e2e8f0', background: '#f8fafc',
                    flexShrink: 0,
                }}>
                    {/* Reschedule to tomorrow — only for overdue tasks */}
                    {isOverdue && onReschedule && (
                        <button
                            onClick={handleRescheduleClick}
                            className="modal-btn-reschedule"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                background: '#fff7ed', color: '#c2410c',
                                border: '1.5px solid #fed7aa', borderRadius: '10px',
                                padding: '12px 24px', fontSize: '13px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            <RotateCcw size={15} />
                            Reschedule to Tomorrow ({tomorrow})
                        </button>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleSave}
                            className="modal-btn-save"
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '10px',
                                background: '#0d9488', color: '#fff',
                                border: 'none', borderRadius: '10px',
                                padding: '14px 24px', fontSize: '14px',
                                fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '0.08em', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(13,148,136,0.35)',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#0f766e'}
                            onMouseLeave={e => e.currentTarget.style.background = '#0d9488'}
                        >
                            <Check size={16} /> Save Reminder
                        </button>
                        <button
                            onClick={onClose}
                            className="modal-btn-cancel"
                            style={{
                                flex: 1, background: '#fff', color: '#64748b',
                                border: '1px solid #e2e8f0', borderRadius: '10px',
                                padding: '14px 24px', fontSize: '14px',
                                fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: '0.08em', cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
