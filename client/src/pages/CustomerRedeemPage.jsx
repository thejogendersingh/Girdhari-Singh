import React, { useState, useEffect } from 'react';
import { PackageOpen, Youtube, CheckCircle2, AlertTriangle, IndianRupee, ShieldCheck, ChevronLeft, ChevronRight, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';

const TRANSLATIONS = {
  hi: {
    formTitle: 'अपना कैशबैक प्राप्त करें',
    formSubtitle: 'कैशबैक सीधे आपके बैंक खाते में भेजने के लिए नीचे सही जानकारी भरें।',
    nameLabel: 'आपका नाम (Your Name)',
    namePlaceholder: 'यहाँ अपना नाम लिखें',
    mobileLabel: 'आपका Paytm / PhonePe नंबर',
    mobilePlaceholder: '10 अंकों का मोबाइल नंबर डालें',
    codeLabel: 'कूपन कोड (Bottle के पीछे से)',
    codePlaceholder: '8-DIGIT CODE',
    claimBtn: 'Cashback प्राप्त करें',
    verifying: 'वेरिफाई हो रहा है...',
    fillAll: 'कृपया सभी जानकारी भरें (Please fill all details)',
    invalidCode: 'यह कोड अमान्य है या पहले ही उपयोग किया जा चुका है।',
    transferFail: 'कैशबैक ट्रांसफर विफल (Transfer Failed).',
    serverError: 'सर्वर एरर, कृपया थोड़ी देर बाद प्रयास करें।',
    successTitle: 'Cashback Sent!',
    successSub: 'सफलतापूर्वक ट्रांसफर हो गया',
    sentTo: 'खाता (Sent To)',
    refNo: 'रेफरेंस (Ref No)',
    product: 'प्रोडक्ट (Product)',
    nextCode: 'दूसरा कोड डालें',
    videoTitle: 'कैशबैक कैसे लें? (Video Guide)',
    step1Title: 'Scratch Code',
    step1: 'Bottle के पीछे दिया गया कोड खुरचें (Scratch)।',
    step2Title: 'Enter Details',
    step2: 'ऊपर फॉर्म में अपना नाम, मोबाइल नंबर और 8-अंकों का कोड डालें।',
    step3Title: 'Get Cashback',
    step3: 'बटन दबाएं और पैसा सीधे आपके Paytm/बैंक में आ जाएगा।',
    secure: '100% Secure & Guaranteed',
    admin: 'Admin Login'
  },
  en: {
    formTitle: 'Claim Your Cashback',
    formSubtitle: 'Fill in correct details below to receive cashback directly in your bank.',
    nameLabel: 'Your Name',
    namePlaceholder: 'Enter your full name',
    mobileLabel: 'Your Paytm / PhonePe Number',
    mobilePlaceholder: 'Enter 10 digit mobile number',
    codeLabel: 'Coupon Code (From back of bottle)',
    codePlaceholder: '8-DIGIT CODE',
    claimBtn: 'Claim Cashback',
    verifying: 'Verifying...',
    fillAll: 'Please fill all details',
    invalidCode: 'This code is invalid or has already been used.',
    transferFail: 'Cashback transfer failed.',
    serverError: 'Server error, please try again later.',
    successTitle: 'Cashback Sent!',
    successSub: 'Successfully transferred',
    sentTo: 'Sent To',
    refNo: 'Ref No',
    product: 'Product',
    nextCode: 'Enter Another Code',
    videoTitle: 'How to claim? (Video Guide)',
    step1Title: 'Scratch Code',
    step1: 'Scratch the code given on the back of the bottle.',
    step2Title: 'Enter Details',
    step2: 'Enter your name, mobile number and 8-digit code in the form above.',
    step3Title: 'Get Cashback',
    step3: 'Click the button and money will be sent directly to your Paytm/Bank.',
    secure: '100% Secure & Guaranteed',
    admin: 'Admin Login'
  }
};

function CustomerRedeemPage({ lang = 'hi' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['hi'];

  const [formData, setFormData] = useState({
    name: '',
    mobileOrUpi: '',
    scratchCode: ''
  });
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselImages = [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobileOrUpi || !formData.scratchCode) {
      setStatus('error');
      setMessage(t.fillAll);
      return;
    }

    setStatus('loading');
    
    // Auto-format 10 digit mobile to @paytm UPI
    let payoutId = formData.mobileOrUpi.trim();
    if (/^\d{10}$/.test(payoutId)) {
      payoutId = `${payoutId}@paytm`;
    }

    try {
      // 1. Validate Code
      const valRes = await fetch('http://localhost:5000/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formData.scratchCode.trim() })
      });
      const valData = await valRes.json();

      if (!valData.valid) {
        setStatus('error');
        setMessage(valData.message || t.invalidCode);
        return;
      }

      const coupon = valData.coupon;

      // 2. Trigger Payout
      const payRes = await fetch('http://localhost:5000/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: coupon.code,
          userId: formData.name,
          payoutId: payoutId
        })
      });
      const payData = await payRes.json();

      if (payData.success) {
        setStatus('success');
        setReceipt({
          amount: payData.payoutResponse.amount,
          payoutId: payoutId,
          refId: payData.payoutResponse.referenceId,
          productId: coupon.productId
        });
      } else {
        setStatus('error');
        setMessage(`${t.transferFail} ${payData.message || ''}`);
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(t.serverError);
    }
  };

  return (
    <div className="app-viewport">
      <div className="redeem-card-container">
        {/* Premium Apple-Style Form Card */}
      <div className="credo-card">
        
        {/* Premium Furniture Image Hero Banner Carousel */}
        <div className="credo-card-hero-image" style={{ position: 'relative' }}>
          <img 
            src={carouselImages[currentImageIndex]} 
            alt="Credofix Rewards" 
            style={{ 
              width: '100%', 
              height: 'auto', 
              display: 'block', 
              aspectRatio: '16/9', 
              objectFit: 'cover',
              transition: 'all 0.5s ease-in-out'
            }} 
          />

          {/* Navigation Arrows */}
          <button 
            onClick={(e) => { e.preventDefault(); prevImage(); }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              backdropFilter: 'blur(4px)'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <button 
            onClick={(e) => { e.preventDefault(); nextImage(); }}
            style={{
              position: 'absolute',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.4)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
              backdropFilter: 'blur(4px)'
            }}
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots Indicator */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            zIndex: 2
          }}>
            {carouselImages.map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: currentImageIndex === idx ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onClick={() => setCurrentImageIndex(idx)}
              />
            ))}
          </div>
        </div>

        {/* Input Form Body */}
        <div className="credo-card-body">
          {status === 'success' ? (
            <div className="receipt-wrapper">
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <CheckCircle2 color="#059669" size={56} style={{ margin: '0 auto' }} />
                <h2 style={{ color: '#064E3B', fontSize: '1.4rem', marginTop: '10px', fontWeight: '800' }}>
                  ₹{receipt.amount} {t.successTitle}
                </h2>
                <p style={{ color: '#065F46', fontSize: '0.9rem', fontWeight: '600' }}>{t.successSub}</p>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #A7F3D0', margin: '8px 0' }} />
              <div className="receipt-row-item">
                <span className="receipt-row-key">{t.sentTo}</span>
                <span className="receipt-row-val">{receipt.payoutId}</span>
              </div>
              <div className="receipt-row-item">
                <span className="receipt-row-key">{t.refNo}</span>
                <span className="receipt-row-val">{receipt.refId}</span>
              </div>
              <div className="receipt-row-item">
                <span className="receipt-row-key">{t.product}</span>
                <span className="receipt-row-val">Gel Glue {receipt.productId}</span>
              </div>
              <button 
                className="cf-btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setStatus('idle');
                  setFormData({ name: '', mobileOrUpi: '', scratchCode: '' });
                }}
              >
                {t.nextCode}
              </button>
            </div>
          ) : (
            <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Added Text Title Type Instruction for Input Clarification */}
              <div className="form-header-title">
                <h3>{t.formTitle}</h3>
                <p>{t.formSubtitle}</p>
              </div>

              {status === 'error' && (
                <div className="cf-alert-danger">
                  <AlertTriangle size={20} />
                  {message}
                </div>
              )}

              {/* Input 1 */}
              <div className="input-group">
                <label className="input-label">{t.nameLabel}</label>
                <input
                  type="text"
                  name="name"
                  className="custom-input"
                  placeholder={t.namePlaceholder}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Input 2 */}
              <div className="input-group">
                <label className="input-label">{t.mobileLabel}</label>
                <input
                  type="text"
                  name="mobileOrUpi"
                  className="custom-input"
                  placeholder={t.mobilePlaceholder}
                  value={formData.mobileOrUpi}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Input 3 */}
              <div className="input-group">
                <label className="input-label">{t.codeLabel}</label>
                <input
                  type="text"
                  name="scratchCode"
                  className="scratch-code-input"
                  placeholder={t.codePlaceholder}
                  value={formData.scratchCode}
                  onChange={handleChange}
                  maxLength={8}
                  required
                />
              </div>

              {/* Premium Claim Button */}
              <button 
                type="submit" 
                className="cf-btn-primary"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  t.verifying
                ) : (
                  <>
                    <IndianRupee size={22} />
                    {t.claimBtn}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* YouTube Video Guide Box (Below Form) */}
      <div className="yt-video-box">
        <div className="yt-box-header">
          <Youtube color="#DC2626" size={24} />
          <h3 className="yt-box-title">{t.videoTitle}</h3>
        </div>
        
        {/* Responsive 16:9 Embedded Player */}
        <div className="yt-iframe-container">
          <iframe 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
            title="Credofix Reward Guide" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>

        {/* Premium Timeline Instructions */}
        <div className="yt-text-instructions">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-text-wrap">
              <h5 className="step-title">{t.step1Title}</h5>
              <p className="step-text">{t.step1}</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-text-wrap">
              <h5 className="step-title">{t.step2Title}</h5>
              <p className="step-text">{t.step2}</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-text-wrap">
              <h5 className="step-title">{t.step3Title}</h5>
              <p className="step-text">{t.step3}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Trust Footer */}
      <footer className="footer-trust-badge">
        <div className="trust-shield-box">
          <ShieldCheck size={22} />
          <span>{t.secure}</span>
        </div>
        
        <div className="footer-company-info">
          <p className="footer-company-name">Dungar Chemicals (CredoFix Rewards)</p>
          <div className="footer-contact-row">
            <span style={{ display: 'flex', alignItems: 'center' }}><Mail size={14} style={{marginRight: '6px'}}/> support@credofix.in</span>
            <span className="footer-dot">•</span>
            <span style={{ display: 'flex', alignItems: 'center' }}><Phone size={14} style={{marginRight: '6px'}}/> +91 98765 43210</span>
          </div>
        </div>

        <div className="footer-policy-links">
          <a href="#">Terms & Conditions</a>
          <span className="footer-dot">•</span>
          <a href="#">Privacy Policy</a>
          <span className="footer-dot">•</span>
          <a href="#">Refund Policy</a>
        </div>

        <div className="footer-copyright">
          &copy; 2026 Credofix Rewards. All rights reserved.
          <a href="/?admin=true" className="admin-footer-link">{t.admin}</a>
        </div>
      </footer>
    </div>
    </div>
  );
}

export default CustomerRedeemPage;
