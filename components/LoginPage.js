'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, Eye, EyeOff, Bell } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) setError(error.message);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #0f172a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '20px',
        }}>
            {/* Glowing orbs background */}
            <div style={{
                position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
            }}>
                <div style={{
                    position: 'absolute', top: '-10%', left: '-5%',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 70%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', right: '-5%',
                    width: '600px', height: '600px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
                }} />
            </div>

            {/* Card */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: '100%', maxWidth: '420px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                overflow: 'hidden',
            }}>
                {/* Top accent bar */}
                <div style={{
                    height: '4px',
                    background: 'linear-gradient(90deg, #0d9488, #0ea5e9, #0d9488)',
                    backgroundSize: '200% 100%',
                }} />

                <div style={{ padding: '40px 36px 36px' }}>

                    {/* Logo / brand */}
                    <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                        <div style={{
                            display: 'inline-flex', padding: '16px',
                            background: 'rgba(13,148,136,0.2)',
                            borderRadius: '20px', marginBottom: '16px',
                            border: '1px solid rgba(13,148,136,0.3)',
                        }}>
                            <Bell size={32} color="#0d9488" />
                        </div>
                        <h1 style={{
                            color: '#fff', fontSize: '28px', fontWeight: 900,
                            textTransform: 'uppercase', fontStyle: 'italic',
                            letterSpacing: '-0.03em', margin: '0 0 6px',
                        }}>
                            Pi<span style={{ color: '#0d9488' }}>Reminder</span>
                        </h1>
                        <p style={{
                            color: 'rgba(255,255,255,0.4)', fontSize: '12px',
                            fontWeight: 600, letterSpacing: '0.2em',
                            textTransform: 'uppercase', margin: 0,
                        }}>
                            Sign in to your workspace
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Email */}
                        <div>
                            <label style={{
                                display: 'block', color: 'rgba(255,255,255,0.5)',
                                fontSize: '11px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.12em',
                                marginBottom: '8px',
                            }}>Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={16} color="rgba(255,255,255,0.3)" style={{
                                    position: 'absolute', left: '14px', top: '50%',
                                    transform: 'translateY(-50%)', pointerEvents: 'none',
                                }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '1.5px solid rgba(255,255,255,0.12)',
                                        borderRadius: '12px', padding: '13px 14px 13px 42px',
                                        color: '#fff', fontSize: '15px', fontWeight: 500,
                                        outline: 'none', transition: 'all 0.2s',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.background = 'rgba(13,148,136,0.1)'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{
                                display: 'block', color: 'rgba(255,255,255,0.5)',
                                fontSize: '11px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.12em',
                                marginBottom: '8px',
                            }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} color="rgba(255,255,255,0.3)" style={{
                                    position: 'absolute', left: '14px', top: '50%',
                                    transform: 'translateY(-50%)', pointerEvents: 'none',
                                }} />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%', boxSizing: 'border-box',
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '1.5px solid rgba(255,255,255,0.12)',
                                        borderRadius: '12px', padding: '13px 44px 13px 42px',
                                        color: '#fff', fontSize: '15px', fontWeight: 500,
                                        outline: 'none', transition: 'all 0.2s',
                                    }}
                                    onFocus={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.background = 'rgba(13,148,136,0.1)'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(p => !p)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', cursor: 'pointer',
                                        color: 'rgba(255,255,255,0.35)', padding: '4px',
                                        display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '10px', padding: '10px 14px',
                                color: '#fca5a5', fontSize: '13px', fontWeight: 600,
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '4px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                background: loading ? 'rgba(13,148,136,0.5)' : '#0d9488',
                                color: '#fff', border: 'none', borderRadius: '12px',
                                padding: '15px', fontSize: '15px', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: loading ? 'none' : '0 6px 20px rgba(13,148,136,0.45)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0f766e'; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0d9488'; }}
                        >
                            <LogIn size={17} />
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p style={{
                        marginTop: '28px', textAlign: 'center',
                        color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 500,
                    }}>
                        This workspace is private. Contact the admin to get access.
                    </p>
                </div>
            </div>
        </div>
    );
}
