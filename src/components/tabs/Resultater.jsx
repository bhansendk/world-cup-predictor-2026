import { useState } from 'react';
import { GROUPS, FUN_QUESTIONS } from '../../data/wc2026.js';
import { FlagSpan } from '../FormFields.jsx';

function AdminPanel({ adminUpdate, adminDelete, adminClearAll, loading, colleagues, serverData }) {
  const [pw, setPw] = useState('');
  const [status, setStatus] = useState('');
  const [resultState, setResultState] = useState(() => serverData?.results || {});

  const handleSaveResults = async () => {
    const res = await adminUpdate(resultState, pw);
    if (res.ok) setStatus('✅ Resultater gemt!');
    else setStatus('❌ ' + res.error);
  };

  const handleDeleteAll = async () => {
    if (!confirm('Slet alle deltagere?')) return;
    const res = await adminClearAll(pw);
    if (res.ok) setStatus('✅ Alle slettet');
    else setStatus('❌ ' + res.error);
  };

  const handleDeleteOne = async (name) => {
    const res = await adminDelete(name, pw);
    if (res.ok) setStatus(`✅ ${name} slettet`);
    else setStatus('❌ ' + res.error);
  };

  const setGroupResult = (gKey, field, team) => {
    setResultState(prev => {
      const g = { ...(prev.g || {}), [gKey]: { ...(prev.g?.[gKey] || {}) } };
      const gs = g[gKey];
      // toggle
      if (gs[field] === team) { gs[field] = ''; }
      else {
        // remove team from other slots
        if (gs.p1 === team) gs.p1 = '';
        if (gs.p2 === team) gs.p2 = '';
        if (gs.p3 === team) gs.p3 = '';
        gs[field] = team;
      }
      return { ...prev, g };
    });
  };

  const setFunResult = (id, val) => {
    setResultState(prev => ({ ...prev, fun: { ...(prev.fun || {}), [id]: val } }));
  };

  return (
    <div>
      <div className="admin-auth">
        <input
          type="password"
          placeholder="Admin-adgangskode"
          value={pw}
          onChange={e => setPw(e.target.value)}
          className="name-input"
        />
        {status && <span className="status-msg">{status}</span>}
      </div>

      <div className="section-card">
        <h3>👥 Deltagere</h3>
        <div className="participants-list">
          {colleagues.map(c => (
            <div key={c.name} className="participant-chip">
              {c.name} <span className="chip-mode">{c.mode === 'simple' ? '⚡' : '⭐'}</span>
              <button className="btn-danger-sm" onClick={() => handleDeleteOne(c.name)}>✕</button>
            </div>
          ))}
        </div>
        <button className="btn-danger btn-sm" onClick={handleDeleteAll}>🗑️ Slet alle</button>
      </div>

      <div className="section-card">
        <h3>🏟️ Grupperesultater</h3>
        <div className="groups-grid">
          {Object.entries(GROUPS).map(([key, g]) => {
            const gs = (resultState.g || {})[key] || {};
            const ranks = [gs.p1, gs.p2, gs.p3];
            const filled = ranks.filter(Boolean).length;
            return (
              <div key={key} className="group-card">
                <div className="group-title">{g.name}</div>
                <div className="group-progress">{filled}/3</div>
                <div className="team-list">
                  {g.teams.map((team) => {
                    const rank = ranks.indexOf(team);
                    let cls = 'team-item';
                    let badge = '';
                    if (rank === 0) { cls += ' s1'; badge = ' 🥇'; }
                    else if (rank === 1) { cls += ' s2'; badge = ' 🥈'; }
                    else if (rank === 2) { cls += ' s3'; badge = ' 🥉'; }
                    else if (filled >= 3) cls += ' dimmed';
                    const clickRank = rank >= 0
                      ? () => setGroupResult(key, ['p1','p2','p3'][rank], '')
                      : () => {
                          const slot = !gs.p1 ? 'p1' : !gs.p2 ? 'p2' : !gs.p3 ? 'p3' : null;
                          if (slot) setGroupResult(key, slot, team);
                        };
                    return (
                      <div key={team} className={cls} onClick={clickRank}>
                        <FlagSpan team={team} />{team}{badge}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-card">
        <h3>🎯 Sjove tips resultater</h3>
        <div className="fun-grid">
          {FUN_QUESTIONS.map(q => (
            <div key={q.id} className="fun-card">
              <div className="fun-card-header">
                <span className="fun-title">{q.title}</span>
              </div>
              <div className="select-wrap">
                <select
                  value={(resultState.fun || {})[q.id] || ''}
                  onChange={e => setFunResult(q.id, e.target.value || null)}
                >
                  <option value="">– Vælg facit –</option>
                  {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="submit-row">
        <button className="btn-primary" onClick={handleSaveResults} disabled={loading}>
          {loading ? 'Gemmer…' : '💾 Gem alle resultater'}
        </button>
      </div>
    </div>
  );
}

export default function ResultaterTab({ serverData, adminUpdate, adminDelete, adminClearAll, loading }) {
  const [adminOpen, setAdminOpen] = useState(false);
  const colleagues = serverData?.colleagues || [];

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>✅ Resultater (Admin)</h2>
        <p>Kun arrangøren skal udfylde dette panel.</p>
        <button className="btn-accent" onClick={() => setAdminOpen(!adminOpen)}>
          {adminOpen ? '🔒 Luk admin' : '🔓 Åbn admin-panel'}
        </button>
      </div>
      {adminOpen && (
        <AdminPanel
          adminUpdate={adminUpdate}
          adminDelete={adminDelete}
          adminClearAll={adminClearAll}
          loading={loading}
          colleagues={colleagues}
          serverData={serverData}
        />
      )}
      {!adminOpen && (
        <div className="info-card">
          <p>Klik "Åbn admin-panel" og indtast adgangskoden for at registrere resultater og administrere deltagere.</p>
        </div>
      )}
    </div>
  );
}
