
'use client';

import React, { useState } from 'react';
import { X, RotateCcw, CalendarRange, Zap } from 'lucide-react';
import { format, subMonths } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');
const monthsAgo = (n) => format(subMonths(new Date(), n), 'yyyy-MM-dd');

export default function RescheduleRangeModal({ isOpen, onClose, onSubmit, overdueCount }) {
    const [fromDate, setFromDate] = useState(monthsAgo(1));
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const shortcuts = [
        { label: 'Last 1 month', months: 1 },
        { label: 'Last 2 months', months: 2 },
        { label: 'Last 3 months', months: 3 },
        { label: 'Last 4 months', months: 4 },
        { label: 'Last 5 months', months: 5 },
        { label: 'Last 6 months', months: 6 },
    ];

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit(fromDate, today());
        setLoading(false);
        onClose();
    };

    return (
        <>
            {/* ── Responsive styles ── */}
            <style>{`
                .rr-modal-panel {
                    position: fixed;
                    z-index: 10000;
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
                    .rr-modal-panel {
                        top: 0; bottom: 0; left: 0; right: 0;
                        width: 100%;
                        border-radius: 0;
                    }
                    .rr-header { padding: 11px 16px !important; }
                    .rr-header h2 { font-size: 15px !important; }
                    .rr-header p { font-size: 9px !important; }
                    .rr-body { padding: 16px !important; gap: 16px !important; }
                    .rr-section-title { font-size: 10px !important; }
                    .rr-shortcut-btn { padding: 8px 10px !important; font-size: 11px !important; }
                    .rr-date-input { padding: 10px 14px !important; font-size: 14px !important; }
                    .rr-footer { padding: 10px 14px !important; }
                    .rr-submit-btn { padding: 11px 16px !important; font-size: 13px !important; }
                    .rr-cancel-btn { padding: 11px 16px !important; font-size: 13px !important; }
                }
            `}</style>

            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15,23,42,0.65)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Panel */}
            <div onClick={e => e.stopPropagation()} className="rr-modal-panel">

                {/* Header */}
                <div className="rr-header" style={{
                    background: '#c2410c',
                    padding: '16px 24px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div>
                        <h2 style={{
                            color: '#fff', fontWeight: 900, fontSize: '18px',
                            letterSpacing: '-0.03em', textTransform: 'uppercase',
                            fontStyle: 'italic', margin: 0,
                        }}>
                            Reschedule by Date Range
                        </h2>
                        <p style={{
                            color: 'rgba(255,255,255,0.6)', fontSize: '10px',
                            fontWeight: 700, letterSpacing: '0.3em',
                            textTransform: 'uppercase', marginTop: '4px',
                        }}>
                            Move overdue reminders → tomorrow
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent', border: '2px solid transparent',
                            borderRadius: '6px', color: '#fff', cursor: 'pointer',
                            padding: '8px', display: 'flex', alignItems: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="rr-body" style={{
                    flex: 1, overflowY: 'auto', padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '24px',
                    background: '#fff',
                }}>

                    {/* Info banner */}
                    <div style={{
                        background: '#fff7ed', border: '1.5px solid #fed7aa',
                        borderRadius: '12px', padding: '12px 16px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                        <RotateCcw size={16} color="#c2410c" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: '13px', color: '#9a3412', fontWeight: 600, lineHeight: 1.4 }}>
                            All <strong>{overdueCount} overdue</strong> reminders within the selected date range will be moved to <strong>tomorrow</strong>.
                        </p>
                    </div>

                    {/* Quick shortcuts */}
                    <div>
                        <p className="rr-section-title" style={{
                            fontSize: '11px', fontWeight: 800, color: '#94a3b8',
                            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px',
                        }}>
                            <Zap size={11} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Quick Select
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                        }}>
                            {shortcuts.map(({ label, months }) => {
                                const val = monthsAgo(months);
                                const isActive = fromDate === val;
                                return (
                                    <button
                                        key={months}
                                        className="rr-shortcut-btn"
                                        onClick={() => setFromDate(val)}
                                        style={{
                                            padding: '10px 12px', fontSize: '12px', fontWeight: 700,
                                            borderRadius: '10px', cursor: 'pointer',
                                            border: `1.5px solid ${isActive ? '#c2410c' : '#e2e8f0'}`,
                                            background: isActive ? '#fff7ed' : '#f8fafc',
                                            color: isActive ? '#c2410c' : '#64748b',
                                            transition: 'all 0.15s',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date range display */}
                    <div>
                        <p className="rr-section-title" style={{
                            fontSize: '11px', fontWeight: 800, color: '#94a3b8',
                            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px',
                        }}>
                            <CalendarRange size={11} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Date Range
                        </p>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>

                            {/* From */}
                            <div style={{ flex: 1, minWidth: '130px' }}>
                                <label style={{
                                    display: 'block', fontSize: '10px', fontWeight: 700,
                                    color: '#94a3b8', textTransform: 'uppercase',
                                    letterSpacing: '0.1em', marginBottom: '6px',
                                }}>From</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    max={today()}
                                    onChange={e => setFromDate(e.target.value)}
                                    className="rr-date-input"
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        border: '1.5px solid #e2e8f0', borderRadius: '10px',
                                        padding: '11px 16px', fontSize: '15px',
                                        fontWeight: 600, color: '#1e293b',
                                        background: '#f8fafc', outline: 'none',
                                        transition: 'border-color 0.15s',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#c2410c'}
                                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                />
                            </div>

                            {/* Arrow */}
                            <span style={{
                                fontSize: '18px', color: '#cbd5e1', fontWeight: 900,
                                alignSelf: 'flex-end', paddingBottom: '10px',
                            }}>→</span>

                            {/* To (locked to today) */}
                            <div style={{ flex: 1, minWidth: '130px' }}>
                                <label style={{
                                    display: 'block', fontSize: '10px', fontWeight: 700,
                                    color: '#94a3b8', textTransform: 'uppercase',
                                    letterSpacing: '0.1em', marginBottom: '6px',
                                }}>To (today)</label>
                                <div style={{
                                    width: '100%', boxSizing: 'border-box',
                                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                                    padding: '11px 16px', fontSize: '15px',
                                    fontWeight: 600, color: '#94a3b8',
                                    background: '#f1f5f9',
                                }}>
                                    {today()}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="rr-footer" style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #e2e8f0', background: '#f8fafc',
                    flexShrink: 0, display: 'flex', gap: '12px',
                }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rr-submit-btn"
                        style={{
                            flex: 1, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '8px',
                            background: loading ? '#fed7aa' : '#c2410c',
                            color: '#fff', border: 'none', borderRadius: '10px',
                            padding: '14px 24px', fontSize: '14px',
                            fontWeight: 700, textTransform: 'uppercase',
                            letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(194,65,12,0.35)',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#9a3412'; }}
                        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#c2410c'; }}
                    >
                        <RotateCcw size={15} />
                        {loading ? 'Rescheduling…' : 'Reschedule Now'}
                    </button>
                    <button
                        onClick={onClose}
                        className="rr-cancel-btn"
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
        </>
    );
}
