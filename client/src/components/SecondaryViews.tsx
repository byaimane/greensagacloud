import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Crown,
  Gift,
  Mail,
  MessageSquare,
  ScrollText,
  Send,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import { apiRequest, formatNum } from '../api';
import { useI18n } from '../i18n';
import type { BattleReportState, ChatMessage, PlayerState } from '../types';

// ---------------------------------------------------------------------------
// BATTLE REPORTS VIEW
// ---------------------------------------------------------------------------
export const ReportsView: React.FC<{
  state: PlayerState;
  onStateChange: (s: PlayerState) => void;
}> = ({ state, onStateChange }) => {
  const { t } = useI18n();
  const [selected, setSelected] = useState<BattleReportState | null>(state.reports[0] || null);

  useEffect(() => {
    if (state.reports.some((r) => !r.isRead)) {
      apiRequest<{ state: PlayerState }>('/api/reports/read-all', { method: 'POST' })
        .then((d) => onStateChange(d.state))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 panel-stone rounded-2xl p-4 space-y-2.5">
          <h1 className="font-royal text-xl font-bold text-amber-200 flex items-center gap-2 mb-3">
            <Mail className="w-5 h-5 text-amber-400" />
            {t('reportsTitle')}
          </h1>
          {state.reports.length === 0 ? (
            <div className="text-xs text-slate-400 p-6 text-center">
              No battle reports yet. Fight a Campaign stage or march on the World Map!
            </div>
          ) : (
            state.reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left rounded-xl p-3 border transition cursor-pointer ${
                  selected?.id === r.id
                    ? 'bg-amber-950/40 border-amber-400'
                    : 'bg-slate-950/75 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      r.victory ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}
                  >
                    {r.battle_type}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs font-semibold text-amber-100 mt-1">{r.title}</div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-7 panel-stone panel-gold-border rounded-2xl p-5">
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div>
                  <h2 className="font-royal text-lg font-bold text-amber-200">{selected.title}</h2>
                  <div className="text-xs text-slate-400">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selected.victory
                      ? 'bg-emerald-950 border border-emerald-400 text-emerald-300'
                      : 'bg-rose-950 border border-rose-500 text-rose-300'
                  }`}
                >
                  {selected.victory ? 'VICTORY' : 'DEFEAT'}
                </span>
              </div>

              {selected.summary?.loot && (
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
                  <div className="text-[11px] uppercase font-bold text-amber-300 mb-2">Spoils & Resources</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {Object.entries(selected.summary.loot).map(([k, v]: any) =>
                      v > 0 ? (
                        <span key={k} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700">
                          {k.toUpperCase()}: +{formatNum(v)}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {selected.replay && selected.replay.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" /> Round-by-Round Battle Log
                  </div>
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs font-mono max-h-72 overflow-y-auto">
                    {selected.replay.map((r) => (
                      <div key={r.round} className={r.heroSkillTriggered ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                        {r.log}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-16">Select a report to inspect battle details.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ROYAL QUESTS VIEW
// ---------------------------------------------------------------------------
export const QuestsView: React.FC<{
  state: PlayerState;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}> = ({ state, onStateChange, onToast }) => {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const claimQuest = async (questKey: string) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/quests/claim', {
        method: 'POST',
        body: JSON.stringify({ questKey }),
      });
      onStateChange(data.state);
      onToast('Quest rewards claimed!', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="panel-stone panel-gold-border rounded-2xl p-5">
          <h1 className="font-royal text-2xl font-bold text-amber-200 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-400" />
            {t('questsTitle')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t('questsSub')}</p>
        </div>

        <div className="space-y-3">
          {state.quests.map((q) => (
            <div
              key={q.key}
              className={`panel-stone rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                q.completed && !q.claimed ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.18)]' : ''
              } ${q.claimed ? 'opacity-60' : ''}`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-royal font-bold text-sm text-amber-100">{q.title}</h3>
                  {q.claimed && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Claimed
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">{q.description}</p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-40 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-emerald-400"
                      style={{ width: `${Math.min(100, (q.current / q.target) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-amber-300">
                    {Math.min(q.current, q.target)} / {q.target}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-1">
                  <span>🌾 +{formatNum(q.reward.food)}</span>
                  <span>🌲 +{formatNum(q.reward.wood)}</span>
                  <span>⛏️ +{formatNum(q.reward.iron)}</span>
                  <span>💰 +{formatNum(q.reward.gold)}</span>
                  <span className="text-cyan-300 font-semibold">💎 +{q.reward.gems}</span>
                </div>
              </div>

              <button
                disabled={busy || !q.completed || q.claimed}
                onClick={() => claimQuest(q.key)}
                className="btn-royal px-5 py-2.5 rounded-xl font-royal font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                {q.claimed ? 'Claimed' : q.completed ? 'Claim Reward' : 'In Progress'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// GLOBAL LEADERBOARDS VIEW
// ---------------------------------------------------------------------------
export const LeaderboardView: React.FC<{ currentUserId: number }> = ({ currentUserId }) => {
  const { t } = useI18n();
  const [lords, setLords] = useState<any[]>([]);
  const [alliances, setAlliances] = useState<any[]>([]);
  const [tab, setTab] = useState<'lords' | 'alliances'>('lords');

  useEffect(() => {
    apiRequest<{ lords: any[]; alliances: any[] }>('/api/leaderboard')
      .then((d) => {
        setLords(d.lords);
        setAlliances(d.alliances);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="panel-stone panel-gold-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-royal text-2xl font-bold text-amber-200 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              {t('ranksTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t('ranksSub')}</p>
          </div>
          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-amber-500/25">
            <button
              onClick={() => setTab('lords')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                tab === 'lords' ? 'bg-amber-600 text-amber-50' : 'text-slate-400'
              }`}
            >
              {t('topLords')}
            </button>
            <button
              onClick={() => setTab('alliances')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                tab === 'alliances' ? 'bg-amber-600 text-amber-50' : 'text-slate-400'
              }`}
            >
              {t('topAlliances')}
            </button>
          </div>
        </div>

        <div className="panel-stone rounded-2xl overflow-hidden">
          {tab === 'lords' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-amber-300/80 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Lord</th>
                  <th className="py-3 px-4">Keep</th>
                  <th className="py-3 px-4">Kills</th>
                  <th className="py-3 px-4 text-right">Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {lords.map((l, idx) => (
                  <tr
                    key={l.id}
                    className={l.id === currentUserId ? 'bg-amber-500/10 text-amber-100' : 'hover:bg-slate-900/50'}
                  >
                    <td className="py-3 px-4 font-bold text-amber-300">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-4 font-semibold flex items-center gap-2">
                      <span className="text-base">{l.avatar}</span>
                      {l.alliance_tag && <span className="text-amber-400">[{l.alliance_tag}]</span>}
                      <span>{l.username}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">Lv.{l.castle_level}</td>
                    <td className="py-3 px-4 text-rose-300">{formatNum(l.kills)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-300">⚡ {formatNum(l.power)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-amber-300/80 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Alliance</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4 text-right">Total Power</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {alliances.map((a, idx) => (
                  <tr key={a.id} className="hover:bg-slate-900/50">
                    <td className="py-3 px-4 font-bold text-amber-300">#{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-amber-100 flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-amber-400" /> [{a.tag}] {a.name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{a.member_count}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-300">⚡ {formatNum(a.total_power)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// REALTIME LIVE CHAT DRAWER
// ---------------------------------------------------------------------------
export const ChatDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  hasAlliance: boolean;
  onSend: (channel: 'kingdom' | 'alliance', message: string) => void;
}> = ({ open, onClose, messages, hasAlliance, onSend }) => {
  const { t } = useI18n();
  const [channel, setChannel] = useState<'kingdom' | 'alliance'>('kingdom');
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const visible = messages.filter((m) => m.channel === channel);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visible.length, open]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(channel, input.trim());
    setInput('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 w-80 sm:w-96 h-96 panel-stone panel-gold-border rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      <div className="px-3.5 py-2.5 bg-slate-950/95 border-b border-amber-500/25 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <div className="flex gap-1">
            <button
              onClick={() => setChannel('kingdom')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                channel === 'kingdom' ? 'bg-amber-600 text-amber-50' : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              {t('kingdomChat')}
            </button>
            <button
              disabled={!hasAlliance}
              onClick={() => setChannel('alliance')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer disabled:opacity-40 ${
                channel === 'alliance' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-amber-200'
              }`}
            >
              {t('allianceChat')}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-amber-200 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {visible.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No messages in {channel} chat yet.</div>
        ) : (
          visible.map((m) => (
            <div key={m.id} className="bg-slate-950/65 rounded-xl px-2.5 py-1.5 border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-amber-300">
                  {m.alliance_tag ? `[${m.alliance_tag}] ` : ''}
                  {m.username}
                </span>
                <span className="text-slate-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-slate-200 mt-0.5 break-words">{m.message}</div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="p-2.5 bg-slate-950/90 border-t border-amber-500/20 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chatPlaceholder')}
          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-amber-50 focus:outline-none focus:border-amber-400"
        />
        <button type="submit" className="btn-royal px-3 rounded-xl cursor-pointer">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
