// i18n.js - Language Toggle for EdgeTunnel BestSub v2

(function() {
  const htmlElement = document.documentElement;
  const langBtn = document.getElementById('langToggle');
  const langBtnMobile = document.getElementById('langToggleMobile');

  // Initialize language from localStorage or default to Chinese
  const savedLang = localStorage.getItem('lang') || 'zh';
  setLanguage(savedLang);

  function setLanguage(lang) {
    htmlElement.setAttribute('lang', lang);
    const btnText = lang === 'zh' ? 'EN' : '中文';

    if (langBtn) langBtn.textContent = btnText;
    if (langBtnMobile) langBtnMobile.textContent = btnText;

    // Save to localStorage
    localStorage.setItem('lang', lang);

    // Re-initialize Lucide icons after language change
    if (typeof lucide !== 'undefined') {
      setTimeout(() => lucide.createIcons(), 50);
    }
  }

  function toggleLanguage() {
    const currentLang = htmlElement.getAttribute('lang');
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    setLanguage(newLang);
  }

  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }

  if (langBtnMobile) {
    langBtnMobile.addEventListener('click', toggleLanguage);
  }
})();
