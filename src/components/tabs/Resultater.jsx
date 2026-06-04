import { useState } from 'react';
import { ALL_TEAMS, GROUPS, FUN_QUESTIONS, QF_PAIRS, R16_PAIRS, R32, SF_PAIRS } from '../../data/wc2026.js';
import { FlagSpan, TeamSelect } from '../FormFields.jsx';

const ROUND_LABELS = {
  r32: 'R32',
  r16: 'R16',
  qf: 'Kvartfinale',
  sf: 'Semifinale',
  final: 'Finale',
  bronze: 'Bronzekamp'
};

function emptyResults() {
  return {
    g: {},
    third: [],
    r32: {},
    r16: {},
    qf: {},
    sf: {},
    final: {},
    bronze: {},
    fun: {}
  };
}

function AdminPanel({ adminUpdate, adminVerify, adminDelete, adminClearAll, loading, colleagues, serverData }) {
  const [pw, setPw] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [status, setStatus] = useState('');
  const [resultState, setResultState] = useState(() => ({ ...emptyResults(), ...(serverData?.results || {}) }));

  const handleLogin = async () => {
    if (!pw.trim()) {
      setStatus('❌ Indtast adgangskode først');
      return;
    }
    const res = await adminVerify(pw);
    if (res.ok) {
      setIsAuthed(true);
      setStatus('✅ Logget ind som admin');
      return;
    }
    setIsAuthed(false);
    setStatus('❌ ' + res.error);
  };

  const logout = () => {
    setIsAuthed(false);
    setStatus('');
  };

  const handleSaveResults = async () => {
    if (!isAuthed) {
      setStatus('❌ Log ind først');
      return;
    }
    const res = await adminUpdate(resultState, pw);
    if (res.ok) setStatus('✅ Resultater gemt!');
    else setStatus('❌ ' + res.error);
  };

  const handleDeleteAll = async () => {
    if (!isAuthed) {
      setStatus('❌ Log ind først');
      return;
    }
    if (!confirm('Slet alle deltagere?')) return;
    const res = await adminClearAll(pw);
    if (res.ok) setStatus('✅ Alle slettet');
    else setStatus('❌ ' + res.error);
  };

  const handleDeleteOne = async (name) => {
    if (!isAuthed) {
      setStatus('❌ Log ind først');
      return;
    }
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

  const toggleThirdGroup = (groupKey) => {
    setResultState(prev => {
      const current = Array.isArray(prev.third) ? prev.third : [];
      const exists = current.includes(groupKey);
      if (exists) return { ...prev, third: current.filter(x => x !== groupKey) };
      if (current.length >= 8) return prev;
      return { ...prev, third: [...current, groupKey] };
    });
  };

  const setKnockoutWinner = (round, id, team) => {
    setResultState(prev => ({
      ...prev,
      [round]: {
        ...(prev[round] || {}),
        [id]: team
      }
    }));
  };

  const third = Array.isArray(resultState.third) ? resultState.third : [];

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
        {!isAuthed ? (
          <button className="btn-accent" onClick={handleLogin} disabled={loading}>🔐 Log ind</button>
        ) : (
          <button className="btn-ghost" onClick={logout} disabled={loading}>🔓 Log ud</button>
        )}
        {status && <span className="status-msg">{status}</span>}
      </div>

      {!isAuthed && (
        <div className="info-card" style={{ marginBottom: 16 }}>
          <p>Log ind som admin for at redigere resultater, bracket og deltagere.</p>
        </div>
      )}

      {isAuthed && (
        <>

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
        <h3>🥉 8 bedste 3'ere ({third.length}/8)</h3>
        <div className="third-grid">
          {Object.entries(GROUPS).map(([key, g]) => {
            const p3 = (resultState.g?.[key] || {}).p3;
            const isSel = third.includes(key);
            const isBlocked = !isSel && third.length >= 8;
            return (
              <div
                key={key}
                className={'third-item' + (isSel ? ' sel' : '') + (isBlocked ? ' blocked' : '')}
                onClick={() => !isBlocked && toggleThirdGroup(key)}
              >
                {p3 ? <FlagSpan team={p3} /> : null}
                <strong>{g.name}</strong>
                <br />
                <small style={{ color: p3 ? '#94a3b8' : '#475569' }}>
                  {p3 ? `3'er: ${p3}` : "3'er ikke sat"}
                </small>
                {isSel && <span className="t-badge">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-card">
        <h3>🏆 Knockout-resultater</h3>

        <h4 style={{ marginBottom: 10, color: '#94a3b8' }}>{ROUND_LABELS.r32}</h4>
        <div className="form-grid">
          {R32.map((m, i) => (
            <TeamSelect
              key={m.id}
              label={`Kamp ${i + 1}`}
              value={(resultState.r32 || {})[m.id] || null}
              onChange={(v) => setKnockoutWinner('r32', m.id, v)}
              placeholder="- Vælg vinder -"
            />
          ))}
        </div>

        <h4 style={{ margin: '18px 0 10px', color: '#94a3b8' }}>{ROUND_LABELS.r16}</h4>
        <div className="form-grid">
          {R16_PAIRS.map((_, i) => {
            const id = `r16_${i}`;
            return (
              <TeamSelect
                key={id}
                label={`Kamp ${i + 1}`}
                value={(resultState.r16 || {})[id] || null}
                onChange={(v) => setKnockoutWinner('r16', id, v)}
                placeholder="- Vælg vinder -"
              />
            );
          })}
        </div>

        <h4 style={{ margin: '18px 0 10px', color: '#94a3b8' }}>{ROUND_LABELS.qf}</h4>
        <div className="form-grid">
          {QF_PAIRS.map((_, i) => {
            const id = `qf_${i}`;
            return (
              <TeamSelect
                key={id}
                label={`Kamp ${i + 1}`}
                value={(resultState.qf || {})[id] || null}
                onChange={(v) => setKnockoutWinner('qf', id, v)}
                placeholder="- Vælg vinder -"
              />
            );
          })}
        </div>

        <h4 style={{ margin: '18px 0 10px', color: '#94a3b8' }}>{ROUND_LABELS.sf}</h4>
        <div className="form-grid">
          {SF_PAIRS.map((_, i) => {
            const id = `sf_${i}`;
            return (
              <TeamSelect
                key={id}
                label={`Kamp ${i + 1}`}
                value={(resultState.sf || {})[id] || null}
                onChange={(v) => setKnockoutWinner('sf', id, v)}
                placeholder="- Vælg vinder -"
              />
            );
          })}
        </div>

        <h4 style={{ margin: '18px 0 10px', color: '#94a3b8' }}>{ROUND_LABELS.final}</h4>
        <div className="form-grid">
          <TeamSelect
            label="VM-vinder"
            value={(resultState.final || {}).fin || null}
            onChange={(v) => setKnockoutWinner('final', 'fin', v)}
            placeholder="- Vælg mester -"
          />
        </div>

        <h4 style={{ margin: '18px 0 10px', color: '#94a3b8' }}>{ROUND_LABELS.bronze}</h4>
        <div className="form-grid">
          <TeamSelect
            label="Vinder af bronzekamp"
            value={(resultState.bronze || {}).bronze_w || null}
            onChange={(v) => setKnockoutWinner('bronze', 'bronze_w', v)}
            placeholder="- Vælg bronzevinder -"
          />
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
      </>
      )}
    </div>
  );
}

export default function ResultaterTab({ serverData, adminUpdate, adminVerify, adminDelete, adminClearAll, loading }) {
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
          adminVerify={adminVerify}
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
