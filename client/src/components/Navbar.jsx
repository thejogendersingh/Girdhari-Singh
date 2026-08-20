import React from 'react';
import { Languages } from 'lucide-react';

export default function Navbar({ lang, setLang }) {
  return (
    <nav className="site-navbar">
      <div className="site-navbar-inner">
        {/* Brand Logo: Image Logo + Text */}
        <div className="brand-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Circular Image Logo Placeholder */}
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1.5px solid rgba(255,255,255,0.2)'
          }}>
            <img 
              src="/logo.png" 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Text Logo */}
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
          <Languages size={14} />
          <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
          <span style={{ fontSize: '0.65rem', marginLeft: '2px', opacity: 0.8 }}>▼</span>
        </button>
      </div>
    </nav>
  );
}
