import { useState } from 'react';
import GroupsTab from './tabs/Groups.jsx';
import ThirdTab from './tabs/Third.jsx';
import BracketTab from './tabs/Bracket.jsx';
import FunTipsTab from './tabs/FunTips.jsx';
import KonkurrenceTab from './tabs/Konkurrence.jsx';
import ResultaterTab from './tabs/Resultater.jsx';

const TABS = [
  { id: 'groups',    label: '🏟️ Grupper' },
  { id: 'third',     label: '🥉 3\'ere' },
  { id: 'bracket',   label: '🏆 Bracket' },
  { id: 'fun',       label: '🎯 Sjove tips' },
  { id: 'ranking',   label: '📊 Stilling' },
  { id: 'results',   label: '✅ Resultater' },
];

export default function AdvancedMode(props) {
  const [tab, setTab] = useState('groups');
  const { S, FUN, SIMPLE, updateGroup, setThird, onBracketPick, updateFun, updateSimple,
      serverData, onSubmit, adminUpdate, adminVerify, adminDelete, adminClearAll, loading,
          fetchData, onReset, setS, setFUN, setSIMPLE, myName, setMyName } = props;

  return (
    <div className="mode-container">
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={'tab-btn' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <GroupsTab S={S} updateGroup={updateGroup} />
      )}
      {tab === 'third' && (
        <ThirdTab S={S} setThird={setThird} />
      )}
      {tab === 'bracket' && (
        <BracketTab S={S} onPick={onBracketPick} SIMPLE={SIMPLE} updateSimple={updateSimple} />
      )}
      {tab === 'fun' && (
        <FunTipsTab FUN={FUN} SIMPLE={SIMPLE} updateFun={updateFun} updateSimple={updateSimple} />
      )}
      {tab === 'ranking' && (
        <KonkurrenceTab
          S={S} FUN={FUN} SIMPLE={SIMPLE}
          serverData={serverData} onSubmit={onSubmit} loading={loading}
          onReset={onReset} myName={myName} setMyName={setMyName}
        />
      )}
      {tab === 'results' && (
        <ResultaterTab
          serverData={serverData}
          adminUpdate={adminUpdate}
          adminVerify={adminVerify}
          adminDelete={adminDelete}
          adminClearAll={adminClearAll}
          loading={loading}
          fetchData={fetchData}
          setS={setS} setFUN={setFUN} setSIMPLE={setSIMPLE}
        />
      )}
    </div>
  );
}
