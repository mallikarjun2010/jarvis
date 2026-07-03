'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Play, Clock, CheckCircle2, XCircle, RefreshCw, Sparkles, Terminal } from 'lucide-react';

export const AutomationView = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Execution state
  const [triggerStatus, setTriggerStatus] = useState('');
  const [triggeredOutput, setTriggeredOutput] = useState('');

  useEffect(() => {
    fetchAutomationHistory();
  }, []);

  const fetchAutomationHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs || []);
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to load automation runs');
    } finally {
      setLoading(false);
    }
  };

  const handleTrigger = async (type: string) => {
    setTriggerStatus(`Running ${type === 'DAILY_PLAN' ? 'Morning Briefing' : 'Evening Prep'}...`);
    setTriggeredOutput('');
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        setTriggerStatus('Success! Digest created.');
        setTriggeredOutput(data.result || 'No content returned.');
        fetchAutomationHistory(); // Reload table
      } else {
        setTriggerStatus(`Failed: ${data.error}`);
      }
    } catch (err) {
      setTriggerStatus('Failed: Connection timed out.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>AUTOMATION ENGINE</h2>
        </div>
        <button
          onClick={fetchAutomationHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin-slow' : ''} />
          Reload logs
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Trigger Panel */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-cyan)' }}>
            WORKFLOW TRIGGERS
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Morning Briefing card */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-glass)',
                padding: '14px',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Morning Briefing Summary</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Triggered daily at 8:00 AM • Gmail + Calendar digest</span>
              </div>
              <button
                onClick={() => handleTrigger('DAILY_PLAN')}
                style={{
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Play size={12} />
                Run
              </button>
            </div>

            {/* Evening Prep card */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-glass)',
                padding: '14px',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Evening Prep Summary</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Triggered daily at 9:00 PM • Task list + Tomorrow preview</span>
              </div>
              <button
                onClick={() => handleTrigger('EVENING_PREP')}
                style={{
                  background: 'rgba(157, 78, 221, 0.15)',
                  border: '1px solid var(--accent-purple)',
                  color: 'var(--text-primary)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Play size={12} />
                Run
              </button>
            </div>
          </div>

          {/* Telemetry Output console */}
          {triggerStatus && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--primary)', fontFamily: 'monospace' }}>
                {triggerStatus}
              </div>
              {triggeredOutput && (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-glass)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {triggeredOutput}
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Log Panel */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>WORKFLOW ENGINE LOGS</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {loading ? (
              <div className="skeleton" style={{ height: '100px', width: '100%' }} />
            ) : runs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No automation logs found. Trigger a run on the left.
              </div>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {run.status === 'COMPLETED' ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-cyan)' }} />
                    ) : (
                      <XCircle size={16} style={{ color: '#ef4444' }} />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{run.type}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: run.status === 'COMPLETED' ? 'var(--accent-cyan)' : '#f87171',
                      fontWeight: 600,
                    }}
                  >
                    {run.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default AutomationView;
