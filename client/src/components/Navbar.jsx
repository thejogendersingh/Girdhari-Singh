import React from 'react';
import { Languages } from 'lucide-react';

export default function Navbar({ lang, setLang }) {
  return (
    <nav className="site-navbar">
      <div className="site-navbar-inner">
        {/* Brand Logo: Logo + (Credo fix + PREMIUM ADHESIVE) */}
        <div className="brand-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Premium Adhesive Bottle SVG Logo spanning both lines perfectly */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="5 2 14 21" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ height: 44, width: 'auto' }}>
            <path d="M7 10v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V10" />
            <path d="M7 10C7 8 10 7 10 5" />
            <path d="M17 10C17 8 14 7 14 5" />
            <path d="M10 5V3h4v2" />
            <path d="M9 3h6" />
            <circle cx="12" cy="14" r="2" fill="#D4AF37" stroke="none" />
          </svg>

          <div className="brand-text-column" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="brand-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="brand-credo">Credo</span>
              <span className="brand-fix">fix</span>
            </div>
            <span className="brand-tagline-below" style={{ marginTop: '-2px', paddingLeft: '2px' }}>PREMIUM ADHESIVE</span>
          </div>
        </div>

        <button
          className="lang-switch-btn"
          onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
          title="Switch Language"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
        </button>
      </div>
    </nav>
  );
}
