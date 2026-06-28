import { useState } from 'react';

import { FileCode, FileJson, FileType2, Coffee, Settings, Boxes, Gem } from 'lucide-react';

function getIcon(name) {
  const ext = name.split('.').pop();
  switch(ext) {
    case 'py': return <FileCode size={14} />;
    case 'js': return <FileJson size={14} />;
    case 'ts': return <FileType2 size={14} />;
    case 'java': return <Coffee size={14} />;
    case 'cpp': return <Settings size={14} />;
    case 'go': return <Boxes size={14} />;
    case 'rb': return <Gem size={14} />;
    default: return <FileCode size={14} />;
  }
}

const ROUTING_MODES = ['Auto', 'Parallel', 'Manual', 'Offline'];

function ModelDot({ name, status }) {
  const colors = {
    online: '#22c55e',
    calling: '#f59e0b',
    error: '#ef4444',
    idle: 'var(--text-muted)',
  };
  const animate = status === 'online' || status === 'calling';
  const speed = status === 'calling' ? '0.6s' : '2s';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors[status] || colors.idle,
        display: 'inline-block', flexShrink: 0,
        animation: animate ? `pulse-dot ${speed} ease-in-out infinite` : 'none',
      }} />
      <span>{name}</span>
      <span style={{
        marginLeft: 'auto', fontSize: 11,
        color: status === 'online' ? 'var(--success)' : status === 'error' ? 'var(--error)' : 'var(--text-muted)',
      }}>
        {status === 'online' ? 'online' : status === 'calling' ? 'calling…' : status === 'error' ? 'error' : status === 'idle' ? 'idle' : 'local'}
      </span>
    </div>
  );
}

export default function SidebarNew({
  files, activeFile, onFileSelect,
  onNewFile,
  routingMode, onRoutingModeChange,
  modelStatuses,
}) {
  const [newFileInput, setNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleNewFile = () => {
    if (newFileName.trim()) {
      onNewFile?.(newFileName.trim());
      setNewFileInput(false);
      setNewFileName('');
    }
  };

  return (
    <div style={{
      width: 220, height: '100%', borderRight: '1px solid var(--border)',
      background: 'var(--surface)', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* FILES Section */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          color: 'var(--text-muted)', padding: '16px 16px 8px',
          textTransform: 'uppercase',
        }}>
          Files
        </div>

        <div style={{
          fontSize: 12, color: 'var(--text-muted)', padding: '4px 16px 4px 16px',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 10 }}>▾</span> workspace
        </div>

        {files.map(f => (
          <div
            key={f.name}
            onClick={() => onFileSelect(f.name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 16px 6px 28px', fontSize: 13,
              cursor: 'pointer',
              background: activeFile === f.name ? 'var(--surface-high)' : 'transparent',
              borderLeft: activeFile === f.name ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeFile === f.name ? 'var(--text)' : 'var(--text-secondary)',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => {
              if (activeFile !== f.name) e.currentTarget.style.background = 'var(--surface-high)';
            }}
            onMouseLeave={e => {
              if (activeFile !== f.name) e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>{getIcon(f.name)}</span>
            <span>{f.name}</span>
          </div>
        ))}

        {/* New file */}
        {newFileInput ? (
          <div style={{ padding: '4px 16px 4px 28px' }}>
            <input
              autoFocus
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleNewFile(); if (e.key === 'Escape') setNewFileInput(false); }}
              onBlur={() => setNewFileInput(false)}
              placeholder="filename.py"
              style={{
                width: '100%', fontSize: 12, padding: '4px 8px',
                background: 'var(--surface-high)', border: '1px solid var(--border)',
                borderRadius: 4, color: 'var(--text)', outline: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>
        ) : (
          <div
            onClick={() => setNewFileInput(true)}
            style={{
              margin: '8px 16px 8px 28px', padding: '6px 12px',
              border: '1px dashed var(--border)', borderRadius: 6,
              fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
              textAlign: 'center', transition: 'all 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            + New File
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />

      {/* AI ENGINE Section */}
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          color: 'var(--text-muted)', marginBottom: 10,
          textTransform: 'uppercase',
        }}>
          AI Engine
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Routing:</div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 14,
        }}>
          {ROUTING_MODES.map(mode => (
            <button
              key={mode}
              onClick={() => onRoutingModeChange(mode.toLowerCase())}
              style={{
                padding: '5px 0', fontSize: 11, fontWeight: 500,
                borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                background: routingMode === mode.toLowerCase() ? 'var(--accent)' : 'var(--surface-high)',
                color: routingMode === mode.toLowerCase() ? '#fff' : 'var(--text-muted)',
                transition: 'all 150ms ease',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Model statuses */}
        <ModelDot name="OpenRouter" status={modelStatuses.openrouter} />
        <ModelDot name="Groq Llama" status={modelStatuses.llama} />
        <ModelDot name="Mixtral" status={modelStatuses.mixtral} />
        <ModelDot name="Qwen2.5" status={modelStatuses.qwen} />
      </div>
    </div>
  );
}
