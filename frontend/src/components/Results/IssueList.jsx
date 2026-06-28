import { useState } from 'react';
import { useTheme } from '../../utils/theme';
import IssueCard from './IssueCard';

export default function IssueList({ analysis, loading, usedModel, onApplyFix }) {
  const { T } = useTheme();
  const [activeTab, setActiveTab] = useState('bug');

  if (loading) {
    return (
      <div className="flex-1 flex flex-col p-4 animate-pulse">
        <div style={{ height: 32, background: T.hoverBg, borderRadius: 4, marginBottom: 16 }} />
        <div style={{ height: 100, background: T.hoverBg, borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 100, background: T.hoverBg, borderRadius: 4, marginBottom: 12 }} />
      </div>
    );
  }



  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <i className="codicon codicon-checklist" style={{ fontSize: 32, color: T.textDim }} />
          <span style={{ fontSize: 13, color: T.textDim }}>Run analysis to see issues</span>
        </div>
      </div>
    );
  }

  const issues = analysis.issues || [];
  
  const categories = [
    { id: 'security', label: 'Security' },
    { id: 'bug', label: 'Bugs' },
    { id: 'performance', label: 'Perf' },
    { id: 'quality', label: 'Quality' }
  ];

  const filteredIssues = issues.filter(i => i.category === activeTab);
  
  // Counts
  const counts = categories.reduce((acc, cat) => {
    acc[cat.id] = issues.filter(i => i.category === cat.id).length;
    return acc;
  }, {});

  // Confidence Display
  let confidenceDisplay = null;
  if (usedModel === 'All Together') {
    confidenceDisplay = (
      <div className="flex items-center gap-2" style={{ fontSize: 11, color: T.textMuted }}>
        <span>4 models · high confidence</span>
        <div className="flex gap-1">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.info }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.critical }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.warning }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.success }} />
        </div>
      </div>
    );
  } else if (usedModel) {
    const isQwen = usedModel.toLowerCase().includes('qwen');
    confidenceDisplay = (
      <div className="flex items-center gap-2" style={{ fontSize: 11, color: T.textMuted }}>
        <span>{usedModel} · {isQwen ? 'offline' : 'auto'}</span>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isQwen ? T.success : T.info }} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: T.sidebar }}>
      
      {/* Header & Confidence */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: T.border }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', color: T.textMuted, textTransform: 'uppercase' }}>
          Issues Found
        </div>
        {confidenceDisplay}
      </div>

      {/* Filter Tabs */}
      <div className="flex px-2 pt-2 gap-1 border-b" style={{ borderColor: T.border, background: T.bg }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-t"
            style={{
              fontSize: 12,
              background: activeTab === cat.id ? T.sidebar : 'transparent',
              color: activeTab === cat.id ? T.text : T.textMuted,
              border: `1px solid ${activeTab === cat.id ? T.border : 'transparent'}`,
              borderBottom: 'none',
              cursor: 'pointer'
            }}
          >
            {cat.label}
            {counts[cat.id] > 0 && (
              <span style={{
                background: activeTab === cat.id ? T.accent : T.hoverBg,
                color: activeTab === cat.id ? '#fff' : T.textDim,
                padding: '0 6px',
                borderRadius: 10,
                fontSize: 10,
                marginLeft: 4
              }}>
                {counts[cat.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-8" style={{ color: T.textDim, fontSize: 13 }}>
            No issues found in this category.
          </div>
        ) : (
          filteredIssues.map((issue, idx) => (
            <IssueCard key={`${issue.line}-${idx}`} issue={issue} usedModel={usedModel} onApplyFix={onApplyFix} />
          ))
        )}
      </div>
    </div>
  );
}
