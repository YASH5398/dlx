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
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Service Form Manager</h1>

      {/* Service selector */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-600">Service</label>
        <select
          className="border rounded px-2 py-1"
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          {serviceOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          className="ml-auto bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
          onClick={saveForm}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Form'}
        </button>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading form configuration…</div>
      ) : steps.length === 0 ? (
        <div className="text-gray-600">No steps found. You can start by adding fields to Step 1.</div>
      ) : null}

      {/* Steps editor */}
      <div className="space-y-6">
        {steps.map((step, si) => (
          <div key={si} className="border rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-500">Step {si + 1}</span>
              <input
                className="flex-1 border rounded px-2 py-1"
                value={step.title || ''}
                onChange={(e) => updateStepTitle(si, e.target.value)}
                placeholder={`Step ${si + 1} title`}
              />
              <div className="flex items-center gap-2">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm"
                  onClick={() => addFieldToStep(si, 'normal')}
                >
                  + Add Field
                </button>
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm"
                  onClick={() => addFieldToStep(si, 'array')}
                >
                  + Add List
                </button>
              </div>
            </div>

            {(step.fields || []).length === 0 ? (
              <div className="text-gray-500 text-sm">No fields in this step.</div>
            ) : (
              <div className="space-y-3">
                {(step.fields || []).map((f, fi) => (
                  <div key={f.name} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
                    <input
                      className="border rounded px-2 py-1 md:col-span-2"
                      value={f.label || ''}
                      onChange={(e) => updateField(si, fi, { label: e.target.value })}
                      placeholder="Label"
                    />
                    <input
                      className="border rounded px-2 py-1"
                      value={f.name || ''}
                      onChange={(e) => updateField(si, fi, { name: e.target.value })}
                      placeholder="name"
                    />
                    <select
                      className="border rounded px-2 py-1"
                      value={f.type}
                      onChange={(e) => updateField(si, fi, { type: e.target.value as FieldDef['type'] })}
                    >
                      {['text','number','email','tel','textarea','select','checkbox','radio','array'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input
                      className="border rounded px-2 py-1"
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
                          className="border rounded px-2 py-1"
                          value={(f.options || []).join(', ')}
                          onChange={(e) => updateField(si, fi, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="Options (comma separated)"
                        />
                      )}
                      {f.type === 'array' && (
                        <>
                          <select
                            className="border rounded px-2 py-1"
                            value={f.itemType || 'text'}
                            onChange={(e) => updateField(si, fi, { itemType: e.target.value as FieldDef['itemType'] })}
                          >
                            {['text','number','email','tel','textarea'].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <input
                            className="border rounded px-2 py-1"
                            value={f.itemLabel || ''}
                            onChange={(e) => updateField(si, fi, { itemLabel: e.target.value })}
                            placeholder="Item label"
                          />
                        </>
                      )}
                      <button
                        className="text-red-600 hover:text-red-700 text-sm justify-self-start"
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
      <p className="mt-6 text-xs text-gray-500">
        Changes are saved to Firebase under each service’s form config. Users see these in the request modal.
      </p>
    </div>
  );
}