'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface UseAudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  recordingBlob: Blob | null;
  error: string | null;
}

export function useAudioRecorder({
  onRecordingComplete,
}: UseAudioRecorderProps = {}): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  
  // Clean up function to stop recording and release resources
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
  }, [isRecording]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // Start recording function
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordingBlob(null);
      setRecordingDuration(0);
      chunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        setRecordingBlob(audioBlob);
        
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, recordingDuration);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Failed to start recording');
      
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access to record audio.',
        variant: 'destructive',
      });
    }
  }, [onRecordingComplete, recordingDuration, toast]);
  
  // Stop recording function
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError(err.message || 'Failed to stop recording');
    }
  }, [isRecording]);
  
  // Cancel recording function
  const cancelRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setRecordingDuration(0);
    setRecordingBlob(null);
    chunksRef.current = [];
  }, [cleanup]);
  
  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    recordingBlob,
    error,
  };
}
