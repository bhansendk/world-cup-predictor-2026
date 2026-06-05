import { useState, useEffect, useMemo } from 'react';
import { calcScore, calcSimpleScore } from '../../lib/scoring.js';
import { FUN_QUESTIONS, GROUPS, QF_PAIRS, R16_PAIRS, R32, SF_PAIRS } from '../../data/wc2026.js';

// Reveal: 1. juni 2026 kl. 21:00 CEST = 19:00 UTC
const REVEAL_DATE = new Date('2026-06-01T19:00:00Z');
const SIMPLE_FIELDS = [
  { key: 'top1', label: 'Mester' },
  { key: 'top2', label: 'Runner-up' },
  { key: 'top3', label: 'Nr. 3' },
  { key: 'top4', label: 'Nr. 4' },
  { key: 'topscorer', label: 'Topscorer' },
  { key: 'golden_ball', label: 'Gyldne Bold' },
  { key: 'most_yellow', label: 'Flest gule kort - hold' },
  { key: 'most_goals_team', label: 'Flest mål - hold' }
];

function isFilled(v) {
  if (typeof v === 'string') return v.trim().length > 0;
  return v !== null && v !== undefined;
}

function getSimpleMissing(simple) {
  return SIMPLE_FIELDS.filter(f => !isFilled(simple?.[f.key])).map(f => f.label);
}

function getAdvancedMissing(S, FUN) {
  const missing = [];
  const groupMissing = [];

  Object.keys(GROUPS).forEach(k => {
    const g = S?.g?.[k] || {};
    const slots = [];
    if (!isFilled(g.p1)) slots.push('1. plads');
    if (!isFilled(g.p2)) slots.push('2. plads');
    if (!isFilled(g.p3)) slots.push('3. plads');
    if (slots.length) groupMissing.push(`${GROUPS[k].name}: ${slots.join('/')}`);
  });

  if (groupMissing.length) {
    missing.push(`Grupper (${groupMissing.length}): ${groupMissing.slice(0, 4).join(', ')}${groupMissing.length > 4 ? ', ...' : ''}`);
  }

  const thirdCount = Array.isArray(S?.third) ? S.third.length : 0;
  if (thirdCount < 8) missing.push(`8 bedste 3'ere: mangler ${8 - thirdCount}`);

  const missingR32 = R32.filter(m => !isFilled(S?.r32?.[m.id])).length;
  const missingR16 = R16_PAIRS.filter((_, i) => !isFilled(S?.r16?.[`r16_${i}`])).length;
  const missingQF = QF_PAIRS.filter((_, i) => !isFilled(S?.qf?.[`qf_${i}`])).length;
  const missingSF = SF_PAIRS.filter((_, i) => !isFilled(S?.sf?.[`sf_${i}`])).length;
  const missingFinal = !isFilled(S?.final?.fin) ? 1 : 0;
  const missingBronze = !isFilled(S?.bronze?.bronze_w) ? 1 : 0;

  if (missingR32 || missingR16 || missingQF || missingSF || missingFinal || missingBronze) {
    missing.push(
      `Bracket: R32(${missingR32}), R16(${missingR16}), KF(${missingQF}), SF(${missingSF}), Finale(${missingFinal}), Bronze(${missingBronze})`
    );
  }

  const missingFun = FUN_QUESTIONS.filter(q => !isFilled(FUN?.[q.id])).map(q => q.title);
  if (missingFun.length) {
    missing.push(`Sjove tips (${missingFun.length}): ${missingFun.slice(0, 5).join(', ')}${missingFun.length > 5 ? ', ...' : ''}`);
  }

  return missing;
}

function useCountdown(target) {
  const [diff, setDiff] = useState(() => target - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(target - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return diff;
}

function formatCountdown(ms) {
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}d ${String(h).padStart(2,'0')}t ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
}

function compactList(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '-';
  }
  return value || '-';
}

function PredictionCompact({ prediction, mode }) {
  if (!prediction) return null;

  if (mode === 'simple') {
    return (
      <div className="pred-compact">
        <div className="pred-compact-title">⚡ Hurtig forudsigelse</div>
        <div className="pred-grid">
          {SIMPLE_FIELDS.map(f => (
            <div key={f.key} className="pred-item">
              <div className="pred-item-label">{f.label}</div>
              <div className="pred-item-value">{compactList(prediction?.[f.key])}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const g = prediction?.g || {};
  const bracket = prediction?.bracket || {};
  const fun = prediction?.fun || {};
  const funAnswered = FUN_QUESTIONS.filter(q => isFilled(fun[q.id])).length;
  const groupKeys = Object.keys(GROUPS);

  return (
    <div className="pred-compact">
      <div className="pred-compact-title">⭐ Fodboldinteresseret forudsigelse</div>

      <div className="pred-grid pred-grid-wide">
        <div className="pred-item">
          <div className="pred-item-label">Topplaceringer</div>
          <div className="pred-item-value">
            Mester: {compactList(bracket?.final?.fin)} | Bronze: {compactList(bracket?.bronze?.bronze_w)}
          </div>
        </div>
        <div className="pred-item">
          <div className="pred-item-label">Bedste 3'ere</div>
          <div className="pred-item-value">{compactList(prediction?.third)}</div>
        </div>
        <div className="pred-item">
          <div className="pred-item-label">Bracket-vindere</div>
          <div className="pred-item-value">
            R32 {Object.values(bracket?.r32 || {}).filter(Boolean).length}/16, R16 {Object.values(bracket?.r16 || {}).filter(Boolean).length}/8, KF {Object.values(bracket?.qf || {}).filter(Boolean).length}/4, SF {Object.values(bracket?.sf || {}).filter(Boolean).length}/2
          </div>
        </div>
        <div className="pred-item">
          <div className="pred-item-label">Sjove tips</div>
          <div className="pred-item-value">{funAnswered}/{FUN_QUESTIONS.length} besvaret</div>
        </div>
      </div>

      <div className="pred-group-grid">
        {groupKeys.map(key => {
          const group = g[key] || {};
          return (
            <div key={key} className="pred-group-card">
              <div className="pred-group-title">{key}</div>
              <div className="pred-group-line">1) {compactList(group.p1)}</div>
              <div className="pred-group-line">2) {compactList(group.p2)}</div>
              <div className="pred-group-line">3) {compactList(group.p3)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreRow({ colleague, AR, rank, isOwn, showPrediction }) {
  const [open, setOpen] = useState(false);
  const { name, mode, prediction } = colleague;
  const isSimple = mode === 'simple';

  let pts = 0, breakdown = [];
  if (AR && Object.keys(AR).length > 0 && prediction) {
    if (isSimple) {
      ({ pts, breakdown } = calcSimpleScore(prediction, AR));
    } else {
      ({ pts, breakdown } = calcScore(prediction.g, prediction.bracket, prediction.fun, AR));
    }
  }

  const medals = ['🥇','🥈','🥉'];

  return (
    <div
      className={'lb-row' + (rank <= 3 ? ' lb-top' : '') + (isOwn ? ' lb-own' : '')}
      onClick={() => setOpen(!open)}
    >
      <span className="lb-rank">{medals[rank-1] || rank}</span>
      <span className="lb-name">{name}{isOwn ? ' 👤' : ''}</span>
      <span className="lb-mode">{isSimple ? '⚡' : '⭐'}</span>
      <span className="lb-pts">{AR && Object.keys(AR).length > 0 ? pts + ' pt' : '–'}</span>
      {open && breakdown.length > 0 && (
        <div className="lb-breakdown" onClick={e => e.stopPropagation()}>
          {breakdown.map((b, i) => <div key={i} className="bd-item">{b}</div>)}
        </div>
      )}
      {open && showPrediction && prediction && (
        <div className="lb-prediction" onClick={e => e.stopPropagation()}>
          <PredictionCompact prediction={prediction} mode={mode} />
        </div>
      )}
    </div>
  );
}

export default function KonkurrenceTab({ S, FUN, SIMPLE, serverData, onSubmit, loading, onReset, myName, setMyName, adminVerify, adminLogout, isAdmin }) {
  const [name, setName] = useState(myName || '');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('advanced');
  const [adminPw, setAdminPw] = useState('');
  const [adminStatus, setAdminStatus] = useState('');
  const [leaderboardView, setLeaderboardView] = useState('all');
  const countdown = useCountdown(REVEAL_DATE.getTime());

  const colleagues = serverData?.colleagues || [];
  const AR = serverData?.results || {};
  const revealed = serverData?.revealed ?? (Date.now() >= REVEAL_DATE.getTime());
  const registrationClosed = revealed;
  const simpleMissing = getSimpleMissing(SIMPLE);
  const advancedMissing = getAdvancedMissing(S, FUN);
  const modeComplete = mode === 'simple' ? simpleMissing.length === 0 : advancedMissing.length === 0;
  const canSubmit = !registrationClosed && !loading;

  const handleAdminLogin = async () => {
    if (!adminPw.trim()) {
      setAdminStatus('❌ Indtast admin-adgangskode');
      return;
    }
    const res = await adminVerify(adminPw);
    if (res.ok) {
      setAdminStatus('✅ Admin login aktiv');
      return;
    }
    setAdminStatus('❌ ' + res.error);
  };

  const handleAdminLogout = () => {
    adminLogout();
    setAdminPw('');
    setAdminStatus('');
  };

  const handleSubmit = async () => {
    if (registrationClosed) { setStatus('⛔ Tilmelding er lukket. VM er startet.'); return; }
    if (!name.trim()) { setStatus('Skriv dit navn!'); return; }
    if (!modeComplete) {
      setStatus(mode === 'simple'
        ? `⚠️ Mangler i Hurtig mode: ${simpleMissing.join(', ')}`
        : `⚠️ Mangler i Fodboldinteresseret mode: ${advancedMissing.join(' | ')}`);
      return;
    }
    const prediction = mode === 'simple'
      ? SIMPLE
      : { g: S.g, third: S.third, bracket: { r32: S.r32, r16: S.r16, qf: S.qf, sf: S.sf, final: S.final, bronze: S.bronze }, fun: FUN };
    const res = await onSubmit(name.trim(), mode, prediction);
    if (res.ok) {
      setMyName(name.trim());
      setStatus('✅ Gemt!');
    } else {
      setStatus('❌ ' + res.error);
    }
  };

  const hasResults = AR && Object.keys(AR).length > 0;
  const sorted = hasResults && (revealed || isAdmin)
    ? [...colleagues].sort((a, b) => {
        const scoreOf = c => {
          if (!c.prediction) return 0;
          if (c.mode === 'simple') return calcSimpleScore(c.prediction, AR).pts;
          return calcScore(c.prediction?.g, c.prediction?.bracket, c.prediction?.fun, AR).pts;
        };
        return scoreOf(b) - scoreOf(a);
      })
    : colleagues;

  const filteredColleagues = useMemo(() => {
    if (leaderboardView === 'simple') return sorted.filter(c => c.mode === 'simple');
    if (leaderboardView === 'advanced') return sorted.filter(c => c.mode !== 'simple');
    return sorted;
  }, [leaderboardView, sorted]);

  const advancedCount = colleagues.filter(c => c.mode !== 'simple').length;
  const simpleCount = colleagues.filter(c => c.mode === 'simple').length;

  const countdownStr = formatCountdown(countdown);

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2>📊 Stilling &amp; Indsend</h2>
      </div>

      {/* Countdown / reveal banner */}
      {!revealed && countdownStr && (
        <div className="reveal-banner">
          <div className="reveal-icon">🔒</div>
          <div>
            <strong>Forudsigelserne afsløres når VM starter</strong>
            <div className="reveal-date">1. juni 2026 kl. 21:00 dansk tid</div>
            <div className="reveal-countdown">{countdownStr}</div>
          </div>
        </div>
      )}

      <div className="section-card">
        <h3>📤 Send din forudsigelse</h3>
        <div className="submit-row">
          <input
            type="text"
            className="name-input"
            placeholder="Dit navn"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <select value={mode} onChange={e => setMode(e.target.value)} className="mode-select">
            <option value="advanced">⭐ Fodboldinteresseret</option>
            <option value="simple">⚡ Hurtig</option>
          </select>
          <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? 'Sender…' : registrationClosed ? 'Tilmelding lukket' : 'Send ✈️'}
          </button>
          <button className="btn-ghost btn-sm" onClick={onReset}>🗑️ Nulstil</button>
        </div>
        {registrationClosed && <p className="info-txt">⛔ Tilmelding er lukket fra 1. juni 2026 kl. 21:00 dansk tid.</p>}
        {!registrationClosed && !modeComplete && (
          <p className="info-txt">
            {mode === 'simple'
              ? `Manglende felter: ${simpleMissing.join(', ')}.`
              : `Manglende felter: ${advancedMissing.join(' | ')}.`}
          </p>
        )}
        {status && <p className="status-msg">{status}</p>}
      </div>

      <div className="section-card">
        <h3>🔐 Admin-visning</h3>
        <div className="admin-auth">
          <input
            type="password"
            className="name-input"
            placeholder="Admin-adgangskode"
            value={adminPw}
            onChange={e => setAdminPw(e.target.value)}
          />
          {!isAdmin ? (
            <button className="btn-accent btn-sm" onClick={handleAdminLogin} disabled={loading}>Log ind</button>
          ) : (
            <button className="btn-ghost btn-sm" onClick={handleAdminLogout} disabled={loading}>Log ud</button>
          )}
        </div>
        {!isAdmin && <p className="info-txt">Log ind som admin for at se alles forudsigelser før reveal.</p>}
        {adminStatus && <p className="status-msg">{adminStatus}</p>}
      </div>

      <div className="section-card">
        <h3>🏆 {(revealed || isAdmin) ? 'Stilling' : 'Deltagere'} ({colleagues.length})</h3>

        <div className="lb-view-switch">
          <button
            className={`lb-view-btn ${leaderboardView === 'all' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('all')}
            type="button"
          >
            Samlet ({colleagues.length})
          </button>
          <button
            className={`lb-view-btn ${leaderboardView === 'advanced' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('advanced')}
            type="button"
          >
            ⭐ Avanceret ({advancedCount})
          </button>
          <button
            className={`lb-view-btn ${leaderboardView === 'simple' ? 'active' : ''}`}
            onClick={() => setLeaderboardView('simple')}
            type="button"
          >
            ⚡ Simpel ({simpleCount})
          </button>
        </div>

        {!revealed && !isAdmin && (
          <p className="info-txt" style={{marginBottom:12}}>
            👤 Du kan kun se din egen forudsigelse indtil reveal. Alle forudsigelser afsløres 1. juni kl. 21:00.
          </p>
        )}

        {!hasResults && revealed && (
          <p className="info-txt">Stillingen beregnes når resultaterne er indtastet under ✅ Resultater.</p>
        )}

        <div className="lb-list">
          {filteredColleagues.map((c, i) => {
            const isOwn = myName && c.name.toLowerCase() === myName.toLowerCase();
            if (!revealed && !isAdmin && !isOwn) {
              // Show name + mode + submitted, but no prediction/score
              return (
                <div key={c.name} className="lb-row lb-locked">
                  <span className="lb-rank">{i + 1}</span>
                  <span className="lb-name">{c.name}</span>
                  <span className="lb-mode">{c.mode === 'simple' ? '⚡' : '⭐'}</span>
                  <span className="lb-pts lb-locked-pts">🔒</span>
                </div>
              );
            }
            return (
              <ScoreRow
                key={c.name}
                colleague={c}
                AR={revealed || isAdmin ? AR : {}}
                rank={i + 1}
                isOwn={!!isOwn}
                showPrediction={revealed || isAdmin}
              />
            );
          })}
          {filteredColleagues.length === 0 && <p className="info-txt">Ingen forudsigelser i denne visning endnu.</p>}
        </div>
      </div>
    </div>
  );
}
