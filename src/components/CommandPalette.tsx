'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Navigation, PlusCircle, Play, Check } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: any) => void;
  onCreateTask: (title: string) => void;
  onTriggerAutomation: (type: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onCreateTask,
  onTriggerAutomation,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global key listener to toggle palette
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commands = [
    { id: 'goto_dashboard', title: 'Navigate: Dashboard', category: 'Navigation', icon: Navigation, action: () => setActiveTab('dashboard') },
    { id: 'goto_assistant', title: 'Navigate: Assistant Chat', category: 'Navigation', icon: Sparkles, action: () => setActiveTab('assistant') },
    { id: 'goto_gmail', title: 'Navigate: Gmail', category: 'Navigation', icon: Navigation, action: () => setActiveTab('gmail') },
    { id: 'goto_calendar', title: 'Navigate: Calendar', category: 'Navigation', icon: Navigation, action: () => setActiveTab('calendar') },
    { id: 'goto_sheets', title: 'Navigate: Sheets', category: 'Navigation', icon: Navigation, action: () => setActiveTab('sheets') },
    { id: 'goto_drive', title: 'Navigate: Drive File Manager', category: 'Navigation', icon: Navigation, action: () => setActiveTab('drive') },
    { id: 'goto_docs', title: 'Navigate: Google Docs Editor', category: 'Navigation', icon: Navigation, action: () => setActiveTab('docs') },
    { id: 'goto_memory', title: 'Navigate: Memory Bank', category: 'Navigation', icon: Navigation, action: () => setActiveTab('memory') },
    { id: 'goto_settings', title: 'Navigate: Settings', category: 'Navigation', icon: Navigation, action: () => setActiveTab('settings') },
    { id: 'action_digest', title: 'Run: Morning OS Digest', category: 'Automation', icon: Play, action: () => onTriggerAutomation('DAILY_PLAN') },
    { id: 'action_prep', title: 'Run: Evening Prep Digest', category: 'Automation', icon: Play, action: () => onTriggerAutomation('EVENING_PREP') },
  ];

  // Filter commands based on input
  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase())
  );

  // Handle dynamic task creation if no match is found
  const isCreateTaskAction = search.trim().length > 0 && filtered.length === 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (isCreateTaskAction ? 1 : filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (isCreateTaskAction ? 1 : filtered.length)) % (isCreateTaskAction ? 1 : filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isCreateTaskAction) {
        onCreateTask(search);
        onClose();
      } else if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel-heavy border-glow-cyber"
        style={{
          width: '600px',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
        }}
      >
        {/* Search Input Area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderBottom: '1px solid var(--border-glass)',
          }}
        >
          <Search size={18} style={{ color: 'var(--primary)' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or quick task title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flexGrow: 1,
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '16px',
              color: 'var(--text-primary)',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          <kbd
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-glass)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div style={{ overflowY: 'auto', padding: '8px' }}>
          {isCreateTaskAction ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(0, 210, 255, 0.08)',
                color: 'var(--primary)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
              onClick={() => {
                onCreateTask(search);
                onClose();
              }}
            >
              <PlusCircle size={16} />
              <span>
                Create task: <strong>"{search}"</strong>
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              No matching commands.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'var(--transition-smooth)',
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={14} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '14px', fontWeight: isSelected ? 500 : 400 }}>
                      {cmd.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'rgba(255,255,255,0.03)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
