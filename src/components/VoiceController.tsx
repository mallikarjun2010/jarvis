'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceControllerProps {
  onTranscriptComplete: (text: string) => void;
  isAiResponding: boolean;
  aiResponseText: string;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  setOrbState: (state: any) => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onTranscriptComplete,
  isAiResponding,
  aiResponseText,
  voiceEnabled,
  setVoiceEnabled,
  setOrbState,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Recognition & Synthesis on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setOrbState('listening');
          setTranscript('');
        };

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              setTranscript(text);
              onTranscriptComplete(text);
              stopListening();
            } else {
              interimTranscript += event.results[i][0].transcript;
              setTranscript(interimTranscript);
            }
          }
        };

        rec.onerror = (e: any) => {
          console.error('Speech recognition error:', e);
          stopListening();
        };

        rec.onend = () => {
          setIsListening(false);
          setOrbState('idle');
        };

        recognitionRef.current = rec;
      }

      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Text-To-Speech response effect when voice is enabled and AI replies
  useEffect(() => {
    if (voiceEnabled && aiResponseText && synthRef.current) {
      // Cancel current speaking if any
      synthRef.current.cancel();

      // Clean up thoughts blocks from speech
      const textToSpeak = aiResponseText.replace(/<thoughts>[\s\S]*?<\/thoughts>/gi, '').trim();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Select a premium male sounding voice (if available, e.g. Google US English, Microsoft David)
      const voices = synthRef.current.getVoices();
      const preferredVoice =
        voices.find(v => v.name.includes('Google US English') || v.name.includes('David') || v.name.includes('Natural')) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.rate = 1.05;
      utterance.pitch = 0.95;

      utterance.onstart = () => {
        setOrbState('speaking');
      };

      utterance.onend = () => {
        setOrbState('idle');
      };

      utterance.onerror = () => {
        setOrbState('idle');
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    }
  }, [aiResponseText, voiceEnabled]);

  const startListening = () => {
    if (synthRef.current?.speaking) {
      synthRef.current.cancel(); // Interrupt speech on user click
    }
    
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.warn('Speech recognition already active.');
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setOrbState('idle');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleVoiceOutput = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    if (!newVal && synthRef.current) {
      synthRef.current.cancel();
      setOrbState('idle');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '24px',
        border: '1px solid var(--border-glass)',
        boxShadow: isListening ? '0 0 15px rgba(0, 210, 255, 0.2)' : 'none',
        transition: 'var(--transition-smooth)',
      }}
    >
      {/* Listening status text */}
      {isListening && (
        <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
          {transcript || 'Listening...'}
        </span>
      )}

      {/* Mic toggle */}
      <button
        onClick={toggleListening}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isListening ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          color: isListening ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          border: isListening ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
          boxShadow: isListening ? '0 0 10px rgba(0, 245, 212, 0.3)' : 'none',
        }}
        title="Toggle Microphone (Voice Input)"
      >
        {isListening ? <Mic size={16} /> : <MicOff size={16} />}
      </button>

      {/* TTS voice feedback output toggle */}
      <button
        onClick={toggleVoiceOutput}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: voiceEnabled ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          color: voiceEnabled ? 'var(--primary)' : 'var(--text-secondary)',
          border: voiceEnabled ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
        }}
        title="Toggle Voice Output (Speech Synthesis)"
      >
        {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </div>
  );
};
export default VoiceController;
