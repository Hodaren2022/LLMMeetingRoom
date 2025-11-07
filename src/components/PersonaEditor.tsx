import React, { useState, useEffect } from 'react';
import { Persona } from '@/types';
import { X, Save, Plus, Minus, Palette } from 'lucide-react';
import { validatePersona } from '@/utils';

interface PersonaEditorProps {
  persona?: Persona;
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Omit<Persona, 'id'>) => void;
}

const PRESET_COLORS = [
  '#1f2937', '#dc2626', '#059669', '#7c3aed',
  '#ea580c', '#0891b2', '#be123c', '#166534',
  '#7c2d12', '#581c87', '#92400e', '#1e40af',
];

export const PersonaEditor: React.FC<PersonaEditorProps> = ({
  persona,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    identity: '',
    primeDirective: '',
    toneStyle: '',
    defaultBias: '',
    ragFocus: [''],
    temperature: 0.7,
    systemPrompt: '',
    color: '#6b7280',
    avatar: '',
    isActive: false,
  });

  const [errors, setErrors] = useState<string[]>([]);

  // 初始化表單數據
  const initializeFormData = React.useCallback(() => {
    if (persona) {
      return {
        name: persona.name,
        role: persona.role,
        identity: persona.identity || '',
        primeDirective: persona.primeDirective || '',
        toneStyle: persona.toneStyle || '',
        defaultBias: persona.defaultBias || '',
        ragFocus: [...persona.ragFocus],
        temperature: persona.temperature,
        systemPrompt: persona.systemPrompt,
        color: persona.color || '#6b7280',
        avatar: persona.avatar || '',
        isActive: persona.isActive || false,
      };
    } else {
      return {
        name: '',
        role: '',
        identity: '',
        primeDirective: '',
        toneStyle: '',
        defaultBias: '',
        ragFocus: [''],
        temperature: 0.7,
        systemPrompt: '',
        color: '#6b7280',
        avatar: '',
        isActive: false,
      };
    }
  }, [persona]);

  // 當對話框打開時重置表單
  useEffect(() => {
    if (isOpen) {
      const newFormData = initializeFormData();
      // 使用 setTimeout 避免同步 setState
      setTimeout(() => {
        setFormData(newFormData);
        setErrors([]);
      }, 0);
    }
  }, [isOpen, initializeFormData]);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRagFocusChange = (index: number, value: string) => {
    const newRagFocus = [...formData.ragFocus];
    newRagFocus[index] = value;
    setFormData(prev => ({
      ...prev,
      ragFocus: newRagFocus,
    }));
  };

  const addRagFocus = () => {
    setFormData(prev => ({
      ...prev,
      ragFocus: [...prev.ragFocus, ''],
    }));
  };

  const removeRagFocus = (index: number) => {
    if (formData.ragFocus.length > 1) {
      const newRagFocus = formData.ragFocus.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        ragFocus: newRagFocus,
      }));
    }
  };

  const handleSave = () => {
    // 過濾空的 ragFocus
    const cleanedFormData = {
      ...formData,
      ragFocus: formData.ragFocus.filter(focus => focus.trim().length > 0),
    };

    const validationErrors = validatePersona(cleanedFormData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSave(cleanedFormData as Persona);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {persona ? '編輯替身' : '創建新替身'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* 錯誤訊息 */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">請修正以下錯誤：</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                替身名稱 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如：CEO、技術專家"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                頭像 URL
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* 身份描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              身份描述 *
            </label>
            <textarea
              value={formData.identity}
              onChange={(e) => handleInputChange('identity', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="描述這個替身的職位、背景和專業技能"
            />
          </div>

          {/* 核心原則 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              核心原則 *
            </label>
            <textarea
              value={formData.primeDirective}
              onChange={(e) => handleInputChange('primeDirective', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="這個替身的最高目標和不可動搖的信仰"
            />
          </div>

          {/* 辯論風格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              辯論風格 *
            </label>
            <textarea
              value={formData.toneStyle}
              onChange={(e) => handleInputChange('toneStyle', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="描述這個替身的語氣、用詞習慣和引用偏好"
            />
          </div>

          {/* 預設傾向 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              預設傾向
            </label>
            <textarea
              value={formData.defaultBias}
              onChange={(e) => handleInputChange('defaultBias', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="當資訊不足時的預設態度和偏好"
            />
          </div>

          {/* 搜尋重點 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              專業領域 *
            </label>
            <div className="space-y-2">
              {formData.ragFocus.map((focus, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={focus}
                    onChange={(e) => handleRagFocusChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如：財務分析、技術趨勢"
                  />
                  {formData.ragFocus.length > 1 && (
                    <button
                      onClick={() => removeRagFocus(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRagFocus}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加專業領域
              </button>
            </div>
          </div>

          {/* 溫度設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              創造性參數: {formData.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>保守 (0.1)</span>
              <span>平衡 (0.5)</span>
              <span>創新 (1.0)</span>
            </div>
          </div>

          {/* 顏色選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主題顏色
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleInputChange('color', color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Palette className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};