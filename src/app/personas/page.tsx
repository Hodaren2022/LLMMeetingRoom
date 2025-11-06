'use client';

import React, { useState } from 'react';
import { useMeetingRoomStore } from '@/stores/meetingRoomStore';
import { PersonaCard, PersonaEditor } from '@/components';
import { Persona } from '@/types';
import { Plus, Users } from 'lucide-react';

export default function PersonasPage() {
  const {
    availablePersonas,
    addPersona,
    updatePersona,
    deletePersona,
    togglePersonaActive,
  } = useMeetingRoomStore();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>();

  const activeCount = availablePersonas.filter(p => p.isActive).length;

  const handleCreatePersona = () => {
    setEditingPersona(undefined);
    setIsEditorOpen(true);
  };

  const handleEditPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setIsEditorOpen(true);
  };

  const handleDeletePersona = (persona: Persona) => {
    if (window.confirm(`確定要刪除替身「${persona.name}」嗎？`)) {
      deletePersona(persona.id);
    }
  };

  const handleTogglePersona = (persona: Persona) => {
    togglePersonaActive(persona.id);
  };

  const handleSavePersona = (personaData: Omit<Persona, 'id'>) => {
    if (editingPersona) {
      updatePersona(editingPersona.id, personaData);
    } else {
      addPersona(personaData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  替身管理
                </h2>
                <p className="text-sm text-gray-600">
                  共 {availablePersonas.length} 個替身，{activeCount} 個已選中
                </p>
              </div>
            </div>

            <button
              onClick={handleCreatePersona}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              創建替身
            </button>
          </div>

          {availablePersonas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                還沒有替身
              </h3>
              <p className="text-gray-600 mb-4">
                創建您的第一個虛擬替身，開始構建辯論團隊
              </p>
              <button
                onClick={handleCreatePersona}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                創建替身
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  isSelected={persona.isActive}
                  onToggle={() => handleTogglePersona(persona)}
                  onEdit={() => handleEditPersona(persona)}
                  onDelete={() => handleDeletePersona(persona)}
                  showControls={true}
                />
              ))}
            </div>
          )}

          <PersonaEditor
            persona={editingPersona}
            isOpen={isEditorOpen}
            onClose={() => {
              setIsEditorOpen(false);
              setEditingPersona(undefined);
            }}
            onSave={handleSavePersona}
          />
        </div>
      </div>
    </div>
  );
}