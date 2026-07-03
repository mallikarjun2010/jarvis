'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Sparkles, RefreshCw, Trash2, MapPin } from 'lucide-react';

export const CalendarView = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [naturalQuery, setNaturalQuery] = useState('');
  const [aiScheduling, setAiScheduling] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Form states for manual creation
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleNaturalSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;

    setAiScheduling(true);
    setAiMessage('');
    try {
      // Direct prompt trigger to Agent endpoint which resolves calendar functions
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please schedule this event: "${naturalQuery}". Confirm when it is created.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiMessage(data.content);
        setNaturalQuery('');
        fetchEvents(); // Refresh meetings list
      } else {
        setAiMessage(`Scheduling failed: ${data.error}`);
      }
    } catch (err) {
      setAiMessage('Failed to connect to agent service.');
    } finally {
      setAiScheduling(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !date || !startTime || !endTime) return;

    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = new Date(`${date}T${endTime}`).toISOString();

    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          startTime: startISO,
          endTime: endISO,
          description,
          location,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSummary('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setDescription('');
        setLocation('');
        setShowManualForm(false);
        fetchEvents();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to save event.');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/calendar?eventId=${eventId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
      }
    } catch (e) {
      alert('Delete failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', paddingRight: '4px' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={24} style={{ color: 'var(--accent-purple)' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-cyber)' }}>GOOGLE CALENDAR</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}
          >
            <Plus size={14} />
            Quick Event
          </button>
          <button
            onClick={fetchEvents}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
      </div>

      {/* 1. Natural Language Scheduler */}
      <div
        className="glass-panel"
        style={{
          padding: '16px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', fontFamily: 'var(--font-cyber)', color: 'var(--accent-cyan)' }}>
          NATURAL LANGUAGE SCHEDULER
        </h3>
        <form onSubmit={handleNaturalSchedule} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder='e.g., "Schedule meeting with Rahul tomorrow at 4PM for 30 mins"'
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            style={{ flexGrow: 1 }}
          />
          <button
            type="submit"
            disabled={aiScheduling}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              color: 'var(--text-primary)',
              padding: '0 20px',
              borderRadius: '8px',
              fontWeight: 500,
            }}
          >
            <Sparkles size={14} />
            {aiScheduling ? 'Scheduling...' : 'AI Schedule'}
          </button>
        </form>

        {aiMessage && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--accent-cyan)',
              fontFamily: 'monospace',
              background: 'rgba(0, 245, 212, 0.05)',
              padding: '10px',
              borderRadius: '6px',
              borderLeft: '2px solid var(--accent-cyan)',
            }}
          >
            {aiMessage}
          </div>
        )}
      </div>

      {/* 2. Manual Creation Form Modal/Expand */}
      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="border-glow-cyber"
          style={{
            background: 'rgba(10, 10, 15, 0.8)',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Create New Calendar Event</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Event Title Summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="text"
              placeholder="Location (e.g. Google Meet, Office)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description Notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              style={{ background: 'transparent', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary)',
                padding: '6px 16px',
                borderRadius: '6px',
                color: 'var(--text-primary)',
              }}
            >
              Create Event
            </button>
          </div>
        </form>
      )}

      {/* 3. Schedule List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
          UPCOMING EVENTS (7 DAYS)
        </h3>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />
          ))
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
            Calendar is clear. No scheduled meetings.
          </div>
        ) : (
          events.map((evt) => {
            const startD = new Date(evt.start);
            const endD = new Date(evt.end);
            const dateStr = startD.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = `${startD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

            return (
              <div
                key={evt.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {/* Calendar Icon Widget Badge */}
                  <div
                    style={{
                      background: 'rgba(157, 78, 221, 0.12)',
                      border: '1px solid rgba(157, 78, 221, 0.2)',
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>
                      {startD.toLocaleString([], { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '-2px' }}>
                      {startD.getDate()}
                    </span>
                  </div>

                  {/* Title & Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{evt.summary}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} />
                        {dateStr} ({timeStr})
                      </span>
                      {evt.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                          <MapPin size={11} />
                          {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  style={{ background: 'transparent', padding: '6px', borderRadius: '6px', color: '#f87171' }}
                  title="Delete Event"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
export default CalendarView;
