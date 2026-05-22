import { Shield, ExternalLink, Mail } from 'lucide-react';

export default function FooterSection() {
  return (
    <footer className="py-12 px-5 border-t border-gray-100 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-it-blue to-puffer-cyan flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-semibold text-it-text">Puffer SafeSign</span>
            </div>
            <p className="text-[11px] text-it-text-secondary leading-relaxed">
              基于 Token Core 的签名前安全层。质押前，先看懂你要签什么。
            </p>
            <div className="mt-2 flex gap-2">
              <span className="px-1.5 py-0.5 text-[9px] font-mono text-it-blue bg-blue-50 rounded">TESTNET</span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono text-gray-500 bg-gray-100 rounded">Sepolia</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">官方链接</h3>
            <div className="space-y-1.5">
              {[
                { label: 'imToken 十周年活动页', href: 'https://10th.token.im/' },
                { label: 'Token Core', href: 'https://github.com/consenlabs/token-core-monorepo' },
                { label: 'Token UI', href: 'https://github.com/consenlabs/token-ui' },
                { label: 'Puffer Finance', href: 'https://puffer.fi/' },
              ].map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-it-text-secondary hover:text-it-blue transition-colors">
                  <ExternalLink className="w-3 h-3" /> {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Submission */}
          <div>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">提交信息</h3>
            <div className="space-y-1 text-[11px] text-it-text-secondary">
              <p>作品: Before You Sign: Puffer SafeSign</p>
              <p>赛道: Puffer 专项 + 安全设计 + 链上场景</p>
              <p>截止: 2026-05-22 23:59</p>
              <a href="https://eylyq7xd.jsjform.com/f/rzEwlD" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-it-blue hover:underline mt-1">
                <Mail className="w-3 h-3" /> 提交表单
              </a>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-gray-400">
            imToken 十周年 AI 共创 — 基于 Token Core 的钱包签名前安全层
          </p>
          <p className="text-[10px] text-gray-400 font-mono">
            @consenlabs/tcx-wasm | TESTNET ONLY
          </p>
        </div>
      </div>
    </footer>
  );
}
