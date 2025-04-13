'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface TokenUsageData {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
}

interface UseTokenUsageProps {
  sessionId?: string;
  userId?: string;
}

interface UseTokenUsageReturn {
  tokenUsage: {
    session: TokenUsageData;
    total: TokenUsageData;
  };
  addTokenUsage: (usage: TokenUsageData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Pricing constants (per 1000 tokens)
const MODEL_PRICING = {
  'gemini-pro': {
    input: 0.00025,  // $0.00025 per 1K input tokens
    output: 0.0005,  // $0.0005 per 1K output tokens
  },
  'gemini-pro-vision': {
    input: 0.0025,   // $0.0025 per 1K input tokens
    output: 0.0005,  // $0.0005 per 1K output tokens
  },
};

// Default token limit per session
const DEFAULT_SESSION_LIMIT = 100000;

export function useTokenUsage({ sessionId = 'default', userId }: UseTokenUsageProps = {}): UseTokenUsageReturn {
  const [tokenUsage, setTokenUsage] = useState<{
    session: TokenUsageData;
    total: TokenUsageData;
  }>({
    session: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      model: 'gemini-pro',
    },
    total: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      model: 'gemini-pro',
    },
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load token usage on mount
  useEffect(() => {
    if (userId) {
      loadTokenUsage();
    }
  }, [userId, sessionId]);

  // Load token usage from API
  const loadTokenUsage = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/token-usage?sessionId=${sessionId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load token usage');
      }
      
      setTokenUsage({
        session: data.sessionUsage,
        total: data.totalUsage,
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading token usage');
      console.error('Load token usage error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate cost based on tokens and model
  const calculateCost = (promptTokens: number, completionTokens: number, model: string): number => {
    const pricing = MODEL_PRICING[model as keyof typeof MODEL_PRICING] || MODEL_PRICING['gemini-pro'];
    
    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  };

  // Add token usage
  const addTokenUsage = async (usage: TokenUsageData) => {
    // Update local state immediately
    setTokenUsage(prev => {
      const newSessionPromptTokens = prev.session.promptTokens + usage.promptTokens;
      const newSessionCompletionTokens = prev.session.completionTokens + usage.completionTokens;
      const newSessionTotalTokens = newSessionPromptTokens + newSessionCompletionTokens;
      
      const newTotalPromptTokens = prev.total.promptTokens + usage.promptTokens;
      const newTotalCompletionTokens = prev.total.completionTokens + usage.completionTokens;
      const newTotalTokens = newTotalPromptTokens + newTotalCompletionTokens;
      
      const newSessionCost = calculateCost(newSessionPromptTokens, newSessionCompletionTokens, usage.model);
      const newTotalCost = calculateCost(newTotalPromptTokens, newTotalCompletionTokens, usage.model);
      
      return {
        session: {
          promptTokens: newSessionPromptTokens,
          completionTokens: newSessionCompletionTokens,
          totalTokens: newSessionTotalTokens,
          estimatedCost: newSessionCost,
          model: usage.model,
        },
        total: {
          promptTokens: newTotalPromptTokens,
          completionTokens: newTotalCompletionTokens,
          totalTokens: newTotalTokens,
          estimatedCost: newTotalCost,
          model: usage.model,
        },
      };
    });
    
    // Check if approaching token limit
    if (tokenUsage.session.totalTokens > DEFAULT_SESSION_LIMIT * 0.8) {
      toast({
        title: 'Approaching token limit',
        description: 'You are approaching your session token limit. Consider starting a new chat.',
        variant: 'warning',
      });
    }
    
    // Save to API if userId is provided
    if (userId) {
      try {
        const response = await fetch('/api/token-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            messageId: Date.now().toString(),
            ...usage,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save token usage');
        }
      } catch (err: any) {
        console.error('Save token usage error:', err);
        // Don't set error state to avoid UI disruption
      }
    }
  };

  return {
    tokenUsage,
    addTokenUsage,
    isLoading,
    error,
  };
}
