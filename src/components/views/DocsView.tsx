'use client';

import React, { useState, useEffect } from 'react';
import { FileText, PlusCircle, Sparkles, RefreshCw, AlertCircle, Edit, Globe, Check } from 'lucide-react';

export const DocsView = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [fetchingContent, setFetchingContent] = useState(false);
  const [error, setError] = useState('');

  // AI assistant helper states
  const [aiWorking, setAiWorking] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // Creation form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/drive?q=${encodeURIComponent("mimeType='application/vnd.google-apps.document'")}`);
      const data = await res.json();
      if (data.success) {
        setDocs(data.files || []);
        if (data.files?.length > 0 && !selectedDocId) {
          handleSelectDoc(data.files[0].id);
        }
      } else {
        setError('Failed to fetch documents list');
      }
    } catch (e) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = async (docId: string) => {
    setSelectedDocId(docId);
    setFetchingContent(true);
    setError('');
    setDocContent('');
    setAiResult('');
    try {
      const res = await fetch(`/api/docs?documentId=${docId}`);
      const data = await res.json();
      if (data.success) {
        setDocTitle(data.title);
        setDocContent(data.content || '');
      } else {
        setError(data.error || 'Failed to retrieve document content');
      }
    } catch (err) {
      setError('Failed to connect to document node.');
    } finally {
      setFetchingContent(false);
    }
  };

  const handleAiAction = async (actionType: 'summarize' | 'rewrite' | 'translate' | 'grammar') => {
    if (!docContent.trim()) {
      alert('Document content is empty.');
      return;
    }

    setAiWorking(true);
    setAiResult('');

    let prompt = '';
    if (actionType === 'summarize') {
      prompt = `Summarize this Google Doc text content, highlight key milestones and actions items: \n\n${docContent}`;
    } else if (actionType === 'rewrite') {
      prompt = `Rewrite this Google Doc text content to sound more professional, premium, and refined. Keep key facts unchanged: \n\n${docContent}`;
    } else if (actionType === 'translate') {
      prompt = `Translate this text content to Hindi, keeping structure and formatting identical: \n\n${docContent}`;
    } else if (actionType === 'grammar') {
      prompt = `Review this document content, fix all spelling, layout, and grammar errors, returning the corrected output directly: \n\n${docContent}`;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.content);
      } else {
        setAiResult(`Failed to run AI Assistant: ${data.error}`);
      }
    } catch (e) {
      setAiResult('AI Assistant connection failed.');
    } finally {
      setAiWorking(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewContent('');
        alert('Document created successfully.');
        fetchDocs(); // Reload list
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Server error creating doc.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>GOOGLE DOCS</h2>
        </div>
        <button
          onClick={fetchDocs}
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
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', color: '#f87171', fontSize: '13px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Editor & Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', height: '360px' }}>
        
        {/* File index */}
        <div className="glass-panel" style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>DOCUMENT INDEX</h4>
          {loading ? (
            <div className="skeleton" style={{ height: '100px', width: '100%' }} />
          ) : (
            docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc.id)}
                style={{
                  display: 'block',
                  textAlign: 'left',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: selectedDocId === doc.id ? 'rgba(0, 210, 255, 0.08)' : 'transparent',
                  border: selectedDocId === doc.id ? '1px solid rgba(0, 210, 255, 0.15)' : '1px solid transparent',
                  color: selectedDocId === doc.id ? 'var(--primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {doc.name}
              </button>
            ))
          )}
        </div>

        {/* Text Area Editor panel */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {fetchingContent ? 'Loading...' : docTitle || 'Select Document'}
            </h3>
            
            {/* AI Assistant tool row */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleAiAction('summarize')}
                disabled={fetchingContent || aiWorking || !selectedDocId}
                style={{ background: 'rgba(157, 78, 221, 0.12)', border: '1px solid rgba(157, 78, 221, 0.2)', color: 'var(--accent-purple)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Sparkles size={11} /> Summarize
              </button>
              <button
                onClick={() => handleAiAction('rewrite')}
                disabled={fetchingContent || aiWorking || !selectedDocId}
                style={{ background: 'rgba(0, 210, 255, 0.08)', border: '1px solid rgba(0, 210, 255, 0.2)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Edit size={11} /> Professional
              </button>
              <button
                onClick={() => handleAiAction('translate')}
                disabled={fetchingContent || aiWorking || !selectedDocId}
                style={{ background: 'rgba(0, 245, 212, 0.08)', border: '1px solid rgba(0, 245, 212, 0.2)', color: 'var(--accent-cyan)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Globe size={11} /> Translate
              </button>
              <button
                onClick={() => handleAiAction('grammar')}
                disabled={fetchingContent || aiWorking || !selectedDocId}
                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={11} /> Grammar
              </button>
            </div>
          </div>

          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            disabled={fetchingContent}
            placeholder="Document text body content will load here..."
            style={{ flexGrow: 1, resize: 'none', fontSize: '13px', lineHeight: '1.6' }}
          />
        </div>
      </div>

      {/* AI Assistant Output Result block */}
      {(aiWorking || aiResult) && (
        <div className="glass-panel" style={{ padding: '16px', borderLeft: '3px solid var(--accent-purple)', background: 'rgba(157, 78, 221, 0.03)' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> AI WRITER RESPONSE OUTPUT
          </h4>
          {aiWorking ? (
            <div className="skeleton" style={{ height: '60px', width: '100%' }} />
          ) : (
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {aiResult}
            </p>
          )}
        </div>
      )}

      {/* Creation form */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)', color: 'var(--primary)' }}>
          CREATE NEW DOCUMENT
        </h3>
        <form onSubmit={handleCreateDoc} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="New Document Title (e.g. Budget Report)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Initial text content to insert..."
            rows={4}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
            style={{ resize: 'none' }}
          />
          <button
            type="submit"
            disabled={creating}
            style={{
              background: 'rgba(0, 210, 255, 0.08)',
              border: '1px solid rgba(0, 210, 255, 0.2)',
              color: 'var(--primary)',
              borderRadius: '8px',
              padding: '10px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <PlusCircle size={16} />
            {creating ? 'Creating Document...' : 'Create Google Doc'}
          </button>
        </form>
      </div>

    </div>
  );
};
export default DocsView;
