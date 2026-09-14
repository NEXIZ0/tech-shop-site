import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('techstore_lang');
    if (saved === 'en' || saved === 'fa') {
      return saved;
    }
    return 'fa'; // زبان پیش‌فرض: فارسی
  });

  useEffect(() => {
    const root = document.documentElement;
    if (language === 'fa') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'fa');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    }
    localStorage.setItem('techstore_lang', language);
  }, [language]);

  const setLanguage = useCallback((lang) => {
    if (lang === 'fa' || lang === 'en') {
      setLanguageState(lang);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => prev === 'fa' ? 'en' : 'fa');
  }, []);

  /**
   * تابع ترجمه کلیدهای تودرتو
   * مثال: t('nav.home') یا t('orderStatus.pending.badge')
   */
  const t = useCallback((path, fallback = '') => {
    if (!path) return fallback;
    const keys = path.split('.');
    
    // ۱. جستجو در زبان فعلی
    let current = translations[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        current = null;
        break;
      }
    }

    if (current !== null && current !== undefined) {
      return current;
    }

    // ۲. فالبک به زبان دیگر
    const altLang = language === 'fa' ? 'en' : 'fa';
    let altCurrent = translations[altLang];
    for (const key of keys) {
      if (altCurrent && typeof altCurrent === 'object' && key in altCurrent) {
        altCurrent = altCurrent[key];
      } else {
        altCurrent = null;
        break;
      }
    }

    if (altCurrent !== null && altCurrent !== undefined) {
      return altCurrent;
    }

    return fallback || path;
  }, [language]);

  const isRtl = language === 'fa';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
