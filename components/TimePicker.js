
import React, { useState } from 'react';

export default function TimePicker({ value, onChange }) {
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutePresets = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0];

    const selectedHour = value.hour;
    const selectedMinute = value.minute === 60 ? 0 : value.minute;
    const ampm = value.ampm;

    const [minuteInput, setMinuteInput] = useState(
        selectedMinute.toString().padStart(2, '0')
    );

    const handleHourClick = (h) => onChange({ ...value, hour: h });
    const handleAMPMClick = (p) => onChange({ ...value, ampm: p });

    const handlePresetMinute = (m) => {
        const val = m === 60 ? 0 : m;
        setMinuteInput(val.toString().padStart(2, '0'));
        onChange({ ...value, minute: val });
    };

    const handleMinuteInputChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
        setMinuteInput(raw);
        const num = parseInt(raw, 10);
        if (!isNaN(num) && num >= 0 && num <= 59) {
            onChange({ ...value, minute: num });
        }
    };

    const baseStyle = {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
        border: '1.5px solid', transition: 'all 0.15s ease', userSelect: 'none',
    };
    const offStyle = { ...baseStyle, background: '#ffffff', color: '#64748b', borderColor: '#e2e8f0' };
    const onStyle = { ...baseStyle, background: '#22c55e', color: '#ffffff', borderColor: '#16a34a', boxShadow: '0 4px 12px rgba(34,197,94,0.4)' };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: '20px',
            padding: '20px', background: '#f8fafc',
            borderRadius: '14px', border: '1px solid #e2e8f0',
        }}>

            {/* ── Hours ── */}
            <div>
                <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 800,
                    color: '#94a3b8', textTransform: 'uppercase',
                    letterSpacing: '0.12em', marginBottom: '10px',
                }}>Hours</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                    {hours.map((h) => (
                        <button key={h} onClick={() => handleHourClick(h)}
                            style={{ ...(selectedHour === h ? onStyle : offStyle), height: '52px', fontSize: '15px' }}>
                            {h}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Minutes ── */}
            <div>
                <label style={{
                    display: 'block', fontSize: '11px', fontWeight: 800,
                    color: '#94a3b8', textTransform: 'uppercase',
                    letterSpacing: '0.12em', marginBottom: '10px',
                }}>Minutes — presets or type any value</label>

                {/* Preset grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {minutePresets.map((m) => (
                        <button key={m} onClick={() => handlePresetMinute(m)}
                            style={{ ...(selectedMinute === m ? onStyle : offStyle), height: '52px', fontSize: '15px' }}>
                            {m.toString().padStart(2, '0')}
                        </button>
                    ))}
                </div>

                {/* Free-text input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                        Custom mins:
                    </span>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={minuteInput}
                        onChange={handleMinuteInputChange}
                        placeholder="00"
                        style={{
                            width: '72px', textAlign: 'center',
                            border: '2px solid #e2e8f0', borderRadius: '10px',
                            padding: '10px 8px', fontSize: '18px', fontWeight: 800,
                            color: '#1e293b', outline: 'none',
                            background: selectedMinute === parseInt(minuteInput, 10) ? '#f0fdf4' : '#fff',
                            borderColor: selectedMinute === parseInt(minuteInput, 10) ? '#22c55e' : '#e2e8f0',
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#22c55e'}
                        onBlur={e => {
                            const num = parseInt(minuteInput, 10);
                            if (isNaN(num) || num < 0 || num > 59) setMinuteInput('00');
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    />
                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
                        (0 – 59)
                    </span>
                </div>
            </div>

            {/* ── AM / PM ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['AM', 'PM'].map((p) => (
                    <button key={p} onClick={() => handleAMPMClick(p)}
                        style={{ ...(ampm === p ? onStyle : offStyle), height: '54px', fontSize: '16px', letterSpacing: '0.08em' }}>
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
}
