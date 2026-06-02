'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

export function VoiceInput({ onResult, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return;

        setLoading(true);
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const token = localStorage.getItem('token');
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const res = await fetch('http://localhost:4000/api/ai/speech', {
            method: 'POST', headers, body: formData,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.text) onResult(data.text);
        } catch (err: any) {
          setError(`识别失败: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError(`麦克风权限被拒绝或不可用`);
    }
  }, [onResult]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isRecording
              ? 'bg-[var(--accent-red)] text-white animate-pulse'
              : loading
                ? 'bg-[var(--accent-yellow)] text-black'
                : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]'
          }`}
        >
          {isRecording ? <><MicOff className="w-3.5 h-3.5" /> 停止录音</>
           : loading ? <><Mic className="w-3.5 h-3.5" /> 识别中...</>
           : <><Mic className="w-3.5 h-3.5" /> 开始语音</>}
        </button>
        <button onClick={onClose} className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-[var(--accent-red)]">{error}</p>}
      {isRecording && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-red)] animate-pulse" />
          <span className="text-xs text-[var(--accent-red)]">录音中... 说完点停止</span>
        </div>
      )}
    </div>
  );
}
