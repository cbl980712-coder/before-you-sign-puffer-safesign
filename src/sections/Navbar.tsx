import { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: '演示', href: '#demo' },
  { label: '确认单', href: '#receipt' },
  { label: 'Token Core', href: '#tokencore' },
  { label: '安全闸门', href: '#broadcastgate' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-it-blue to-puffer-cyan flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-it-text">Puffer SafeSign</span>
          <span className="px-1.5 py-0.5 text-[10px] font-medium text-it-blue bg-blue-50 rounded">TESTNET</span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.href} onClick={() => handleNav(item.href)}
              className="px-3 py-1.5 text-[13px] text-it-text-secondary hover:text-it-text rounded-lg hover:bg-gray-50 transition-all">
              {item.label}
            </button>
          ))}
          <button onClick={() => handleNav('#demo')}
            className="ml-2 px-4 py-1.5 text-[13px] font-semibold bg-it-blue text-white rounded-xl hover:bg-it-blue/90 transition-all shadow-sm">
            开始演示
          </button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden w-8 h-8 flex items-center justify-center">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-5 py-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.href} onClick={() => handleNav(item.href)}
              className="block w-full text-left px-4 py-2.5 text-[13px] text-it-text-secondary hover:text-it-text rounded-lg hover:bg-gray-50">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
