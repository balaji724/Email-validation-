import React from 'react';
import {
  FileText,
  ShieldCheck,
  Server,
  HelpCircle,
  Download,
  Terminal,
  AlertTriangle,
  Lock,
  Layers,
} from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Documentation & Validation Standards
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Technical specifications of the EmailCheck Pro verification pipeline, DNS evaluation logic,
          and deliverability classification protocols.
        </p>
      </div>

      {/* 1. Status Classifications */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Status Classifications</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
            <span className="font-bold text-emerald-800 text-sm">VALID</span>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Email syntax strictly satisfies RFC 5322 rules, the domain exists in authoritative DNS,
              active Mail Exchanger (MX) records were located, and the domain is not in temporary burner lists.
            </p>
          </div>
          <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-lg">
            <span className="font-bold text-rose-800 text-sm">INVALID</span>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Email contains syntax errors (e.g., missing @, consecutive dots, invalid TLD), or the domain does not exist
              (NXDOMAIN), or authoritative DNS reports no mail routing records.
            </p>
          </div>
          <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg">
            <span className="font-bold text-amber-800 text-sm">RISKY</span>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Syntax and domain are technically active, but high bounce signals exist: known temporary/disposable domain (e.g. Mailinator),
              or a role-based mailbox (admin@, sales@, support@) with multiple recipients.
            </p>
          </div>
          <div className="p-3.5 bg-slate-100/70 border border-slate-300/80 rounded-lg">
            <span className="font-bold text-slate-800 text-sm">UNKNOWN</span>
            <p className="text-slate-600 mt-1 leading-relaxed">
              DNS query timed out or resolver returned temporary SERVFAIL errors. Deliverability cannot be reliably asserted or refuted
              without risking premature list deletion.
            </p>
          </div>
        </div>
      </div>

      {/* 2. DNS & MX Capabilities vs Limits */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-600" />
          <span>What DNS & MX Lookups Prove (and Cannot Prove)</span>
        </h2>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>What MX Lookups Prove:</strong> Authoritative Mail Exchanger (MX) lookups prove whether a domain is configured
            to receive inbound SMTP mail and identifies the specific cluster (e.g. Google Workspace, Microsoft 365, Mimecast).
            If no MX records are published, RFC 5321 specifies that SMTP clients fall back to address records (A/AAAA).
          </p>
          <p>
            <strong>What DNS Checks Cannot Prove:</strong> DNS records do not reveal whether an individual mailbox is full,
            disabled by an administrator, or set to reject specific senders.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg">
            <strong className="block mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Why We Ban Aggressive SMTP Recipient Probing:</span>
            </strong>
            Many legacy validation tools send fake SMTP commands (`RCPT TO:`) to recipient mail exchangers.
            Modern mail providers (Google, Microsoft, Cloudflare, Proofpoint) employ greylisting, tarpitting,
            and honeypot traps. Aggressive probing triggers IP blacklisting and catch-all falsehoods (where servers accept all addresses during handshakes but bounce them later).
            EmailCheck Pro relies on authoritative non-intrusive DNS protocols, avoiding spam network traps.
          </div>
        </div>
      </div>

      {/* 3. Scoring System */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Deliverability Quality Score (0 - 100)</span>
        </h2>
        <p className="text-xs text-slate-500">
          The quality score reflects architectural deliverability confidence based on verified signals, not an arbitrary probability guess:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2 font-medium">Condition</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Classification</th>
                <th className="px-3 py-2 font-medium">Impact Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-3 py-2 font-mono">Syntax Malformed</td>
                <td className="px-3 py-2 font-mono tabular-nums text-rose-600 font-bold">0</td>
                <td className="px-3 py-2"><span className="text-rose-700 font-semibold">INVALID</span></td>
                <td className="px-3 py-2 text-slate-500">Address violates RFC grammar, cannot be routed.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">Domain Non-Existent (NXDOMAIN)</td>
                <td className="px-3 py-2 font-mono tabular-nums text-rose-600 font-bold">5</td>
                <td className="px-3 py-2"><span className="text-rose-700 font-semibold">INVALID</span></td>
                <td className="px-3 py-2 text-slate-500">Domain is unassigned or expired. Immediate hard bounce.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">No MX / Mail Records</td>
                <td className="px-3 py-2 font-mono tabular-nums text-rose-600 font-bold">10</td>
                <td className="px-3 py-2"><span className="text-rose-700 font-semibold">INVALID</span></td>
                <td className="px-3 py-2 text-slate-500">Domain has web presence but does not receive email.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">Disposable Burner Domain</td>
                <td className="px-3 py-2 font-mono tabular-nums text-amber-600 font-bold">25</td>
                <td className="px-3 py-2"><span className="text-amber-700 font-semibold">RISKY</span></td>
                <td className="px-3 py-2 text-slate-500">Recipient uses 10-minute temporary mailbox. High churn.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">DNS Lookup Timeout</td>
                <td className="px-3 py-2 font-mono tabular-nums text-slate-600 font-bold">50</td>
                <td className="px-3 py-2"><span className="text-slate-700 font-semibold">UNKNOWN</span></td>
                <td className="px-3 py-2 text-slate-500">Resolver timed out. Inconclusive check.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">Role-Based Team Mailbox</td>
                <td className="px-3 py-2 font-mono tabular-nums text-amber-600 font-bold">70</td>
                <td className="px-3 py-2"><span className="text-amber-700 font-semibold">RISKY</span></td>
                <td className="px-3 py-2 text-slate-500">info@, sales@, support@. Lower individual engagement.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">Verified Consumer Webmail (Gmail)</td>
                <td className="px-3 py-2 font-mono tabular-nums text-emerald-600 font-bold">90</td>
                <td className="px-3 py-2"><span className="text-emerald-700 font-semibold">VALID</span></td>
                <td className="px-3 py-2 text-slate-500">Public webmail provider with verified MX cluster.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono">Verified Corporate Domain (MX)</td>
                <td className="px-3 py-2 font-mono tabular-nums text-emerald-600 font-bold">98</td>
                <td className="px-3 py-2"><span className="text-emerald-700 font-semibold">VALID</span></td>
                <td className="px-3 py-2 text-slate-500">Active corporate mail exchanger with high reputation.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Security & Privacy Safeguards */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-600" />
          <span>Security & Formula Injection Safeguards</span>
        </h2>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>Spreadsheet Formula Injection Defense:</strong> When CSV or Excel spreadsheets are downloaded, malicious lead submissions
            starting with characters such as <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">= + - @</code> are safely neutralized
            with prepended apostrophes (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">'</code>), eliminating Dynamic Data Exchange (DDE) and formula execution risks in Microsoft Excel and LibreOffice.
          </p>
          <p>
            <strong>Data Privacy:</strong> Customer lead lists are never stored permanently, never rented, and never indexed for advertising.
            Automated retention lifecycle policies permanently delete batch files according to user settings.
          </p>
        </div>
      </div>
    </div>
  );
};
