import { useState } from 'react';
import { Key, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface Props {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey: string | null;
  hasDefaultApiKey?: boolean;
}

export function ApiKeyInput({ onApiKeySet, currentApiKey, hasDefaultApiKey = false }: Props) {
  const { themeConfig } = useTheme();
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      setIsVisible(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  // When used in settings panel, always show the form
  // When API key is set, show a status indicator
  if (currentApiKey && !isVisible) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px 12px',
          background: themeConfig.colors.success + '20',
          borderRadius: '6px',
          border: `1px solid ${themeConfig.colors.success}`
        }}>
          <Check size={16} style={{ color: themeConfig.colors.success }} />
          <span style={{ fontSize: '14px', color: themeConfig.colors.text }}>
            API Key is set
          </span>
        </div>
        <button
          onClick={() => setIsVisible(true)}
          style={{
            padding: '8px 12px',
            background: themeConfig.colors.surface,
            color: themeConfig.colors.text,
            border: `1px solid ${themeConfig.colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeConfig.colors.surfaceElevated;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = themeConfig.colors.surface;
          }}
        >
          Change API Key
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label style={{ 
          fontSize: '13px', 
          color: themeConfig.colors.text, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          <Key size={16} />
          Gemini API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={handleChange}
          placeholder="Enter your API key"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${themeConfig.colors.border}`,
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            background: themeConfig.colors.background,
            color: themeConfig.colors.text,
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = themeConfig.colors.primary}
          onBlur={(e) => e.currentTarget.style.borderColor = themeConfig.colors.border}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!apiKey.trim()}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: apiKey.trim() ? themeConfig.colors.primary : themeConfig.colors.secondary,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
        >
          {currentApiKey ? 'Update' : 'Set'} API Key
        </button>
        {currentApiKey && (
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            style={{
              padding: '10px 16px',
              background: themeConfig.colors.surface,
              color: themeConfig.colors.text,
              border: `1px solid ${themeConfig.colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeConfig.colors.surfaceElevated;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = themeConfig.colors.surface;
            }}
          >
            Cancel
          </button>
        )}
      </div>
      <div style={{ fontSize: '12px', color: themeConfig.colors.textSecondary, lineHeight: '1.5' }}>
        {!currentApiKey && hasDefaultApiKey && (
          <div style={{ marginBottom: '6px', color: themeConfig.colors.success, fontWeight: '500' }}>
            ℹ️ Using default API key from server
          </div>
        )}
        Get your API key from{' '}
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: themeConfig.colors.primary }}>
          Google AI Studio
        </a>
      </div>
    </div>
  );
}

