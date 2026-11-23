import React, { useEffect, useState } from 'react';
import { Crown, Handshake, LogOut, PlusCircle, Shield, Users } from 'lucide-react';
import { apiRequest, formatNum } from '../api';
import { useI18n } from '../i18n';
import type { PlayerState } from '../types';

interface Props {
  state: PlayerState;
  onStateChange: (s: PlayerState) => void;
  onToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AllianceView: React.FC<Props> = ({ state, onStateChange, onToast }) => {
  const { t } = useI18n();
  const [alliances, setAlliances] = useState<any[]>([]);
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAlliances = async () => {
    try {
      const data = await apiRequest<{ alliances: any[] }>('/api/alliances');
      setAlliances(data.alliances);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!state.alliance) loadAlliances();
  }, [state.alliance]);

  const createAlliance = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/alliances/create', {
        method: 'POST',
        body: JSON.stringify({ tag, name, description }),
      });
      onStateChange(data.state);
      onToast(`Alliance [${tag.toUpperCase()}] founded!`, 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const joinAlliance = async (allianceId: number) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/alliances/join', {
        method: 'POST',
        body: JSON.stringify({ allianceId }),
      });
      onStateChange(data.state);
      onToast('Joined Alliance! You can now request build help & chat.', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const leaveAlliance = async () => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>('/api/alliances/leave', { method: 'POST' });
      onStateChange(data.state);
      onToast('Left Alliance.', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendHelp = async (helpId: number) => {
    setBusy(true);
    try {
      const data = await apiRequest<{ state: PlayerState }>(`/api/alliances/help/${helpId}`, { method: 'POST' });
      onStateChange(data.state);
      onToast('Helped ally! Earned +25 Gold.', 'success');
    } catch (err: any) {
      onToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (state.alliance) {
    const a = state.alliance;
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Alliance Banner */}
          <div className="panel-stone panel-gold-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600/40 to-slate-950 border-2 border-amber-400 flex items-center justify-center font-royal text-xl font-extrabold text-amber-200">
                {a.tag}
              </div>
              <div>
                <h1 className="font-royal text-2xl font-bold text-amber-200">
                  [{a.tag}] {a.name}
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">{a.description}</p>
                <div className="flex gap-4 text-xs text-amber-400 mt-2 font-semibold">
                  <span>⚡ Total Power: {formatNum(a.totalPower)}</span>
                  <span>👥 Members: {a.members.length}</span>
                  <span>🛡️ Your Role: {a.role}</span>
                </div>
              </div>
            </div>
            <button
              disabled={busy}
              onClick={leaveAlliance}
              className="btn-steel px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer self-start"
            >
              <LogOut className="w-3.5 h-3.5" /> Leave Alliance
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Alliance Help Queue */}
            <div className="lg:col-span-5 panel-stone rounded-2xl p-4 space-y-3">
              <h2 className="font-royal text-base font-bold text-amber-200 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-emerald-400" />
                Alliance Construction Help ({a.helps.length})
              </h2>
              <p className="text-xs text-slate-400">
                Assist clanmates upgrading their castles to shave build timers and earn +25 Gold per help.
              </p>
              {a.helps.length === 0 ? (
                <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-5 text-center text-xs text-slate-400">
                  No open help requests right now. Start a building upgrade and click "Request Alliance Help"!
                </div>
              ) : (
                <div className="space-y-2">
                  {a.helps.map((h) => {
                    const alreadyHelped = h.helpers.includes(state.user.id) || h.requester_id === state.user.id;
                    return (
                      <div
                        key={h.id}
                        className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-amber-100">{h.requester_name}</div>
                          <div className="text-[11px] text-slate-400">
                            {h.building_name} • {h.helpers.length}/{h.max_helps} helps
                          </div>
                        </div>
                        <button
                          disabled={busy || alreadyHelped}
                          onClick={() => sendHelp(h.id)}
                          className="btn-royal px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          {h.requester_id === state.user.id ? 'Yours' : alreadyHelped ? 'Helped' : 'Help (+25💰)'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Member Roster */}
            <div className="lg:col-span-7 panel-stone rounded-2xl p-4 space-y-3">
              <h2 className="font-royal text-base font-bold text-amber-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Clan Roster
              </h2>
              <div className="space-y-2">
                {a.members.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl bg-slate-950/75 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.avatar}</span>
                      <div>
                        <div className="font-bold text-amber-100 flex items-center gap-1.5">
                          {m.username}
                          {m.role === 'Leader' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {m.role} • Citadel ({m.castle_x}, {m.castle_y})
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-amber-300">⚡ {formatNum(m.power)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Existing Alliances */}
        <div className="lg:col-span-7 panel-stone panel-gold-border rounded-2xl p-5 space-y-4">
          <div>
            <h1 className="font-royal text-2xl font-bold text-amber-200 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              {t('alliancesTitle')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{t('alliancesSub')}</p>
          </div>

          <div className="space-y-3">
            {alliances.map((a) => (
              <div
                key={a.id}
                className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-center font-royal font-bold text-amber-200 text-sm">
                    {a.tag}
                  </div>
                  <div>
                    <div className="font-royal font-bold text-amber-100 text-sm">
                      [{a.tag}] {a.name}
                    </div>
                    <div className="text-xs text-slate-400">{a.description}</div>
                    <div className="text-[11px] text-amber-400/90 mt-1">
                      Leader: {a.leader_name} • {a.member_count} Members • ⚡ {formatNum(a.total_power)}
                    </div>
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() => joinAlliance(a.id)}
                  className="btn-royal px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Alliance */}
        <div className="lg:col-span-5 panel-stone rounded-2xl p-5">
          <h2 className="font-royal text-lg font-bold text-amber-200 flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            Found a New Alliance
          </h2>
          <form onSubmit={createAlliance} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-amber-200/80 uppercase font-semibold mb-1">Banner Tag (2–4 Letters)</label>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="e.g. KNG"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-amber-100 uppercase"
              />
            </div>
            <div>
              <label className="block text-amber-200/80 uppercase font-semibold mb-1">Alliance Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={28}
                placeholder="e.g. Knights of the Dragon"
                required
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-amber-100"
              />
            </div>
            <div>
              <label className="block text-amber-200/80 uppercase font-semibold mb-1">Motto / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Rally together to claim the Dragon Throne!"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-amber-100"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="btn-royal w-full py-3 rounded-xl font-royal font-bold text-sm cursor-pointer"
            >
              Establish Alliance
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
