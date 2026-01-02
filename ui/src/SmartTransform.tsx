import React, { useState } from 'react';
import { Send, Sparkles, Loader2, Upload, MessageSquare } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useTheme } from './ThemeProvider';

interface Props {
  schema: any[]; // The column definitions (available for future use)
  onTransform: (userPrompt: string) => Promise<void>;
  isProcessing: boolean;
  externalPrompt?: string; // Prompt from external source (e.g., stage panel)
  onPromptChange?: (prompt: string) => void; // Callback when prompt changes
  onImageUpload?: (file: File) => Promise<void>; // Callback for image upload
  explanation?: string; // Natural language explanation from Gemini
  status?: string; // Status message for processing
}

export function SmartTransform({ onTransform, isProcessing, externalPrompt, onPromptChange, onImageUpload, explanation, status }: Props) {
  const { themeConfig } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'upload'>('chat');
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  
  // Sync with external prompt changes
  React.useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== prompt) {
      setPrompt(externalPrompt);
    }
  }, [externalPrompt]);

  // Image upload dropzone
  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || !onImageUpload) return;
      
      const imageFile = acceptedFiles[0];
      if (!imageFile.type.startsWith('image/')) {
        return;
      }

      setIsImageProcessing(true);
      try {
        await onImageUpload(imageFile);
      } finally {
        setIsImageProcessing(false);
      }
    },
    multiple: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    disabled: isImageProcessing || isProcessing
  });

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

      {/* Tab View */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${themeConfig.colors.border}` }}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chat' ? `2px solid ${themeConfig.colors.primary}` : '2px solid transparent',
              color: activeTab === 'chat' ? themeConfig.colors.primary : themeConfig.colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: activeTab === 'chat' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            <MessageSquare size={16} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upload' ? `2px solid ${themeConfig.colors.primary}` : '2px solid transparent',
              color: activeTab === 'upload' ? themeConfig.colors.primary : themeConfig.colors.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: activeTab === 'upload' ? '600' : '400',
              transition: 'all 0.2s'
            }}
          >
            <Upload size={16} />
            Upload Image
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'chat' && (
          <div style={{ marginTop: '20px' }}>
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
                disabled={isProcessing || isImageProcessing || !prompt.trim()}
                style={{ 
                  padding: '12px 24px', 
                  background: (isProcessing || isImageProcessing || !prompt.trim()) ? themeConfig.colors.secondary : themeConfig.colors.primary, 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: (isProcessing || isImageProcessing || !prompt.trim()) ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontWeight: '500',
                  transition: 'background 0.2s'
                }}
              >
                {(isProcessing || isImageProcessing) ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                {(isProcessing || isImageProcessing) ? 'Processing...' : 'Go'}
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
        )}

        {activeTab === 'upload' && (
          <div style={{ marginTop: '20px' }}>
            <div {...getImageRootProps()} style={{ 
              border: `2px dashed ${themeConfig.colors.border}`, 
              padding: '40px', 
              textAlign: 'center', 
              cursor: 'pointer', 
              borderRadius: '8px', 
              background: themeConfig.colors.surfaceElevated,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = themeConfig.colors.primary;
              e.currentTarget.style.background = themeConfig.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = themeConfig.colors.border;
              e.currentTarget.style.background = themeConfig.colors.surfaceElevated;
            }}
            >
              <input {...getImageInputProps()} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={themeConfig.colors.primary} strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: themeConfig.colors.primary }}>
                  Upload Image
                </p>
              </div>
              <p style={{ fontSize: '13px', color: themeConfig.colors.textSecondary, marginTop: '4px', marginBottom: 0 }}>
                Upload an image of a stage flow diagram, data table, or schema. Gemini 3 will analyze it.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {(isProcessing || isImageProcessing) && (
        <div style={{ marginTop: '20px', marginBottom: explanation ? '16px' : '0' }}>
          <div style={{
            padding: '12px 16px',
            background: themeConfig.colors.surfaceElevated,
            borderRadius: '8px',
            border: `1px solid ${themeConfig.colors.border}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: themeConfig.colors.primary }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  color: themeConfig.colors.text,
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  {isImageProcessing ? 'Analyzing image...' : 'Processing...'}
                </div>
                {status && (
                  <div style={{
                    fontSize: '12px',
                    color: themeConfig.colors.textSecondary
                  }}>
                    {status}
                  </div>
                )}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '4px',
              background: themeConfig.colors.border,
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '30%',
                background: themeConfig.colors.primary,
                borderRadius: '2px',
                animation: 'progress 2s ease-in-out infinite'
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Explanation Text Area */}
      {explanation && (
        <div style={{ marginTop: '20px' }}>
          <div style={{
            padding: '16px',
            background: themeConfig.colors.surfaceElevated,
            borderRadius: '8px',
            border: `1px solid ${themeConfig.colors.border}`,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <div style={{
              fontSize: '13px',
              color: themeConfig.colors.textSecondary,
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              Explanation:
            </div>
            <div style={{
              fontSize: '14px',
              color: themeConfig.colors.text,
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}