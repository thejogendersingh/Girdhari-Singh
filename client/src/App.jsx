import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import CustomerRedeemPage from './pages/CustomerRedeemPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  const [lang, setLang] = useState('hi'); // Default Hindi
  const [activeView, setActiveView] = useState('customer'); // 'customer' | 'admin'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.pathname.includes('/admin')) {
      setActiveView('admin');
    }
  }, []);

  return (
    <div className="app-shell">
      {activeView === 'customer' ? (
        <>
          <Navbar lang={lang} setLang={setLang} />
          <CustomerRedeemPage lang={lang} onOpenAdmin={() => setActiveView('admin')} />
        </>
      ) : (
        <div className="p-4 bg-slate-900 text-white min-h-screen">
          <div className="max-w-6xl mx-auto flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-2xl text-white">Credo</span>
              <span className="bg-white text-rose-900 px-2 py-0.5 rounded font-black text-xl border border-amber-600">fix</span>
              <span className="text-amber-400 font-bold text-xs uppercase ml-2">Admin System</span>
            </div>

            <button
              onClick={() => setActiveView('customer')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
            >
              ← Back to Customer Redeem Website
            </button>
          </div>

          <AdminDashboard />
        </div>
      )}
    </div>
  );
}
