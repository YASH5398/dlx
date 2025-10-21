import React, { useEffect, useMemo, useState } from 'react';
import { subscribeServiceFormConfig, setServiceFormConfig, getServiceFormConfig, type StepDef, type FieldDef } from '../../utils/services';
import { DEFAULT_SERVICE_FORMS } from '../../utils/serviceFormDefaults';

const servicesList = Object.keys(DEFAULT_SERVICE_FORMS);

function emptyField(): FieldDef {
  return {
    name: `field_${Math.random().toString(36).slice(2, 8)}`,
    label: 'New Field',
    type: 'text',
    required: false,
    placeholder: '',
  };
}

function emptyArrayField(): FieldDef {
  return {
    name: `list_${Math.random().toString(36).slice(2, 8)}`,
    label: 'Items',
    type: 'array',
    itemType: 'text',
    itemLabel: 'Item',
    required: false,
    placeholder: '',
  };
}

export default function AdminServiceForms() {
  const [selectedService, setSelectedService] = useState<string>(servicesList[0] || 'Website Development');
  const [steps, setSteps] = useState<StepDef[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Load and subscribe to form config for selected service
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    setLoading(true);

    // Initial fetch for immediate render
    getServiceFormConfig(selectedService)
      .then((cfg) => {
        setSteps(cfg || DEFAULT_SERVICE_FORMS[selectedService] || []);
      })
      .catch(() => {
        setSteps(DEFAULT_SERVICE_FORMS[selectedService] || []);
      })
      .finally(() => setLoading(false));

    // Live subscription
    unsubscribe = subscribeServiceFormConfig(selectedService, (cfg) => {
      setSteps(cfg || DEFAULT_SERVICE_FORMS[selectedService] || []);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedService]);

  const serviceOptions = useMemo(() => servicesList, []);

  const updateStepTitle = (index: number, title: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title };
      return next;
    });
  };

  const addFieldToStep = (index: number, kind: 'normal' | 'array' = 'normal') => {
    setSteps((prev) => {
      const next = [...prev];
      const target = next[index] || { title: `Step ${index + 1}`, fields: [] };
      const newField = kind === 'array' ? emptyArrayField() : emptyField();
      next[index] = { ...target, fields: [...(target.fields || []), newField] };
      return next;
    });
  };

  const removeFieldFromStep = (stepIndex: number, fieldIndex: number) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = next[stepIndex];
      if (!target) return prev;
      const fields = [...(target.fields || [])];
      fields.splice(fieldIndex, 1);
      next[stepIndex] = { ...target, fields };
      return next;
    });
  };

  const updateField = (stepIndex: number, fieldIndex: number, patch: Partial<FieldDef>) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = next[stepIndex];
      if (!target) return prev;
      const fields = [...(target.fields || [])];
      const current = fields[fieldIndex];
      if (!current) return prev;
      fields[fieldIndex] = { ...current, ...patch };
      next[stepIndex] = { ...target, fields };
      return next;
    });
  };

  const saveForm = async () => {
    setSaving(true);
    try {
      await setServiceFormConfig(selectedService, steps);
    } catch (e) {
      console.error(e);
      alert('Failed to save form configuration. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Service Form Manager</span>
            </h1>
            <p className="text-gray-300 text-sm">Define step-wise fields for each service</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Service</label>
            <select className="px-3 py-2 rounded-xl bg-white/5 border border-white/10" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
              {serviceOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="ml-auto px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 disabled:opacity-50" onClick={saveForm} disabled={saving}>
              {saving ? 'Saving…' : 'Save Form'}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-gray-400">Loading form configuration…</div>
      ) : steps.length === 0 ? (
        <div className="text-gray-400">No steps found. You can start by adding fields to Step 1.</div>
      ) : null}

      {/* Steps editor */}
      <div className="space-y-6">
        {steps.map((step, si) => (
          <div key={si} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-400">Step {si + 1}</span>
              <input
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-400"
                value={step.title || ''}
                onChange={(e) => updateStepTitle(si, e.target.value)}
                placeholder={`Step ${si + 1} title`}
              />
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm hover:bg-white/15"
                  onClick={() => addFieldToStep(si, 'normal')}
                >
                  + Add Field
                </button>
                <button
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm hover:bg-white/15"
                  onClick={() => addFieldToStep(si, 'array')}
                >
                  + Add List
                </button>
              </div>
            </div>

            {(step.fields || []).length === 0 ? (
              <div className="text-gray-400 text-sm">No fields in this step.</div>
            ) : (
              <div className="space-y-3">
                {(step.fields || []).map((f, fi) => (
                  <div key={f.name} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
                    <input
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 md:col-span-2"
                      value={f.label || ''}
                      onChange={(e) => updateField(si, fi, { label: e.target.value })}
                      placeholder="Label"
                    />
                    <input
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                      value={f.name || ''}
                      onChange={(e) => updateField(si, fi, { name: e.target.value })}
                      placeholder="name"
                    />
                    <select
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                      value={f.type}
                      onChange={(e) => updateField(si, fi, { type: e.target.value as FieldDef['type'] })}
                    >
                      {['text','number','email','tel','textarea','select','checkbox','radio','array'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                      value={f.placeholder || ''}
                      onChange={(e) => updateField(si, fi, { placeholder: e.target.value })}
                      placeholder="Placeholder"
                    />
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!f.required}
                        onChange={(e) => updateField(si, fi, { required: e.target.checked })}
                      />
                      Required
                    </label>
                    <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-2">
                      {(f.type === 'select' || f.type === 'checkbox' || f.type === 'radio') && (
                        <input
                          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                          value={(f.options || []).join(', ')}
                          onChange={(e) => updateField(si, fi, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="Options (comma separated)"
                        />
                      )}
                      {f.type === 'array' && (
                        <>
                          <select
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                            value={f.itemType || 'text'}
                            onChange={(e) => updateField(si, fi, { itemType: e.target.value as FieldDef['itemType'] })}
                          >
                            {['text','number','email','tel','textarea'].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <input
                            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                            value={f.itemLabel || ''}
                            onChange={(e) => updateField(si, fi, { itemLabel: e.target.value })}
                            placeholder="Item label"
                          />
                        </>
                      )}
                      <button
                        className="text-red-400 hover:text-red-300 text-sm justify-self-start"
                        onClick={() => removeFieldFromStep(si, fi)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Helper: explain persistence */}
      <p className="mt-2 text-xs text-gray-400">
        Changes are saved to Firebase under each service’s form config. Users see these in the request modal.
      </p>
    </div>
  );
}