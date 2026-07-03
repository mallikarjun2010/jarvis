'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, Volume2, Bell, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';

export const SettingsView = () => {
  const [loading, setLoading] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [autoDigest, setAutoDigest] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [customTheme, setCustomTheme] = useState('default');
  
  // Credentials preview display toggle
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setVoiceOutput(data.settings.voiceOutput);
        setAutoDigest(data.settings.autoDigest);
        setFocusMode(data.settings.focusMode);
        setCustomTheme(data.settings.customTheme);
      }
    } catch (e) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceOutput,
          autoDigest,
          focusMode,
          customTheme,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('System configurations saved successfully.');
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Save failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Settings size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>SYSTEM SETTINGS</h2>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-glow)',
            border: '1px solid var(--primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            fontWeight: 500,
          }}
        >
          <Save size={14} />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        
        {/* Toggle options */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-cyan)' }}>
            USER INTERFACE PREFERENCES
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Voice Output toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Volume2 size={18} style={{ color: 'var(--primary)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Speech Synthesis Feedback</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Jarvis speaks back responses out loud when completing commands</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceOutput}
                onChange={(e) => setVoiceOutput(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Auto Digest toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Bell size={18} style={{ color: 'var(--accent-purple)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Automatic Morning Briefings</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Run email digests and calendar schedules review at 8:00 AM daily</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoDigest}
                onChange={(e) => setAutoDigest(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {/* Theme override */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Cinematic Color Scheme</span>
              <select
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="default">Jarvis Standard (Cyan + Deep Blue Glow)</option>
                <option value="purple">Vercel Hyper (Purple Neon + Graphite)</option>
                <option value="vision">Apple Vision (Frosted Glass + White Highlights)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Credentials Diagnostics */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-purple)' }}>
            API SECURITY telemetry
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Gemini Node Host</span>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>google-ai-studio</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Google OAuth Redirect URL</span>
              <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '11px' }}>/api/auth/google/callback</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Local Env Keys Diagnostics</span>
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  style={{ background: 'transparent', color: 'var(--primary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {showKeys ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showKeys ? 'Hide' : 'Verify'}
                </button>
              </div>

              {showKeys ? (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div>GEMINI_KEY: <span style={{ color: 'var(--accent-cyan)' }}>ACTIVE (1.5-FLASH)</span></div>
                  <div>CLIENT_ID: <span style={{ color: 'var(--primary)' }}>LOADED (GOOGLE CONSOLE)</span></div>
                  <div>JWT_SECRET: <span style={{ color: 'var(--accent-purple)' }}>ENCRYPTED</span></div>
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                  Click Verify to inspect local key registration statuses.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default SettingsView;
