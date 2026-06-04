import { useState, useEffect } from 'react';
import { calcScore, calcSimpleScore } from '../../lib/scoring.js';

// VM 2026 kickoff: 11. juni 2026 kl. 21:00 CEST = 19:00 UTC
const REVEAL_DATE = new Date('2026-06-11T19:00:00Z');

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

function ScoreRow({ colleague, AR, rank, isOwn }) {
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
    </div>
  );
}

export default function KonkurrenceTab({ S, FUN, SIMPLE, serverData, onSubmit, loading, onReset, myName, setMyName }) {
  const [name, setName] = useState(myName || '');
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState('advanced');
  const countdown = useCountdown(REVEAL_DATE.getTime());

  const colleagues = serverData?.colleagues || [];
  const AR = serverData?.results || {};
  const revealed = serverData?.revealed ?? (Date.now() >= REVEAL_DATE.getTime());
  const registrationClosed = revealed;

  const handleSubmit = async () => {
    if (registrationClosed) { setStatus('⛔ Tilmelding er lukket. VM er startet.'); return; }
    if (!name.trim()) { setStatus('Skriv dit navn!'); return; }
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
  const sorted = hasResults && revealed
    ? [...colleagues].sort((a, b) => {
        const scoreOf = c => {
          if (!c.prediction) return 0;
          if (c.mode === 'simple') return calcSimpleScore(c.prediction, AR).pts;
          return calcScore(c.prediction?.g, c.prediction?.bracket, c.prediction?.fun, AR).pts;
        };
        return scoreOf(b) - scoreOf(a);
      })
    : colleagues;

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
            <div className="reveal-date">11. juni 2026 kl. 21:00 dansk tid</div>
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
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || registrationClosed}>
            {loading ? 'Sender…' : registrationClosed ? 'Tilmelding lukket' : 'Send ✈️'}
          </button>
          <button className="btn-ghost btn-sm" onClick={onReset}>🗑️ Nulstil</button>
        </div>
        {registrationClosed && <p className="info-txt">⛔ Tilmelding er lukket fra 11. juni 2026 kl. 21:00 dansk tid.</p>}
        {status && <p className="status-msg">{status}</p>}
      </div>

      <div className="section-card">
        <h3>🏆 {revealed ? 'Stilling' : 'Deltagere'} ({colleagues.length})</h3>

        {!revealed && (
          <p className="info-txt" style={{marginBottom:12}}>
            👤 Du kan kun se din egen forudsigelse indtil VM starter. Alle forudsigelser afsløres 11. juni kl. 21:00.
          </p>
        )}

        {!hasResults && revealed && (
          <p className="info-txt">Stillingen beregnes når resultaterne er indtastet under ✅ Resultater.</p>
        )}

        <div className="lb-list">
          {sorted.map((c, i) => {
            const isOwn = myName && c.name.toLowerCase() === myName.toLowerCase();
            if (!revealed && !isOwn) {
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
              <ScoreRow key={c.name} colleague={c} AR={revealed ? AR : {}} rank={i + 1} isOwn={!!isOwn} />
            );
          })}
          {colleagues.length === 0 && <p className="info-txt">Ingen forudsigelser endnu.</p>}
        </div>
      </div>
    </div>
  );
}
