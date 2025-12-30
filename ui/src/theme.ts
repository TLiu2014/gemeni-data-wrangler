// Theme configuration inspired by Google Gemini
export type Theme = 'light' | 'dark';

export const lightTheme = {
  name: 'light' as const,
  colors: {
    primary: '#4285f4', // Google Blue
    primaryDark: '#1967d2',
    secondary: '#9aa0a6', // Google Gray
    accent: '#ea4335', // Google Red (for accents)
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceElevated: '#ffffff',
    text: '#202124',
    textSecondary: '#5f6368',
    textTertiary: '#9aa0a6',
    border: '#dadce0',
    borderLight: '#e8eaed',
    error: '#ea4335',
    success: '#34a853',
    warning: '#fbbc04',
    info: '#4285f4',
    // Gemini-specific
    geminiBlue: '#4285f4',
    geminiPurple: '#9c27b0',
    geminiGradient: 'linear-gradient(135deg, #4285f4 0%, #9c27b0 100%)',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 2px 4px rgba(0,0,0,0.1)',
    lg: '0 4px 8px rgba(0,0,0,0.15)',
    xl: '0 8px 16px rgba(0,0,0,0.2)',
  }
};

export const darkTheme = {
  name: 'dark' as const,
  colors: {
    primary: '#8ab4f8', // Lighter blue for dark mode
    primaryDark: '#4285f4',
    secondary: '#9aa0a6',
    accent: '#f28b82', // Softer red for dark mode
    background: '#202124', // Google Dark Gray
    surface: '#303134', // Darker surface
    surfaceElevated: '#3c4043',
    text: '#e8eaed', // Light text
    textSecondary: '#bdc1c6',
    textTertiary: '#9aa0a6',
    border: '#5f6368',
    borderLight: '#3c4043',
    error: '#f28b82',
    success: '#81c995',
    warning: '#fdd663',
    info: '#8ab4f8',
    // Gemini-specific
    geminiBlue: '#8ab4f8',
    geminiPurple: '#ce93d8',
    geminiGradient: 'linear-gradient(135deg, #8ab4f8 0%, #ce93d8 100%)',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 2px 4px rgba(0,0,0,0.4)',
    lg: '0 4px 8px rgba(0,0,0,0.5)',
    xl: '0 8px 16px rgba(0,0,0,0.6)',
  }
};

export type ThemeColors = typeof lightTheme.colors;
export type ThemeConfig = typeof lightTheme;

