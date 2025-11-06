import React, { useState } from 'react';
import { Persona } from '@/types';

interface PersonaManagerProps {
  personas: Persona[];
  onPersonasChange: (personas: Persona[]) => void;
  disabled?: boolean;
  maxPersonas?: number;
}

export const PersonaManager: React.FC<PersonaManagerProps> = ({
  personas,
  onPersonasChange,
  disabled = false,
  maxPersonas = 6,
}) => {
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleAddPersona = () => {
    if (personas.length >= maxPersonas) return;
    
    const newPersona: Persona = {
      id: `persona_${Date.now()}`,
      name: `參與者 ${personas.length + 1}`,
      role: '參與者',
      ragFocus: ['通用'],
      temperature: 0.7,
      systemPrompt: '你是一個理性且有建設性的辯論參與者。',
    };
    
    setEditingPersona(newPersona);
    setShowEditor(true);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setShowEditor(true);
  };

  const handleDeletePersona = (personaId: string) => {
    if (disabled) return;
    onPersonasChange(personas.filter(p => p.id !== personaId));
  };

  const handleSavePersona = (persona: Persona) => {
    const isNew = !personas.find(p => p.id === persona.id);
    
    if (isNew) {
      onPersonasChange([...personas, persona]);
    } else {
      onPersonasChange(personas.map(p => p.id === persona.id ? persona : p));
    }
    
    setShowEditor(false);
    setEditingPersona(null);
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingPersona(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">參與者管理</h3>
          <p className="text-sm text-gray-600">
            {personas.length}/{maxPersonas} 個參與者
          </p>
        </div>
        
        <button
          onClick={handleAddPersona}
          disabled={disabled || personas.length >= maxPersonas}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="mr-2">➕</span>
          添加參與者
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {personas.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-lg mb-2">尚無參與者</p>
            <p className="text-sm">點擊上方按鈕添加第一個參與者</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {persona.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{persona.name}</h4>
                      <p className="text-sm text-gray-600">{persona.role}</p>
                    </div>
                  </div>
                  
                  {!disabled && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPersona(persona)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDeletePersona(persona.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        刪除
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 text-sm text-gray-600">
                  <p>專業領域: {persona.ragFocus.join(', ')}</p>
                  <p>創造性: {(persona.temperature * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEditor && editingPersona && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4">
              {personas.find(p => p.id === editingPersona.id) ? '編輯參與者' : '新增參與者'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <input
                  type="text"
                  value={editingPersona.name}
                  onChange={(e) => setEditingPersona({...editingPersona, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色
                </label>
                <input
                  type="text"
                  value={editingPersona.role}
                  onChange={(e) => setEditingPersona({...editingPersona, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  創造性 ({(editingPersona.temperature * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editingPersona.temperature}
                  onChange={(e) => setEditingPersona({...editingPersona, temperature: parseFloat(e.target.value)})}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleSavePersona(editingPersona)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {disabled && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-yellow-800 text-sm">
            <span className="mr-2">⚠️</span>
            辯論進行中，無法修改參與者設定
          </div>
        </div>
      )}
    </div>
  );
};