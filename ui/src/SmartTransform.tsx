import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Props {
  schema: any[]; // The column definitions (available for future use)
  onTransform: (userPrompt: string) => Promise<void>;
  isProcessing: boolean;
  externalPrompt?: string; // Prompt from external source (e.g., stage panel)
  onPromptChange?: (prompt: string) => void; // Callback when prompt changes
}

export function SmartTransform({ onTransform, isProcessing, externalPrompt, onPromptChange }: Props) {
  const { themeConfig } = useTheme();
  const [prompt, setPrompt] = useState('');
  
  // Sync with external prompt changes
  React.useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== prompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onTransform(prompt); // Send prompt to parent
    setPrompt('');
  };

  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '20px', 
      background: themeConfig.colors.surface, 
      borderRadius: '12px', 
      border: `1px solid ${themeConfig.colors.border}`,
      boxShadow: themeConfig.shadows.md
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: themeConfig.colors.text,
        fontSize: '18px',
        fontWeight: '600'
      }}>
        <Sparkles size={20} style={{ color: themeConfig.colors.primary }} /> 
        Ask Gemini 3 to Transform
      </h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            onPromptChange?.(e.target.value);
          }}
          placeholder="e.g. 'Filter for sales over $500 and group by City'" 
          style={{ 
            flex: 1, 
            padding: '12px 16px', 
            borderRadius: '8px', 
            border: `1px solid ${themeConfig.colors.border}`,
            background: themeConfig.colors.surfaceElevated,
            color: themeConfig.colors.text,
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = themeConfig.colors.primary}
          onBlur={(e) => e.currentTarget.style.borderColor = themeConfig.colors.border}
        />
        <button 
          type="submit" 
          disabled={isProcessing || !prompt.trim()}
          style={{ 
            padding: '12px 24px', 
            background: isProcessing || !prompt.trim() ? themeConfig.colors.secondary : themeConfig.colors.primary, 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: isProcessing || !prompt.trim() ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
        >
          {isProcessing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          {isProcessing ? 'Processing...' : 'Go'}
        </button>
      </form>

      {/* Quick Suggestions */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
        <span style={{ color: themeConfig.colors.textSecondary }}>Try:</span>
        {['Calculate total revenue per month', 'Find top 5 customers', 'Filter rows where status is active'].map(txt => (
          <button 
            key={txt} 
            onClick={() => onTransform(txt)}
            style={{ border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '12px', padding: '2px 8px' }}
          >
            {txt}
          </button>
        ))}
      </div>
    </div>
  );
}