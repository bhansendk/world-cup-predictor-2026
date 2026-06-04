import { useState } from 'react';
import { TeamSelect, FunQuestionSelect } from './FormFields.jsx';

export default function SimpleMode({ SIMPLE, onChange, onFunChange, FUN, serverData, onSubmit, loading, onReset, myName, setMyName }) {
  const [name, setName] = useState(myName || '');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { setStatus('Skriv dit navn først!'); return; }
    const prediction = { ...SIMPLE };
    const res = await onSubmit(name.trim(), 'simple', prediction);
    if (res.ok) {
      setMyName(name.trim());
      setStatus('✅ Forudsigelse gemt!');
    }
    else setStatus('❌ Fejl: ' + res.error);
  };

  const top4 = [
    { key: 'top1', label: '🥇 Mester (15 pt)' },
    { key: 'top2', label: '🥈 Runner-up (10 pt)' },
    { key: 'top3', label: '🥉 Nr. 3 (5 pt)' },
    { key: 'top4', label: '4️⃣ Nr. 4 (5 pt)' },
  ];

  const funShared = [
    { key: 'topscorer', label: '⚽ Topscorer (10 pt)' },
    { key: 'golden_ball', label: '🌟 Gyldne Bold (10 pt)' },
    { key: 'most_yellow', label: '🟨 Flest gule kort – hold (6 pt)' },
    { key: 'most_goals_team', label: '🎯 Flest mål – hold (8 pt)' },
  ];

  return (
    <div className="mode-container">
      <div className="section-card">
        <h2>⚡ Hurtig mode</h2>
        <p className="section-desc">Vælg din top 4 og 4 sjove forudsigelser.</p>
        <div className="form-grid">
          {top4.map(({ key, label }) => (
            <TeamSelect key={key} label={label} value={SIMPLE[key]} onChange={v => onChange(key, v)} />
          ))}
        </div>
      </div>

      <div className="section-card">
        <h2>🎯 Sjove tips</h2>
        <div className="form-grid">
          {funShared.map(({ key, label }) => (
            <FunQuestionSelect key={key} qid={key} value={SIMPLE[key]} onChange={v => onChange(key, v)} />
          ))}
        </div>
      </div>

      <div className="section-card">
        <h2>📤 Send din forudsigelse</h2>
        <div className="submit-row">
          <input
            type="text"
            className="name-input"
            placeholder="Dit navn"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Sender…' : 'Send forudsigelse ✈️'}
          </button>
          <button className="btn-ghost btn-sm" onClick={onReset}>🗑️ Nulstil alt</button>
        </div>
        {status && <p className="status-msg">{status}</p>}
      </div>

      {serverData?.colleagues?.length > 0 && (
        <div className="section-card">
          <h2>👥 Indsendte forudsigelser</h2>
          <div className="participants-list">
            {serverData.colleagues.map(c => (
              <div key={c.name} className="participant-chip">
                {c.name} <span className="chip-mode">{c.mode === 'simple' ? '⚡' : '⭐'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
