import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

const CATEGORY_META = {
  branding: { title: 'Branding', hint: 'Names and labels shown across the public site and admin.' },
  raffle: { title: 'Raffle rules', hint: 'Applied to the next auto-started round and live limits.' },
  pricing: { title: 'Pricing', hint: 'Ticket price and bulk-discount tiers.' },
  general: { title: 'General', hint: 'Miscellaneous configuration.' },
};
const CATEGORY_ORDER = ['branding', 'raffle', 'pricing', 'general'];

function humanize(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function valueKind(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (value && typeof value === 'object') return 'json';
  if (typeof value === 'string' && value !== '' && !Number.isNaN(Number(value))) return 'number';
  return 'text';
}

function SettingRow({ setting, onSaved }) {
  const kind = useMemo(() => valueKind(setting.value), [setting.value]);
  const initial = kind === 'json'
    ? JSON.stringify(setting.value, null, 2)
    : String(setting.value ?? '');

  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function parseValue() {
    if (kind === 'boolean') return value === 'true';
    if (kind === 'number') return value === '' ? '' : Number(value);
    if (kind === 'json') return JSON.parse(value);
    return value;
  }

  async function save() {
    setError('');
    let parsed;
    try {
      parsed = parseValue();
    } catch {
      setError('Invalid JSON');
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/api/v1/admin/settings/${setting.key}`, { value: parsed });
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const onChange = (v) => { setValue(v); setSaved(false); setError(''); };

  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="sm:w-56 shrink-0">
          <p className="text-sm font-semibold text-slate-800">{humanize(setting.key)}</p>
          {setting.description && <p className="text-xs text-slate-400 mt-0.5">{setting.description}</p>}
        </div>
        <div className="flex-1">
          <div className="flex items-start gap-2">
            {kind === 'boolean' ? (
              <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            ) : kind === 'json' ? (
              <textarea
                className="input font-mono text-xs min-h-[120px]"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                spellCheck={false}
              />
            ) : (
              <input
                className="input"
                type={kind === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
            )}
            <Button variant={saved ? 'secondary' : 'primary'} size="md" loading={saving} onClick={save}>
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function SettingsAdmin() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/v1/admin/settings');
      setSettings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const byCat = {};
    for (const s of settings) {
      const cat = s.category || 'general';
      (byCat[cat] = byCat[cat] || []).push(s);
    }
    const cats = Object.keys(byCat).sort(
      (a, b) => (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99),
    );
    return cats.map((cat) => [cat, byCat[cat].sort((a, b) => a.key.localeCompare(b.key))]);
  }, [settings]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Live configuration — changes apply immediately and to the next auto-started round.
        </p>
      </div>

      {loading ? (
        <Spinner label="Loading settings…" />
      ) : settings.length ? (
        <div className="space-y-6">
          {grouped.map(([cat, rows]) => {
            const meta = CATEGORY_META[cat] || { title: humanize(cat), hint: '' };
            return (
              <Card key={cat}>
                <div className="mb-2">
                  <h2 className="font-semibold">{meta.title}</h2>
                  {meta.hint && <p className="text-xs text-slate-400 mt-0.5">{meta.hint}</p>}
                </div>
                {rows.map((s) => (
                  <SettingRow key={s.key || s._id} setting={s} onSaved={load} />
                ))}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="No settings found"
            description="Defaults are created automatically when the backend starts. If this persists, check the API connection."
          />
        </Card>
      )}
    </div>
  );
}
