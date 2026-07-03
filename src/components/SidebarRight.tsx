'use client';

import React from 'react';
import {
  Activity,
  ShieldCheck,
  Mail,
  Calendar,
  Layers,
  Zap,
  Globe2,
  HardDrive
} from 'lucide-react';

interface SidebarRightProps {
  recentEmails: any[];
  upcomingMeetings: any[];
  aiThoughts: string;
  apiStatus: {
    gemini: 'online' | 'offline';
    google: 'online' | 'offline';
    sqlite: 'online' | 'offline';
  };
  runningAutomations: any[];
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  recentEmails = [],
  upcomingMeetings = [],
  aiThoughts = 'Monitoring system operations. Ready for input.',
  apiStatus = { gemini: 'online', google: 'online', sqlite: 'online' },
  runningAutomations = [],
}) => {
  return (
    <aside
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 16px',
        gap: '24px',
        overflowY: 'auto',
      }}
    >
      {/* 1. Live AI Thoughts Feed */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Activity size={16} className="text-glow-cyber" />
          <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
            AI THOUGHT STREAM
          </h2>
        </div>
        <div
          className="border-glow-cyber"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '13px',
            color: 'var(--accent-cyan)',
            lineHeight: '1.5',
            fontFamily: 'monospace',
            minHeight: '80px',
            maxHeight: '150px',
            overflowY: 'auto',
            border: '1px dashed rgba(0, 210, 255, 0.2)',
          }}
        >
          {aiThoughts || 'Awaiting telemetry...'}
        </div>
      </div>

      {/* 2. Connected Services & Telemetry */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
          <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
            SYSTEM DIAGNOSTICS
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Gemini */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Zap size={12} />
              <span>Gemini 1.5 Flash</span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: apiStatus.gemini === 'online' ? 'var(--accent-cyan)' : '#f87171' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: apiStatus.gemini === 'online' ? 'var(--accent-cyan)' : '#ef4444', boxShadow: apiStatus.gemini === 'online' ? '0 0 8px var(--accent-cyan)' : 'none' }} />
              {apiStatus.gemini.toUpperCase()}
            </span>
          </div>

          {/* Google Auth & APIs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <Globe2 size={12} />
              <span>Google API Node</span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: apiStatus.google === 'online' ? 'var(--accent-cyan)' : '#f87171' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: apiStatus.google === 'online' ? 'var(--accent-cyan)' : '#ef4444', boxShadow: apiStatus.google === 'online' ? '0 0 8px var(--accent-cyan)' : 'none' }} />
              {apiStatus.google.toUpperCase()}
            </span>
          </div>

          {/* Database */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <HardDrive size={12} />
              <span>Local SQLite Core</span>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: apiStatus.sqlite === 'online' ? 'var(--accent-cyan)' : '#f87171' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: apiStatus.sqlite === 'online' ? 'var(--accent-cyan)' : '#ef4444', boxShadow: apiStatus.sqlite === 'online' ? '0 0 8px var(--accent-cyan)' : 'none' }} />
              {apiStatus.sqlite.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Upcoming Meetings */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Calendar size={16} style={{ color: 'var(--accent-purple)' }} />
          <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
            MEETING SCHEDULE
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flexGrow: 1 }}>
          {upcomingMeetings.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              No meetings scheduled.
            </div>
          ) : (
            upcomingMeetings.slice(0, 3).map((meeting, index) => {
              const start = meeting.start ? new Date(meeting.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Day';
              return (
                <div
                  key={meeting.id || index}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {meeting.summary}
                  </div>
                  <div style={{ color: 'var(--accent-purple)', fontSize: '11px' }}>{start}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Active Background Automations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Layers size={16} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
            AUTOMATION JOBS
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {runningAutomations.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0' }}>
              Idle. Next task scheduled at midnight.
            </div>
          ) : (
            runningAutomations.map((job, index) => (
              <div
                key={job.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(0, 210, 255, 0.03)',
                  border: '1px solid rgba(0, 210, 255, 0.1)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>{job.type}</span>
                <span style={{ color: 'var(--accent-cyan)', animation: 'breath 1.5s infinite' }}>
                  {job.status.toLowerCase()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
export default SidebarRight;
