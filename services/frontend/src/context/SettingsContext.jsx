import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/index.js';

const SettingsContext = createContext(null);

const defaultSettings = {
  theme: 'dark',
  language: 'en',
  dateFormat: 'mdy',
  notifications: {
    lowStock: true,
    outOfStock: true,
    overstock: true,
    orderUpdates: true,
    reportGeneration: true,
  },
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // Apply theme + language to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync language with i18n and apply RTL/LTR
  useEffect(() => {
    const lang = settings.language;
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [settings.language]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotification = (key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateNotification }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
