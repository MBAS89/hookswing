import { useState, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  accentColor?: string; // e.g. "sky" | "purple" | "amber" | "emerald"
  placeholder?: string;
}

const accentMap: Record<string, { bar: string; borderFocus: string }> = {
  sky:     { bar: 'bg-sky-500/30',     borderFocus: 'ring-sky-500/30' },
  purple:  { bar: 'bg-purple-500/30',  borderFocus: 'ring-purple-500/30' },
  amber:   { bar: 'bg-amber-500/30',   borderFocus: 'ring-amber-500/30' },
  emerald: { bar: 'bg-emerald-500/30', borderFocus: 'ring-emerald-500/30' },
};

export default function JsonEditor({ value, onChange, rows = 12, accentColor = 'sky', placeholder }: JsonEditorProps) {
  const [focused, setFocused] = useState(false);
  const accent = accentMap[accentColor] || accentMap.sky;

  const highlight = useCallback((code: string) => {
    return Prism.highlight(code, Prism.languages.json, 'json');
  }, []);

  return (
    <div
      className={`json-editor-wrap relative rounded-xl overflow-hidden border-2 border-slate-800 transition-all ${focused ? `ring-2 ${accent.borderFocus} border-slate-700` : ''}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent.bar} z-10 pointer-events-none`} />

      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={16}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        textareaClassName="focus:outline-none"
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: '1.6',
          minHeight: rows * 22,
          backgroundColor: '#020617',
        }}
      />
    </div>
  );
}
