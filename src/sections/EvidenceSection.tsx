import { useState } from 'react';
import { EVIDENCE_ITEMS } from '@/data/appData';
import { ChevronDown, ChevronUp, ExternalLink, Cpu, Layout, Shield, Terminal, Video } from 'lucide-react';

const ICONS = [Cpu, Layout, Shield, Terminal, Video];

export default function EvidenceSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="py-12 md:py-16 px-5 border-t border-gray-100">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <Shield className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-left">
              <h3 className="text-[13px] font-semibold text-it-text">Official materials used</h3>
              <p className="text-[11px] text-it-text-secondary">官方素材映射 — 点击展开</p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {isExpanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {EVIDENCE_ITEMS.map((item, idx) => {
              const Icon = ICONS[idx];
              return (
                <div key={item.title} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-[12px] font-semibold text-it-text">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-it-text-secondary leading-relaxed mb-3">{item.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 text-[9px] font-mono bg-gray-100 text-gray-500 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="md:col-span-2 lg:col-span-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-500">素材来源</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  'github.com/consenlabs/token-core-monorepo',
                  'github.com/consenlabs/token-ui',
                  'token-ui/security',
                  'Workshop: imToken 十周年培训回放',
                ].map((link) => (
                  <span key={link} className="text-[10px] font-mono text-gray-400">{link}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
