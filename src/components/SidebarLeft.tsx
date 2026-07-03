'use client';

import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Mail,
  Calendar,
  FileSpreadsheet,
  HardDrive,
  FileText,
  CheckSquare,
  Cpu,
  Brain,
  BookOpen,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';

export type SidebarTab =
  | 'dashboard'
  | 'assistant'
  | 'gmail'
  | 'calendar'
  | 'sheets'
  | 'drive'
  | 'docs'
  | 'tasks'
  | 'automation'
  | 'memory'
  | 'knowledge'
  | 'settings';

interface SidebarLeftProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  user: any;
  onLogout: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assistant', label: 'Assistant', icon: MessageSquare },
    { id: 'gmail', label: 'Gmail', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'sheets', label: 'Sheets', icon: FileSpreadsheet },
    { id: 'drive', label: 'Drive', icon: HardDrive },
    { id: 'docs', label: 'Docs', icon: FileText },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'automation', label: 'Automation', icon: Cpu },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 16px',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
            paddingLeft: '8px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 10px var(--primary)',
              animation: 'breath 3s infinite',
            }}
          />
          <h1
            className="text-glow-cyber"
            style={{
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '1.5px',
            }}
          >
            JARVIS OS
          </h1>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  width: '100%',
                  borderRadius: '10px',
                  textAlign: 'left',
                  background: isActive ? 'rgba(0, 210, 255, 0.08)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(0, 210, 255, 0.15)' : '1px solid transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  transition: 'var(--transition-smooth)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={18} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Info */}
      <div
        style={{
          borderTop: '1px solid var(--border-glass)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {user ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px',
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {user.name?.charAt(0)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', width: 'calc(100% - 46px)' }}>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.name}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <UserCheck size={10} /> Sync Active
              </span>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Offline
          </div>
        )}

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            width: '100%',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          }}
        >
          <LogOut size={14} />
          <span>Exit System</span>
        </button>
      </div>
    </aside>
  );
};
export default SidebarLeft;
