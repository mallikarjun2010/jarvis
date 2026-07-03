'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Search, Send, Archive, Trash2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

export const GmailView = () => {
  const [emails, setEmailList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [aiDigest, setAiDigest] = useState('');
  const [digesting, setDigesting] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async (q = 'is:unread') => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/gmail?q=${encodeURIComponent(q)}&maxResults=10`);
      const data = await res.json();
      if (data.success) {
        setEmailList(data.emails || []);
      } else {
        setError(data.error || 'Failed to retrieve emails');
      }
    } catch (e) {
      setError('Connection to Gmail node failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails(searchQuery || 'is:unread');
  };

  const handleAction = async (messageId: string, action: 'archive' | 'delete') => {
    try {
      const res = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailList((prev) => prev.filter((email) => email.id !== messageId));
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert('Communication error.');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessageId || !replyBody.trim()) return;

    setReplyStatus('sending');
    try {
      const res = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          messageId: replyMessageId,
          body: replyBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyStatus('success');
        setReplyBody('');
        setTimeout(() => {
          setReplyMessageId(null);
          setReplyStatus('');
        }, 1500);
      } else {
        setReplyStatus(`error: ${data.error}`);
      }
    } catch (e) {
      setReplyStatus('error: Connection timeout.');
    }
  };

  const handleGenerateDigest = async () => {
    setDigesting(true);
    setAiDigest('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Generate a short AI summary and daily digest of my latest emails.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiDigest(data.content);
      } else {
        setAiDigest(`Failed to compile digest: ${data.error}`);
      }
    } catch (e) {
      setAiDigest('Failed to connect to agent node.');
    } finally {
      setDigesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Mail size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>GMAIL INTEGRATION</h2>
        </div>
        <button
          onClick={() => fetchEmails()}
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
          Reload
        </button>
      </div>

      {/* Control row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search emails (e.g. from:Rahul query:invoice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flexGrow: 1 }}
          />
          <button
            type="submit"
            style={{
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              borderRadius: '8px',
              padding: '0 16px',
              color: 'var(--text-primary)',
            }}
          >
            <Search size={16} />
          </button>
        </form>

        <button
          onClick={handleGenerateDigest}
          disabled={digesting}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(157, 78, 221, 0.15)',
            border: '1px solid var(--accent-purple)',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            fontWeight: 500,
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--accent-purple)' }} />
          {digesting ? 'Compiling...' : 'Generate Digest'}
        </button>
      </div>

      {/* AI Digest Output Panel */}
      {(aiDigest || digesting) && (
        <div
          className="border-glow-cyber"
          style={{
            background: 'rgba(157, 78, 221, 0.05)',
            border: '1px solid rgba(157, 78, 221, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> AI DIGEST RESULTS
          </h3>
          {digesting ? (
            <div className="skeleton" style={{ height: '60px', width: '100%' }} />
          ) : (
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {aiDigest}
            </p>
          )}
        </div>
      )}

      {/* Error telemetry alert */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Mailbox List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '78px', borderRadius: '12px' }} />
          ))
        ) : emails.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
            Inbox is clear. No unread messages found.
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'var(--transition-smooth)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '70%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)' }}>
                    {email.from.split(' <')[0]}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(email.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {email.subject}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email.snippet}
                </p>
              </div>

              {/* Action operations button row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setReplyMessageId(email.id);
                    setReplyBody('');
                  }}
                  style={{
                    background: 'rgba(0, 210, 255, 0.08)',
                    border: '1px solid rgba(0, 210, 255, 0.15)',
                    color: 'var(--primary)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                >
                  Reply
                </button>
                <button
                  onClick={() => handleAction(email.id, 'archive')}
                  style={{ background: 'transparent', padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
                  title="Archive Email"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Archive size={14} />
                </button>
                <button
                  onClick={() => handleAction(email.id, 'delete')}
                  style={{ background: 'transparent', padding: '6px', borderRadius: '6px', color: '#f87171' }}
                  title="Trash Email"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reply Dialog Modal */}
      {replyMessageId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <form
            onSubmit={handleSendReply}
            className="glass-panel-heavy"
            style={{ width: '500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-cyber)' }}>DRAFT REPLY</h3>
            <textarea
              placeholder="Write your email reply here..."
              rows={6}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setReplyMessageId(null)}
                style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={replyStatus === 'sending'}
                style={{
                  background: 'var(--primary-glow)',
                  border: '1px solid var(--primary)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Send size={14} />
                {replyStatus === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </div>
            {replyStatus === 'success' && <p style={{ color: 'var(--accent-cyan)', fontSize: '13px', textAlign: 'center' }}>Reply sent successfully.</p>}
            {replyStatus.startsWith('error') && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>{replyStatus}</p>}
          </form>
        </div>
      )}
    </div>
  );
};
export default GmailView;
