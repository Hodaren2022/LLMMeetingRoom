# 虛擬會議室系統需求文件

## 簡介

虛擬會議室系統是一個基於 AI 的智能辯論平台，允許用戶創建多個虛擬替身，針對特定議題進行深度辯論，並透過聯網搜尋功能獲取最新資訊，最終達成共識或進行多輪討論。

## 需求

### 需求 1：替身管理系統

**用戶故事：** 作為用戶，我希望能夠創建和管理多個虛擬替身，每個替身都有獨特的人格特質和專業背景，以便在辯論中扮演不同角色。

#### 驗收標準

1. WHEN 用戶進入替身管理頁面 THEN 系統 SHALL 顯示所有可用的替身列表
2. WHEN 用戶點擊「創建替身」按鈕 THEN 系統 SHALL 打開替身編輯器
3. WHEN 用戶填寫替身資訊（名稱、身份、核心原則、辯論風格、預設傾向、搜尋重點、溫度參數）THEN 系統 SHALL 驗證資料完整性並保存替身
4. WHEN 用戶點擊替身卡片 THEN 系統 SHALL 切換該替身的啟用狀態
5. WHEN 用戶編輯或刪除替身 THEN 系統 SHALL 更新替身資料或從列表中移除

### 需求 2：會議室創建與管理

**用戶故事：** 作為用戶，我希望能夠創建會議室並設定辯論議題，選擇參與的替身，以便組織結構化的辯論活動。

#### 驗收標準

1. WHEN 用戶點擊「創建會議室」THEN 系統 SHALL 提示輸入會議室名稱和辯論議題
2. WHEN 用戶輸入有效的會議室資訊 THEN 系統 SHALL 創建新會議室並導航至該會議室
3. WHEN 用戶在會議室中選擇替身 THEN 系統 SHALL 將選中的替身加入參與者列表
4. WHEN 會議室至少有 2 個參與替身 THEN 系統 SHALL 啟用「開始辯論」功能
5. WHEN 用戶設定會議參數（最大回合數、共識門檻、每回合超時時間）THEN 系統 SHALL 保存這些設定

### 需求 3：聯網搜尋與資料整合

**用戶故事：** 作為系統，我希望能夠透過 Gemini API 的 Google Search grounding 功能自動搜尋相關資訊，以便為替身提供最新、準確的資料支持其論點。 <kreference link="https://ai.google.dev/gemini-api/docs/google-search" index="1">[^1]</kreference>

#### 驗收標準

1. WHEN 辯論開始前 THEN 系統 SHALL 分析議題並生成相關搜尋關鍵詞
2. WHEN 系統執行搜尋 THEN 系統 SHALL 使用 Gemini API 的 googleSearch 工具獲取最新資訊 <kreference link="https://ai.google.dev/gemini-api/docs/google-search" index="1">[^1]</kreference>
3. WHEN 搜尋完成 THEN 系統 SHALL 將搜尋結果整合到共享上下文中
4. WHEN 替身發言時 THEN 系統 SHALL 在 prompt 中包含相關搜尋結果
5. WHEN 替身引用搜尋資料 THEN 系統 SHALL 在回應中包含來源引用資訊

### 需求 4：深度辯論機制（Chain of Thought）

**用戶故事：** 作為系統，我希望實現強制性三層推理機制，確保替身進行深度辯論而非淺層對話，以提高辯論質量和說服力。 <kreference link="https://www.promptingguide.ai/techniques/cot" index="2">[^2]</kreference>

#### 驗收標準

1. WHEN 替身準備發言 THEN 系統 SHALL 強制執行解析（Analyze）階段，分析前一發言的薄弱點
2. WHEN 解析完成 THEN 系統 SHALL 執行批判（Critique）階段，結合搜尋結果提出反駁論點
3. WHEN 批判完成 THEN 系統 SHALL 執行策略（Strategy）階段，制定結構化的回應策略
4. WHEN 替身發言 THEN 系統 SHALL 確保回應包含明確引用、反駁論點和行動呼籲三個部分
5. WHEN 發言結束 THEN 系統 SHALL 要求替身提供傾向度分數（1-10）

### 需求 5：共識計算與投票機制

**用戶故事：** 作為用戶，我希望系統能夠自動計算辯論共識，並提供量化的支持度和反對度，以便了解辯論結果和決定是否需要進一步討論。

#### 驗收標準

1. WHEN 每輪辯論結束 THEN 系統 SHALL 收集所有替身的傾向度分數
2. WHEN 計算共識 THEN 系統 SHALL 使用公式：支持度 = Σ分數 / (10 × 替身數量)
3. WHEN 計算共識 THEN 系統 SHALL 使用公式：反對度 = Σ(10-分數) / (9 × 替身數量)
4. WHEN 支持度或反對度超過設定門檻（預設 70%）THEN 系統 SHALL 宣告達成共識
5. WHEN 未達成共識且未達最大回合數 THEN 系統 SHALL 繼續下一輪辯論

### 需求 6：多輪辯論控制

**用戶故事：** 作為用戶，我希望能夠控制辯論流程，包括暫停、恢復、停止辯論，以及設定最大回合數，以便靈活管理辯論進程。

#### 驗收標準

1. WHEN 用戶點擊「開始辯論」THEN 系統 SHALL 初始化辯論並開始第一輪
2. WHEN 辯論進行中且用戶點擊「暫停」THEN 系統 SHALL 暫停當前辯論狀態
3. WHEN 辯論暫停且用戶點擊「恢復」THEN 系統 SHALL 從暫停點繼續辯論
4. WHEN 用戶點擊「停止」THEN 系統 SHALL 終止辯論並計算最終結果
5. WHEN 達到最大回合數 THEN 系統 SHALL 自動結束辯論並顯示最終共識

### 需求 7：實時狀態顯示

**用戶故事：** 作為用戶，我希望能夠實時查看辯論狀態，包括當前發言者、回合數、各替身的傾向度變化，以便了解辯論進展。

#### 驗收標準

1. WHEN 辯論進行中 THEN 系統 SHALL 顯示當前回合數和最大回合數
2. WHEN 替身發言時 THEN 系統 SHALL 高亮顯示當前發言者
3. WHEN 替身完成發言 THEN 系統 SHALL 更新該替身的傾向度分數顯示
4. WHEN 辯論狀態改變 THEN 系統 SHALL 更新狀態指示器（準備中、搜尋中、辯論中、已完成等）
5. WHEN 出現錯誤 THEN 系統 SHALL 顯示錯誤訊息並提供重試選項

### 需求 8：辯論歷史與來源追蹤

**用戶故事：** 作為用戶，我希望能夠查看完整的辯論歷史和每個論點的來源，以便驗證資訊的可靠性和追蹤論點的發展過程。

#### 驗收標準

1. WHEN 替身發言 THEN 系統 SHALL 記錄發言內容、時間戳、傾向度分數和來源引用
2. WHEN 用戶查看辯論歷史 THEN 系統 SHALL 按時間順序顯示所有發言
3. WHEN 發言包含來源引用 THEN 系統 SHALL 提供可點擊的連結到原始來源
4. WHEN 用戶點擊來源連結 THEN 系統 SHALL 在新視窗中打開來源網頁
5. WHEN 辯論結束 THEN 系統 SHALL 生成包含所有來源的參考文獻列表

  [^1]: https://ai.google.dev/gemini-api/docs/google-search
  [^2]: https://www.promptingguide.ai/techniques/cot