import React, { useState, useEffect } from 'react';
import { Edit2, Check, X, Sparkles, MessageSquare } from 'lucide-react';

interface EditableTopicHeaderProps {
  topic: string;
  isGenerated?: boolean;
  onTopicChange: (newTopic: string) => void;
  className?: string;
}

export const EditableTopicHeader: React.FC<EditableTopicHeaderProps> = ({
  topic,
  isGenerated = false,
  onTopicChange,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(topic);
  const [showGeneratedBadge, setShowGeneratedBadge] = useState(isGenerated);

  useEffect(() => {
    setEditValue(topic);
    setShowGeneratedBadge(isGenerated);
  }, [topic, isGenerated]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== topic) {
      onTopicChange(editValue.trim());
      setShowGeneratedBadge(false); // 手動編輯後移除AI生成標記
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(topic);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 會議主題圖標 */}
      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-white" />
      </div>

      {/* 主題內容 */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
              placeholder="輸入會議主題..."
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="保存"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
              title="取消"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              {topic || '未設定會議主題'}
            </h1>
            
            {/* AI生成標記 */}
            {showGeneratedBadge && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>AI生成</span>
              </div>
            )}
            
            {/* 編輯按鈕 */}
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="編輯主題"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableTopicHeader;