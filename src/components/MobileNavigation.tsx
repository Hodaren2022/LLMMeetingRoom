import React, { useState, useEffect } from 'react';
import { Menu, X, Settings, Users, MessageSquare, BarChart3 } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ 
  isOpen, 
  onClose, 
  children 
}) => {
  // 防止背景滾動
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC鍵關閉
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* 抽屜內容 */}
      <div 
        className={`drawer-content ${!isOpen ? 'closed' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* 抽屜標題欄 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="drawer-title" className="text-lg font-semibold text-gray-900">
            功能選單
          </h2>
          <button
            onClick={onClose}
            className="btn-touch p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉選單"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 抽屜內容區域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
};

interface NavigationItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  isActive?: boolean;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  icon,
  label,
  onClick,
  badge,
  isActive = false
}) => {
  return (
    <button
      onClick={onClick}
      className={`btn-touch w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
        isActive 
          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
};

interface MobileNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  participantCount?: number;
  statementCount?: number;
  onSettingsClick?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentTab,
  onTabChange,
  participantCount = 0,
  statementCount = 0,
  onSettingsClick
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navigationItems = [
    {
      id: 'selection',
      icon: <Users className="w-5 h-5" />,
      label: '人格選擇',
      badge: participantCount
    },
    {
      id: 'debate',
      icon: <MessageSquare className="w-5 h-5" />,
      label: '辯論過程',
      badge: statementCount
    },
    {
      id: 'consensus',
      icon: <BarChart3 className="w-5 h-5" />,
      label: '共識分析'
    },
    {
      id: 'participants',
      icon: <Users className="w-5 h-5" />,
      label: '參與者管理'
    }
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* 移動端漢堡選單按鈕 */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="btn-touch fixed top-4 left-4 z-50 p-3 bg-white rounded-lg shadow-lg border border-gray-200 tablet:hidden"
        aria-label="開啟導航選單"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* 側滑抽屜 */}
      <MobileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
      >
        <div className="space-y-2">
          {/* 主要導航項目 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3 px-3">
              主要功能
            </h3>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <NavigationItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  onClick={() => handleTabChange(item.id)}
                  badge={item.badge}
                  isActive={currentTab === item.id}
                />
              ))}
            </div>
          </div>

          {/* 設置和其他功能 */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 px-3">
              其他功能
            </h3>
            <div className="space-y-1">
              {onSettingsClick && (
                <NavigationItem
                  icon={<Settings className="w-5 h-5" />}
                  label="設置"
                  onClick={() => {
                    onSettingsClick();
                    setIsDrawerOpen(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* 應用信息 */}
          <div className="border-t border-gray-200 pt-4 mt-8">
            <div className="px-3 py-2 text-xs text-gray-500">
              <p className="font-medium">AI 辯論平台</p>
              <p>版本 1.0.0</p>
            </div>
          </div>
        </div>
      </MobileDrawer>
    </>
  );
};

export default MobileNavigation;