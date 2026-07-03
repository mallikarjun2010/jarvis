'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sparkles,
  Mail,
  Calendar as CalendarIcon,
  CheckSquare,
  CloudSun,
  Bell,
  Volume2,
  Terminal,
  ShieldAlert,
  Send,
  Loader2
} from 'lucide-react';

// Components
import { Orb, OrbState } from '@/components/Orb';
import { SidebarLeft, SidebarTab } from '@/components/SidebarLeft';
import { SidebarRight } from '@/components/SidebarRight';
import { CommandPalette } from '@/components/CommandPalette';
import { VoiceController } from '@/components/VoiceController';

// Views
import GmailView from '@/components/views/GmailView';
import CalendarView from '@/components/views/CalendarView';
import SheetsView from '@/components/views/SheetsView';
import DriveView from '@/components/views/DriveView';
import DocsView from '@/components/views/DocsView';
import MemoryView from '@/components/views/MemoryView';
import AutomationView from '@/components/views/AutomationView';
import SettingsView from '@/components/views/SettingsView';

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // Navigation & States
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Widgets/Sidebar Telemetry Data
  const [unreadEmails, setUnreadEmails] = useState<any[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<any[]>([]);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  // AI Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [aiThoughts, setAiThoughts] = useState('Operating environment diagnostics normal. Systems active.');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [voiceOutputActive, setVoiceOutputActive] = useState(true);
  const [aiSpeechText, setAiSpeechText] = useState('');

  // 1. Session verification on boot
  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    setLoadingAuth(true);
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        setUser(data.user);
        
        // Retrieve telemetry widgets data
        fetchDashboardTelemetry(data.user.id);
      } else {
        setAuthenticated(false);
      }
    } catch (e) {
      setAuthenticated(false);
    } finally {
      setLoadingAuth(false);
    }
  };

  const fetchDashboardTelemetry = async (userId: string) => {
    try {
      // 1. Fetch unread emails
      const emailRes = await fetch('/api/gmail?maxResults=3');
      const emailData = await emailRes.json();
      if (emailData.success) setUnreadEmails(emailData.emails || []);

      // 2. Fetch meetings
      const meetingRes = await fetch('/api/calendar');
      const meetingData = await meetingRes.json();
      if (meetingData.success) setUpcomingMeetings(meetingData.events || []);

      // 3. Fetch tasks
      const taskRes = await fetch('/api/tasks');
      const taskData = await taskRes.json();
      if (taskData.success) setPendingTasks(taskData.tasks || []);

      // 4. Fetch automation logs
      const autoRes = await fetch('/api/automations');
      const autoData = await autoRes.json();
      if (autoData.success) setRecentLogs(autoData.runs || []);
    } catch (e) {
      console.warn('Dashboard telemetry fetch partially failed (unauthenticated Google node)');
    }
  };

  // 2. Time/Date update clock loop
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Key listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 4. Custom logout flow
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setAuthenticated(false);
      setUser(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Send chat message to AI Agent
  const handleSendChat = async (msgText?: string) => {
    const messageToSend = msgText || chatMessage;
    if (!messageToSend.trim()) return;

    setChatMessage('');
    setIsAiReplying(true);
    setOrbState('thinking');
    setAiThoughts('Analyzing query parameters and retrieving contextual memory keys...');
    
    // Add user message to UI local log
    const userMsgObj = { id: Date.now().toString(), role: 'user', content: messageToSend };
    setChatHistory((prev) => [...prev, userMsgObj]);

    // Focus tab to assistant chat so user can see reply
    if (activeTab !== 'assistant') {
      setActiveTab('assistant');
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversationId,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setConversationId(data.conversationId);
        
        // Add AI message to UI
        const aiMsgObj = { id: Date.now().toString(), role: 'assistant', content: data.content, thoughts: data.thoughts };
        setChatHistory((prev) => [...prev, aiMsgObj]);
        
        // Update Sidepanel telemetry
        if (data.thoughts) setAiThoughts(data.thoughts);
        
        // Set speech text
        setAiSpeechText(data.content);
        
        // Refresh dashboard widgets context
        if (user) fetchDashboardTelemetry(user.id);
      } else {
        const errorMsg = { id: Date.now().toString(), role: 'assistant', content: `Agent error: ${data.error}` };
        setChatHistory((prev) => [...prev, errorMsg]);
      }
    } catch (e) {
      const errorMsg = { id: Date.now().toString(), role: 'assistant', content: 'Connection timed out. Agent offline.' };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiReplying(false);
      setOrbState('idle');
    }
  };

  // Quick Command Palette action helpers
  const handlePaletteCreateTask = async (title: string) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority: 'MEDIUM' }),
      });
      const data = await res.json();
      if (data.success) {
        if (user) fetchDashboardTelemetry(user.id);
        setAiThoughts(`Created task: ${title}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaletteTriggerAutomation = async (type: string) => {
    try {
      setOrbState('thinking');
      setAiThoughts(`Executing background automation job ${type}...`);
      await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (user) fetchDashboardTelemetry(user.id);
      setOrbState('idle');
      setAiThoughts('Automation complete. Dashboard feeds updated.');
    } catch (e) {
      console.error(e);
    }
  };

  // --- RENDERING ROUTINES ---

  if (loadingAuth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', gap: '16px' }}>
        <Loader2 className="spin-slow" size={32} style={{ color: 'var(--primary)' }} />
        <span className="text-glow-cyber" style={{ fontSize: '13px' }}>JARVIS OS TELEMETRY INITIALIZING...</span>
      </div>
    );
  }

  // Google Authentication Overlay Screen (Logged Out)
  if (!authenticated) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-deep)',
          backgroundImage: 'var(--bg-radial)',
        }}
      >
        <div
          className="glass-panel-heavy border-glow-cyber"
          style={{
            width: '420px',
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Animated Glowing Orb Logo */}
          <div style={{ transform: 'scale(0.8)', margin: '-20px 0' }}>
            <Orb state="idle" size={200} />
          </div>

          <div>
            <h1 className="text-glow-cyber" style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>
              JARVIS OS
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
              Futuristic Agentic Operating System. Synchronize Google Workspace API nodes and Gemini Core models to initiate.
            </p>
          </div>

          <a
            href="/api/auth/google/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2) 0%, rgba(157, 78, 221, 0.2) 100%)',
              border: '1px solid var(--primary)',
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'var(--transition-smooth)',
              boxShadow: '0 0 15px rgba(0, 210, 255, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 210, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 210, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Simple Inline Google G Logo */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Initialize Jarvis OS Link</span>
          </a>
        </div>
      </div>
    );
  }

  // --- CORE DESKTOP RUNNING WORKSPACE ---
  return (
    <div className="desktop-grid">
      
      {/* 1. Left Navigation panel */}
      <SidebarLeft
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Central Work Panel */}
      <main
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '24px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        
        {/* VIEW: MAIN CORE DASHBOARD (DESKTOP) */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* Top Greeting header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-cyber)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  SYSTEM ONLINE
                </span>
                <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  Good Morning Mallikarjun
                </h2>
              </div>
              
              {/* Clock and Calendar Widgets */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-cyber)', color: 'var(--accent-cyan)' }}>
                  {currentTime}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentDate}
                </div>
              </div>
            </div>

            {/* Central glowing AI Orb */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto',
                gap: '16px',
              }}
            >
              <Orb state={orbState} size={280} onClick={() => setActiveTab('assistant')} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 210, 255, 0.08)',
                  border: '1px solid rgba(0, 210, 255, 0.15)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  boxShadow: '0 0 10px rgba(0, 210, 255, 0.05)',
                  animation: 'breath 3s infinite',
                }}
              >
                <Sparkles size={12} />
                <span>AI Operating System Active • Press Ctrl+K for commands</span>
              </div>
            </div>

            {/* Bottom Widgets Grid (Gmail, Calendar, Tasks, Weather) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                width: '100%',
                marginTop: 'auto',
              }}
            >
              {/* Widget: Emails */}
              <div
                className="glass-panel"
                onClick={() => setActiveTab('gmail')}
                style={{ padding: '14px', display: 'flex', gap: '12px', cursor: 'pointer' }}
              >
                <Mail size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EMAILS</span>
                  <span style={{ fontSize: '18px', fontWeight: 800 }}>{unreadEmails.length} Unread</span>
                </div>
              </div>

              {/* Widget: Calendar */}
              <div
                className="glass-panel"
                onClick={() => setActiveTab('calendar')}
                style={{ padding: '14px', display: 'flex', gap: '12px', cursor: 'pointer' }}
              >
                <CalendarIcon size={20} style={{ color: 'var(--accent-purple)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MEETINGS</span>
                  <span style={{ fontSize: '18px', fontWeight: 800 }}>
                    {upcomingMeetings.length} Scheduled
                  </span>
                </div>
              </div>

              {/* Widget: Tasks */}
              <div
                className="glass-panel"
                onClick={() => setActiveTab('tasks')}
                style={{ padding: '14px', display: 'flex', gap: '12px', cursor: 'pointer' }}
              >
                <CheckSquare size={20} style={{ color: 'var(--accent-cyan)', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TASKS</span>
                  <span style={{ fontSize: '18px', fontWeight: 800 }}>
                    {pendingTasks.filter((t) => t.status === 'PENDING').length} Pending
                  </span>
                </div>
              </div>

              {/* Widget: Weather */}
              <div
                className="glass-panel"
                style={{ padding: '14px', display: 'flex', gap: '12px' }}
              >
                <CloudSun size={20} style={{ color: '#fbbf24', marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WEATHER</span>
                  <span style={{ fontSize: '18px', fontWeight: 800 }}>24°C • Cloud</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW: ASSISTANT CHAT SCREEN */}
        {activeTab === 'assistant' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>JARVIS ASSISTANT SESSION</h3>
                <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>Gemini 1.5 Flash Model linked with workspace APIs</span>
              </div>
            </div>

            {/* Chat History Panel */}
            <div
              style={{
                flexGrow: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                paddingRight: '6px',
              }}
            >
              {chatHistory.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--text-muted)' }}>
                  <Orb state={orbState} size={150} />
                  <span>Establish conversation telemetry. Ask me anything.</span>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      gap: '6px',
                    }}
                  >
                    {/* Thoughts render (for Assistant responses) */}
                    {msg.role === 'assistant' && msg.thoughts && (
                      <div
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: 'var(--accent-cyan)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px dashed rgba(0, 210, 255, 0.15)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          maxWidth: '85%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Jarvis monolog:
                        </span>
                        {msg.thoughts}
                      </div>
                    )}

                    <div
                      style={{
                        background: msg.role === 'user' ? 'rgba(0, 210, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: msg.role === 'user' ? '1px solid rgba(0, 210, 255, 0.15)' : '1px solid var(--border-glass)',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        maxWidth: '85%',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {isAiReplying && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--primary)', fontSize: '13px' }}>
                  <Loader2 size={14} className="spin-slow" />
                  <span>Jarvis is reasoning and executing tools...</span>
                </div>
              )}
            </div>

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              style={{
                display: 'flex',
                gap: '12px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '8px',
                borderRadius: '16px',
                border: '1px solid var(--border-glass)',
              }}
            >
              <input
                type="text"
                placeholder="Ask Jarvis to search emails, scheduling meetings, analyze sheets..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                style={{ flexGrow: 1, border: 'none', background: 'transparent', boxShadow: 'none' }}
                disabled={isAiReplying}
              />
              <button
                type="submit"
                disabled={isAiReplying || !chatMessage.trim()}
                style={{
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  color: 'var(--text-primary)',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* View Component Mounting */}
        {activeTab === 'gmail' && <GmailView />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'sheets' && <SheetsView />}
        {activeTab === 'drive' && <DriveView />}
        {activeTab === 'docs' && <DocsView />}
        {activeTab === 'memory' && <MemoryView />}
        {activeTab === 'automation' && <AutomationView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'knowledge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>KNOWLEDGE BASE SUMMARY</h2>
            <div className="glass-panel" style={{ padding: '20px', lineHeight: '1.6' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Jarvis OS Workspace Architecture</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                Jarvis OS operates by compiling local database memories and workspace folders, exposing them via tools to a core Gemini Flash node. 
                All file read/write updates, email drafts, calendar entries, and analysis sheets are checked for conflicts and handled in real time.
              </p>
              <h4 style={{ color: 'var(--accent-purple)', fontSize: '13px', marginTop: '16px', marginBottom: '8px' }}>Active Scopes:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>gmail.modify (Compose, Reply, Archive, Trash)</li>
                <li>calendar (CRUD events, Conflict checking, NLP schedules)</li>
                <li>spreadsheets (Analyze grids, update cells, charts calculations)</li>
                <li>drive (Browse structures, delete trash files, open Google Docs)</li>
                <li>documents (Rewrite, summarization, spelling corrections)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Browser Voice Controller Overlay (Floating bottom right) */}
        <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 99 }}>
          <VoiceController
            onTranscriptComplete={(text) => handleSendChat(text)}
            isAiResponding={isAiReplying}
            aiResponseText={aiSpeechText}
            voiceEnabled={voiceOutputActive}
            setVoiceEnabled={setVoiceOutputActive}
            setOrbState={setOrbState}
          />
        </div>

      </main>

      {/* 3. Right OS Telemetry Feed panel */}
      <SidebarRight
        recentEmails={unreadEmails}
        upcomingMeetings={upcomingMeetings}
        aiThoughts={aiThoughts}
        apiStatus={{
          gemini: 'online',
          google: user?.hasGoogleAuth ? 'online' : 'offline',
          sqlite: 'online',
        }}
        runningAutomations={recentLogs}
      />

      {/* Keyboard-triggered Command Shortcut Console */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveTab={setActiveTab}
        onCreateTask={handlePaletteCreateTask}
        onTriggerAutomation={handlePaletteTriggerAutomation}
      />

    </div>
  );
}
