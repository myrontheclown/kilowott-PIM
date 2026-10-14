'use client';

import React, { useState } from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { AttributeDefinition, CategoryRule, ProductCategory } from '@/types/product';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export default function AttributesPage() {
  const { categoryRules, updateCategoryRules, products } = useCatalog();

  const [selectedCategory, setSelectedCategory] = useState<string>('clothing');
  const [showAddModal, setShowAddModal] = useState(false);

  // New attribute form state
  const [attrKey, setAttrKey] = useState('');
  const [attrLabel, setAttrLabel] = useState('');
  const [attrType, setAttrType] = useState<'text' | 'number' | 'select'>('text');
  const [attrOptions, setAttrOptions] = useState('');
  const [attrRequired, setAttrRequired] = useState(false);
  const [attrUnit, setAttrUnit] = useState('');
  const [attrDescription, setAttrDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeRule = categoryRules.find((r) => r.category === selectedCategory);
  const categoryProducts = products.filter((p) => p.category === selectedCategory);
  const fullyCompliant = categoryProducts.filter((p) => p.completenessScore === 100).length;

  const handleAddAttribute = () => {
    setErrorMsg(null);
    if (!attrKey.trim() || !attrLabel.trim()) {
      setErrorMsg('Key and Label are required fields.');
      return;
    }

    const cleanKey = attrKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    // Check duplicate key in category
    if (activeRule?.attributes.some((a) => a.key === cleanKey)) {
      setErrorMsg(`An attribute with key '${cleanKey}' already exists in this category.`);
      return;
    }

    const newAttr: AttributeDefinition = {
      key: cleanKey,
      label: attrLabel.trim(),
      type: attrType,
      options:
        attrType === 'select'
          ? attrOptions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      required: attrRequired,
      unit: attrUnit.trim() || undefined,
      description: attrDescription.trim() || undefined,
    };

    const updatedRules = categoryRules.map((r) => {
      if (r.category !== selectedCategory) return r;
      return {
        ...r,
        attributes: [...r.attributes, newAttr],
      };
    });

    updateCategoryRules(updatedRules);

    // Reset modal form
    setAttrKey('');
    setAttrLabel('');
    setAttrType('text');
    setAttrOptions('');
    setAttrRequired(false);
    setAttrUnit('');
    setAttrDescription('');
    setShowAddModal(false);
  };

  const handleRemoveAttribute = (keyToRemove: string) => {
    const updatedRules = categoryRules.map((r) => {
      if (r.category !== selectedCategory) return r;
      return {
        ...r,
        attributes: r.attributes.filter((a) => a.key !== keyToRemove),
      };
    });
    updateCategoryRules(updatedRules);
  };

  const handleToggleRequired = (keyToToggle: string) => {
    const updatedRules = categoryRules.map((r) => {
      if (r.category !== selectedCategory) return r;
      return {
        ...r,
        attributes: r.attributes.map((a) =>
          a.key === keyToToggle ? { ...a, required: !a.required } : a
        ),
      };
    });
    updateCategoryRules(updatedRules);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Category Attribute Schemas</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Dynamic PIM
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure flexible attribute specifications and completeness validation criteria per product category
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Attribute to Category</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {categoryRules.map((rule) => {
          const isSelected = rule.category === selectedCategory;
          const count = products.filter((p) => p.category === rule.category).length;

          return (
            <button
              key={rule.category}
              type="button"
              onClick={() => setSelectedCategory(rule.category)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{rule.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Category Overview Bar */}
      {activeRule && (
        <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {activeRule.label} Schema
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{activeRule.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="font-semibold text-slate-900">
                {activeRule.attributes.filter((a) => a.required).length} Required /{' '}
                {activeRule.attributes.length} Total
              </span>
              <p className="text-[11px] text-slate-500">Validation Fields</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <span className="font-semibold text-emerald-700">
                {fullyCompliant} / {categoryProducts.length}
              </span>
              <p className="text-[11px] text-slate-500">100% Compliant Products</p>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Definitions Table */}
      {activeRule && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Configured Attribute Specifications
            </h3>
            <span className="text-xs text-slate-500">
              Changes instantly update catalog completeness scores
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Field Label</th>
                  <th className="py-3 px-4">Attribute Key</th>
                  <th className="py-3 px-4">Input Type</th>
                  <th className="py-3 px-4">Requirement</th>
                  <th className="py-3 px-4">Unit / Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRule.attributes.map((attr) => (
                  <tr
                    key={attr.key}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {attr.label}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {attr.key}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {attr.type}
                        {attr.options ? ` (${attr.options.length} opts)` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleRequired(attr.key)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          attr.required
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle required status"
                      >
                        {attr.required ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>Required</span>
                          </>
                        ) : (
                          <span>Optional</span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {attr.unit && (
                        <span className="font-mono text-indigo-600 mr-2">
                          [{attr.unit}]
                        </span>
                      )}
                      <span>{attr.description || '—'}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttribute(attr.key)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Attribute Definition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Attribute Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Add Attribute Definition
                </h3>
                <p className="text-xs text-slate-500">
                  Category: {activeRule?.label}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attribute Label (Display Name) *
                </label>
                <input
                  type="text"
                  value={attrLabel}
                  onChange={(e) => {
                    setAttrLabel(e.target.value);
                    if (!attrKey) {
                      setAttrKey(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Battery Capacity"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attribute Key (Identifier) *
                </label>
                <input
                  type="text"
                  value={attrKey}
                  onChange={(e) => setAttrKey(e.target.value)}
                  placeholder="e.g. battery-capacity"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Input Type
                  </label>
                  <select
                    value={attrType}
                    onChange={(e) => setAttrType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="select">Dropdown Select</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit (Optional)
                  </label>
                  <input
                    type="text"
                    value={attrUnit}
                    onChange={(e) => setAttrUnit(e.target.value)}
                    placeholder="e.g. mAh, cm, kg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {attrType === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={attrOptions}
                    onChange={(e) => setAttrOptions(e.target.value)}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Helper Note
                </label>
                <input
                  type="text"
                  value={attrDescription}
                  onChange={(e) => setAttrDescription(e.target.value)}
                  placeholder="Guidance for product data managers"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="req_checkbox"
                  checked={attrRequired}
                  onChange={(e) => setAttrRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label
                  htmlFor="req_checkbox"
                  className="text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  Mark as required attribute (affects completeness score)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                Save Attribute Definition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
