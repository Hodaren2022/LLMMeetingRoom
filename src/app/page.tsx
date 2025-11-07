'use client';

import { useMeetingRoomStore } from '@/stores/enhancedMeetingRoomStore';
import { DebateRoom } from '@/components';
import { Users, MessageSquare, Settings, Plus } from 'lucide-react';

export default function Home() {
  const { rooms, createRoom, selectRoom, currentRoom } = useMeetingRoomStore();

  const handleCreateRoom = () => {
    const roomName = prompt('請輸入會議室名稱：');
    
    if (roomName && roomName.trim()) {
      // 不再要求輸入議題，將在第一個發言後自動生成
      const roomId = createRoom(roomName.trim());
      selectRoom(roomId);
    }
  };

  // 如果有選中的房間，顯示辯論界面
  if (currentRoom) {
    return (
      <DebateRoom 
        room={currentRoom}
        onRoomUpdate={(updatedRoom) => {
          // 使用 store 的 updateRoom 方法更新房間
          useMeetingRoomStore.getState().updateRoom(updatedRoom.id, updatedRoom);
        }}
        onDebateComplete={(result) => {
          console.log('辯論完成:', result);
        }}
      />
    );
  }

  return (
    <div className="layout-grid-simple min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 content-constrained">
      <header className="grid-area-header">
        <div className="content-area text-center">
          <h1 className="fluid-heading-1 font-bold text-gray-900 fluid-space-md prevent-overflow">
            虛擬會議室
          </h1>
          <p className="fluid-body text-gray-600 max-w-2xl mx-auto prevent-overflow">
            AI 驅動的智能辯論平台，讓不同角色的虛擬替身針對議題進行深度討論並達成共識
          </p>
        </div>
      </header>

      <main className="grid-area-main">
        <div className="content-area">
          {/* Quick Stats */}
          <div className="card-grid-responsive">
            <div className="bg-white rounded-lg shadow-md fluid-padding-lg text-center prevent-overflow">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h3 className="fluid-heading-3 font-semibold text-gray-900">6 個預設替身</h3>
              <p className="fluid-small text-gray-600 prevent-overflow">CEO、CTO、CFO 等專業角色</p>
            </div>
            <div className="bg-white rounded-lg shadow-md fluid-padding-lg text-center prevent-overflow">
              <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <h3 className="fluid-heading-3 font-semibold text-gray-900">智能辯論</h3>
              <p className="fluid-small text-gray-600 prevent-overflow">基於 Chain of Thought 推理</p>
            </div>
            <div className="bg-white rounded-lg shadow-md fluid-padding-lg text-center prevent-overflow">
              <Settings className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <h3 className="fluid-heading-3 font-semibold text-gray-900">即時搜尋</h3>
              <p className="fluid-small text-gray-600 prevent-overflow">Google Search grounding 支援</p>
            </div>
          </div>

          {/* Meeting Rooms */}
          <div className="bg-white rounded-lg shadow-md fluid-padding-lg">
            <div className="flex-between fluid-space-md">
              <h2 className="fluid-heading-2 font-bold text-gray-900">會議室</h2>
              <button
                onClick={handleCreateRoom}
                className="btn-touch flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden tablet:inline">創建會議室</span>
                <span className="tablet:hidden">創建</span>
              </button>
            </div>

          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                還沒有會議室
              </h3>
              <p className="text-gray-600 mb-4">
                創建您的第一個會議室，AI 將根據討論內容自動生成主題
              </p>
              <button
                onClick={handleCreateRoom}
                className="btn-touch bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="hidden tablet:inline">創建會議室</span>
                <span className="tablet:hidden">創建</span>
              </button>
            </div>
          ) : (
            <div className="card-grid-responsive">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => selectRoom(room.id)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {room.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {room.topic || '主題將在開始討論後自動生成'}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {room.participants.length} 個參與者
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      room.status === 'completed' ? 'bg-green-100 text-green-800' :
                      room.status === 'debating' ? 'bg-blue-100 text-blue-800' :
                      room.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {room.status === 'completed' ? '已完成' :
                       room.status === 'debating' ? '辯論中' :
                       room.status === 'paused' ? '已暫停' :
                       '待開始'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </main>

      <footer className="grid-area-footer">
        <div className="content-area text-center">
          <p className="fluid-small text-gray-600">© 2024 Virtual Meeting Room. Powered by Gemini AI.</p>
        </div>
      </footer>
    </div>
  );
}
