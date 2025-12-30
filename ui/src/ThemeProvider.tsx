import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from './theme';
import { lightTheme, darkTheme } from './theme';

interface ThemeContextType {
  theme: Theme;
  themeConfig: typeof lightTheme | typeof darkTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme') as Theme;
    if (saved === 'light' || saved === 'dark') return saved;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const themeConfig = theme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.style.setProperty('--theme-bg', themeConfig.colors.background);
    document.documentElement.style.setProperty('--theme-surface', themeConfig.colors.surface);
    document.documentElement.style.setProperty('--theme-text', themeConfig.colors.text);
    document.documentElement.style.setProperty('--theme-border', themeConfig.colors.border);
  }, [theme, themeConfig]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, toggleTheme }}>
      <div style={{
        background: themeConfig.colors.background,
        color: themeConfig.colors.text,
        minHeight: '100vh',
        transition: 'background-color 0.3s, color 0.3s'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

