# gnhf run: read-users-sweetp-wo-0cf850

Objective: see .gnhf/runs/read-users-sweetp-wo-0cf850/prompt.md

## Iteration Log

### Iteration 1

**Summary:** Established the MewGuard sentimental-design asset gallery (mewguard.html) with a first batch of 12 brand-tagged animated SVG assets across six journey stages, and created INDEX.md describing the folder.

**Changes:**
- Created mewguard.html: a self-contained, dependency-free gallery of 12 inline-SVG + CSS sentimental UX assets (toward the 40 goal), using cat_toxin_app's cream/forest-green/coral palette and a recurring cat mascot, each carrying the 'mewguard' tag and mapped to onboarding/search/verdict/recovery/emergency/delight journey stages
- Reused the proven gallery interaction shell (journey-stage filters, Pause-motion/Dark-stage/Reduce-motion toggles, per-asset Replay/Copy-SVG/Download with embedded keyframes) and added two cat-specific animations (a-purr, a-tailwag) into the exportable ANIM_CSS
- Created INDEX.md documenting all components in the folder — the new MewGuard kit (with a 12-row asset table and 12/40 status) and the pre-existing generic Mood kit — plus shared SVG/animation/accessibility/export conventions

**Learnings:**
- The ux_assets folder already had a high-quality, proven gallery pattern (index.html 'Mood' kit) from a prior unrelated run; matching its self-contained inline-SVG + embedded-keyframes structure was the fastest path to a consistent, copy/download-able MewGuard kit rather than inventing a new format
- MewGuard's design system lives in cat_toxin_app/constants/colors.ts (warm cream surfaces #F1ECE3, forest-green primary #1b9150, coral #E76953, and explicit safe/cautious/toxic severity colors) — the severity triad maps directly onto the app's three verdict states and drives the emotional tone of the verdict assets
- The objective targets 40 assets but iterations are incremental; 12 well-crafted assets covering the full journey-stage spread is a verifiable first batch, with the footer/INDEX tracking '12 of 40' so future iterations can extend the same grid
- headless Chrome --screenshot mode self-exits (no lingering background process), making it a clean way to visually verify illustration rendering quality for these assets

### Iteration 2

**Summary:** Extended the MewGuard sentimental-design asset kit from 12 to 20 of 40 assets by adding 8 app-grounded illustrations and a new "Care" journey stage, with INDEX.md and all gallery counts updated.

**Changes:**
- Added 8 new brand-tagged animated SVG assets (Mealtime logged, Step on the scale, Time for meds, Fresh claws, Vet day booked, Recall watch, Guardian+ unlocked, Swipe to explore) grounded in real cat_toxin_app features (care tabs, recalls, paywall, onboarding carousel)
- Introduced a new 'Care' journey stage (5 assets) with its own filter chip, and rebalanced all stage counts, the asset count label, and the footer progress to 20 of 40
- Added a new a-swipe keyframe animation wired into the <style>, the prefers-reduced-motion/Reduce-motion fallback lists, and the exportable ANIM_CSS so copied/downloaded SVGs stay self-animating
- Updated INDEX.md with rows 13-20, status 20/40, the added care journey stage, and the a-swipe class in the conventions section

**Learnings:**
- The cat_toxin_app has a rich care-tracking surface (feeding/weight/medication/claw-trim/vet micro-forms, weight timeline, recalls, paywall) beyond the search/verdict core — these map cleanly onto a distinct 'Care' journey stage and a recall 'Alert' under emergency, giving authentic moments for future asset batches
- Adding a new animation requires touching four places in mewguard.html to stay consistent: the <style> @keyframes + class, the @media prefers-reduced-motion list, the body.motion-reduced preview selectors, and the JS ANIM_CSS export array
- 20 assets in a 3-column grid fit within a single 1200x2400 headless Chrome capture, so one full-page screenshot is enough to visually verify the whole kit at this scale

### Iteration 3

**Summary:** Extended the MewGuard sentimental-design asset kit from 20 to 28 of 40 assets by adding 8 app-grounded animated SVG illustrations, three new animations, and updating all gallery counts and INDEX.md.

**Changes:**
- Added 8 new brand-tagged animated SVG assets to mewguard.html (Never heard of that one, Scan the label, How much matters, Stay hydrated, Feeling better day by day, Call your vet now, Brave little patient, With love from us), rebalancing search/verdict/care/recovery/emergency/delight stage coverage
- Introduced 3 new keyframe animations (nod, ripple, scan) wired through all four required places: the <style> @keyframes + .a- class, the prefers-reduced-motion list, the body.motion-reduced preview selectors, and the exportable ANIM_CSS array
- Updated all journey-stage filter chip counts, the 'All' count, the live fb-count label, and the footer progress to reflect 28 of 40
- Updated INDEX.md with rows 21-28, the 28/40 status, and the new a-nod/a-ripple/a-scan classes in the conventions section

**Learnings:**
- The full 28-card gallery at 1200px wide is ~5300px tall (10 rows of 3), so a headless Chrome --screenshot needs window height >=5600 to avoid silently clipping the last cards — earlier 3400/4800 captures cut off the new assets and required re-rendering
- sips crop offset flags (--cropOffset / --cropToHeightWidth) did not crop on this macOS build; Python PIL Image.crop is the reliable way to inspect specific gallery rows from a tall full-page screenshot

### Iteration 4

**Summary:** 將 MewGuard 情感設計資產套件從 28/40 擴充到 36/40,新增 8 個以 app 真實功能為依據的動畫 SVG 資產與兩個新動畫,並同步更新所有計數與 INDEX.md。

**Changes:**
- 在 mewguard.html 新增 8 個品牌標記的動畫 SVG 資產(Saved for later、Your account ready、Reminder set、Four days strong、Home is where the cat is、Spread the word、All clear、Reviewed by vets),分別對應 app 的書籤/個人帳號/提醒通知/照護日曆連續紀錄/My Home 分頁/分享推薦/召回解除/獸醫審核等真實功能點
- 引入兩個新 keyframe 動畫 a-ring(鈴鐺擺動)與 a-shine(掃光),完整接入五個必要位置:<style> @keyframes 與 .a- class、prefers-reduced-motion 清單、body.motion-reduced 預覽選擇器,以及可匯出的 ANIM_CSS 陣列
- 重新平衡並更新所有 journey-stage 計數(onboarding 5/search 5/verdict 5/care 8/recovery 4/emergency 4/delight 5)、All 計數 36、即時 fb-count 標籤與 footer 進度為 36 of 40
- 在 INDEX.md 補上第 29-36 列資產說明、將狀態更新為 36/40,並於慣例段落加入 a-ring/a-shine 動畫類別

**Learnings:**
- headless Chrome 對 36 張卡(12 列 ×3)的全頁截圖需 window 高度約 7200px 才能完整擷取,沿用前次 5600 的高度會裁掉底部新卡
- grep 比對 <svg 與 </svg> 出現 49 vs 46 的差異屬正常:JS 區塊有 3 處註解含 <svg> 字面字串,並非未閉合標籤——驗證結構應改以 <article> 開合數(36/36)為準
- app 在搜尋/驗證核心之外仍有豐富未涵蓋的情感時刻(書籤儲存、個人帳號、提醒通知、照護連續紀錄、My Home 分頁、分享推薦、召回解除、獸醫審核來源),足以支撐後續批次的 grounded 資產

### Iteration 5

**Summary:** 將 MewGuard 情感設計資產套件從 36/40 擴充至 40/40 完成目標,新增最後 4 個以 app 真實情境為依據的動畫 SVG 資產並同步更新所有計數與 INDEX.md。

**Changes:**
- 在 mewguard.html 新增 4 個品牌標記的動畫 SVG 資產達成 40/40:Picking up where you left off(search,最近查詢紀錄+時鐘徽章)、Back to chasing toys(recovery,康復貓咪戲毛線球)、While you wait(emergency,就醫前急救步驟清單)、Rate your peace of mind(delight,五星評分+貓掌感謝)
- 更新所有 journey-stage chip 計數(search 6、recovery 5、emergency 5、delight 6)、All 計數 40、即時 fb-count 標籤為 40 assets,並將 footer 進度改為 40 of 40 complete
- 更新 INDEX.md:狀態改為 40 of 40 complete、補上第 37-40 列資產說明、並在 journey stages 加註各 stage 數量

**Learnings:**
- 本次 4 個新資產全部複用既有 11 個動畫類別(a-rise/a-pop/a-float/a-tailwag/a-blink/a-wiggle/draw/a-pulse/a-heartbeat 等),因此前次迭代提到的「新增動畫需同步五處」規則本次完全不適用——優先複用既有動畫可大幅降低出錯面
- 五點星形以 <g class='a-pop' transform-origin> 包裹帶有靜態 transform='translate() scale()' 的 path,可同時兼顧入場縮放動畫與精確定位,且 transform-origin 套在外層 g、靜態 transform 套在內層 path 不會互相干擾
- 40 張卡(約 14 列×3)的全頁 headless Chrome 截圖需 window 高度約 8200px;以 PIL 從底部裁切(h-1700 至 h-300)是檢視最後幾列新卡的可靠方式
- 驗證 stage 分布最快的方法是 grep -o 'data-cat=...' | sort | uniq -c 直接比對各 chip 計數,確保 article 數與 filterbar 計數一致(本次 40 全對齊)

### Iteration 6

**Summary:** 補上目標明確要求但前幾次迭代缺漏的 Lottie 檔案:新增 lottie/ 資料夾與 8 個結構合法、帶 mewguard 標籤的 Lottie JSON 動畫及其產生器,並更新 INDEX.md。

**Changes:**
- 新增 lottie/ 資料夾,內含 8 個真正合法的 Lottie JSON 動畫(心跳/安全勾選/貓掌載入/愛心彈出/貓咪呼吸/召回鈴鐺/補水漣漪/五星評分),v5.5、240×240、30fps、可循環,全部以 cat_toxin_app 調色盤並在 meta.k 帶 mewguard 標籤
- 撰寫 lottie/_build.py 產生器,以 python-lottie 物件模型建構並匯出,保證輸出 schema 合法且可重現(python3 lottie/_build.py)
- 更新 INDEX.md:新增 lottie/ 段落(8 列資產表 + lottie-react-native/web player 用法),並修正導言由『Lottie-style』改為實際存在的 Lottie 檔案
- 以 parse_tgs 重新解析驗證全部 8 檔合法、帶標籤、可循環,並用 headless Chrome 渲染 mid-frame 確認圖層與品牌色正確

**Learnings:**
- 目標同時要求 illustrations 與 lottie files,但前 5 次迭代只產出 SVG+CSS 而從未產生任何 .json Lottie——達成 40/40 計數不等於滿足全部目標需求,檢視目標原文找出未涵蓋的交付物是有價值的增量工作
- Lottie 繪製順序與直覺相反:陣列中先加入的 shape/layer 位於上層(後繪製),因此背景必須最後加入且獨立成不參與動畫的圖層,否則初版會渲染出全空白卡片
- 環境無 Lottie 工具但可離線 pip install python-lottie 0.7.2,其物件模型能程式化建構保證合法的 Lottie 並 export_svg 渲染單幀(has_cairo=False 時 PNG 不可用,但 SVG 可,再用既有 headless Chrome 截圖驗證)
- python-lottie 的 Metadata.keywords (meta.k) 是放品牌標籤的正確欄位;Star 類別需手動設定 star_type/points/inner_radius/outer_radius,Rect 而非 Rectangle

### Iteration 7

**Summary:** 新增自包含的 lottie/gallery.html 預覽頁與其產生器,讓 8 個 MewGuard Lottie JSON 動畫首次能在瀏覽器中即時播放與驗證,並更新 INDEX.md。

**Changes:**
- 新增 lottie/gallery.html:把 8 個 Lottie JSON 以 animationData 內嵌(可直接從 file:// 開啟、無 fetch/CORS 問題),以 lottie-web 播放器渲染,並提供 Pause/Replay all、Dark stage 切換與 Speed 滑桿,風格對齊既有 SVG gallery 的品牌調色盤,每張卡顯示 stage/motion/payoff 與 mewguard 標籤
- 新增 lottie/_build_gallery.py 產生器:讀取 mw-*.json 並依 journey 順序內嵌產出 gallery.html,metadata 表對齊 INDEX.md 的 Lottie 表格以避免文件漂移,可重複執行 (python3 lottie/_build_gallery.py)
- 更新 INDEX.md:在 lottie 段落新增 Preview 說明,並在導言點出 lottie/gallery.html 可在瀏覽器預覽全部 Lottie 動畫

**Learnings:**
- 前 6 次迭代產出 8 個合法 Lottie JSON,但沒有任何瀏覽器預覽方式——檔案存在不等於可驗證/可用,補上預覽工具是真實的增量價值
- lottie-web 的 loadAnimation 用 path: 從 file:// 載入 JSON 會踩 CORS,改用 animationData 內嵌(透過產生器把 JSON 直接嵌入 HTML)即可離線開啟;只有播放器需從 CDN 載入
- headless Chrome 搭配 --virtual-time-budget 可實際抓到 CDN 載入後的 lottie 渲染幀,確認 8 個動畫(貓掌點/綠環打勾/coral 心跳/金鈴/補水碗/心形/星星/貓臉)都正確繪製

### Iteration 8

**Summary:** 將 MewGuard Lottie 動畫集從 8 個擴充到 10 個,補齊先前缺漏的 Onboarding 與 Recovery 兩個 journey stage,讓 Lottie 集涵蓋全部七個情感旅程階段。

**Changes:**
- 新增 mw-wave-hello.json(Onboarding·Welcome):吉祥物揮手 + 頭部輕點,以 anchor_point 設於手腕讓貓掌繞固定樞紐擺動
- 新增 mw-recovery-arc.json(Recovery·Tracking):以 Trim 逐段繪出向上攀升折線、綠點依序彈入、頂端金點收尾的康復趨勢圖
- 在 lottie/_build.py 加入兩個對應 builder 並接入 BUILDERS,維持輸出可重現
- 更新 lottie/_build_gallery.py 的 META 與 ORDER(依 journey 重排)並重新產生含 10 張卡的 lottie/gallery.html
- 更新 INDEX.md:Lottie 狀態改為 10 檔、新增兩列資產表、重排為 journey 順序、註明涵蓋全部七個 stage,預覽說明改為 10 個動畫

**Learnings:**
- python-lottie 的 parse_tgs 將 metadata.keywords 以字元清單形式 repr 顯示,但 JSON meta.k 實際是逗號分隔字串;驗證標籤應直接讀 JSON 的 meta.k 而非看 parser repr
- grep '"k":"mewguard' 會因 lottie JSON 輸出在冒號後帶空格("k": "...")而誤判為 0,字串比對標籤要用 json.load 後 in 判斷
- python-lottie 可用 export_svg(anim, path, frame=N) 直接匯出指定幀的靜態 SVG,再以 headless Chrome 截圖,是逐一驗證單一新 Lottie 渲染最快的方式(免開整個 gallery)
- 先前 8 個 Lottie 只覆蓋 5 個 stage(缺 onboarding/recovery);40 個 SVG 達標不代表 Lottie 子集也均衡,比對 SVG 的 stage 分布能找出 Lottie 的真實覆蓋缺口

### Iteration 9

**Summary:** 將 MewGuard Lottie 動畫集從 10 個擴充到 12 個,新增 Care·Time for meds(膠囊藥丸)與 Emergency·Call your vet now(暖色話筒+來電聲波)兩個動畫,補強相對 SVG 套件最薄弱的兩個 stage。

**Changes:**
- 新增 mw-meds-reminder.json(Care·Reminder):雙色膠囊藥丸在呼吸式光環中柔和脈動,對應 SVG 第 15 號『Time for meds』,以 rounded_rect 建構膠囊本體與 cream 分隔帶
- 新增 mw-call-vet.json(Emergency·Action):暖色 coral 話筒(smile-arc 受話器+兩端聽筒)脈動,搭配右上角序列淡入淡出的來電聲波環,對應 SVG 第 26 號『Call your vet now』
- 在 lottie/_build.py 加入 Rect import、rounded_rect 輔助函式與兩個 builder 並接入 BUILDERS,保持輸出可重現
- 更新 lottie/_build_gallery.py 的 META 與 ORDER(依 journey 順序插入 care/emergency)並重新產生含 12 張卡的 lottie/gallery.html
- 更新 INDEX.md:Lottie 狀態改為 12 檔、表格新增兩列、預覽說明改為 12 個動畫

**Learnings:**
- python-lottie 的靜態 SVG 匯出函式是 lottie.exporters.svg.export_svg(anim, file_obj, frame=N)(需傳檔案物件,非路徑),而非 exporters.core——core 只有 export_lottie/export_tgs
- python-lottie 的 Rect 類別支援 .rounded.value 設圓角;當 rounded ≈ height/2 即可從矩形得到膠囊(capsule)形狀,免手刻 bezier
- Care 階段在 SVG 套件有 8 個情感時刻卻只有 1 個 Lottie(water-ripple),比對 SVG 與 Lottie 的 stage 分布能找出最值得補強的失衡點——本次以 meds-reminder 補 Care、call-vet 補 Emergency

### Iteration 10

**Summary:** 將 MewGuard Lottie 動畫集從 12 個擴充到 14 個,新增 Search·Scan the label(掃描光束掃過標籤卡)與 Care·Mealtime logged(乾糧落入碗中+愛心彈出),補強相對 SVG 套件最薄弱的兩個 Lottie 階段。

**Changes:**
- 新增 mw-scan-label.json(Search·Action):半透明綠色掃描光束沿白色標籤卡(含左對齊綠色文字列)由上往下掃過並在兩端淡出,對應 SVG 第 22 號『Scan the label』,補強僅有 1 個 Lottie 的 search 階段
- 新增 mw-meal-bowl.json(Care·Feedback):四顆雙色乾糧依序落入綠色食碗並回彈定位,結尾上方彈出 coral 愛心,對應 SVG 第 13 號『Mealtime logged』,補強 SVG 有 8 個情感時刻但 Lottie 僅 2 個的 care 階段
- 在 lottie/_build.py 新增 build_scan_label 與 build_meal_bowl 兩個 builder 並接入 BUILDERS,複用既有 rounded_rect/ellipse/heart_group 輔助函式,輸出可重現
- 更新 lottie/_build_gallery.py 的 META 與 ORDER(依 journey 順序插入 search/care)並重新產生含 14 張卡的 lottie/gallery.html
- 更新 INDEX.md:Lottie 狀態改為 14 檔、表格新增兩列、預覽說明改為 14 個動畫

**Learnings:**
- 乾糧『掉落』效果用 transform.position 的 y 軸關鍵幀(高處 EASE_IN 加速 → 略過頭 EASE_OUT → 回彈定位 EASE_IO)即可,搭配 opacity 在起點快速淡入,落點需設在碗的內表面 ellipse 之上;因 kibble 圖層先加入(在上層)會疊在碗面上方,視覺正確
- 掃描光束用半透明 rounded_rect 沿 y 軸往返並在兩端 opacity 淡出,比固定亮帶更能讓每次 loop 讀起來像一次新的掃描;文字列以 cx = -55 + lw/2 在 150 寬卡片內左對齊,比置中更像真實標籤
- Lottie 子集相對 SVG 套件的階段失衡仍在(補完後 search 2、care 3,但 SVG 各為 6、8);比對兩者 stage 分布持續是挑選下一批 Lottie 最有依據的方法

### Iteration 11

**Summary:** 將 MewGuard Lottie 動畫集從 14 個擴充到 16 個,新增 Onboarding·Name your cat(擺動的愛心項圈吊牌)與 Recovery·Back to chasing toys(彈跳旋轉的毛線球),補強相對 SVG 套件最薄弱的兩個階段。

**Changes:**
- 新增 mw-name-tag.json(Onboarding·Empty profile):刻有 coral 愛心的綠色項圈吊牌以頂端掛環為樞紐鐘擺式擺動,對應 SVG『Name your cat』空白個人檔狀態,將 onboarding 階段 Lottie 從 1 補到 2
- 新增 mw-chase-toy.json(Recovery·Milestone):coral 毛線球(含交叉 cream 纏繞線與鬆脫線尾)垂直彈跳並連續旋轉、落地時 squash 壓扁,對應 SVG『Back to chasing toys』康復里程碑,將 recovery 階段 Lottie 從 1 補到 2
- 在 lottie/_build.py 新增 build_name_tag 與 build_chase_toy 兩個 builder 並接入 BUILDERS,複用既有 heart_group/ellipse/stroke_circle 輔助函式,輸出可重現
- 更新 lottie/_build_gallery.py 的 META 與 ORDER(依 journey 順序插入 onboarding/recovery)並重新產生含 16 張卡的 lottie/gallery.html
- 更新 INDEX.md:Lottie 狀態改為 16 檔、表格新增兩列、預覽說明改為 16 個動畫

**Learnings:**
- 以 transform.anchor_point 設於圖層內某一點(此處掛環上方 Point(0,-48))即可讓整層繞該樞紐做鐘擺旋轉,免拆成父子圖層;搭配對稱的 rotation 關鍵幀(-16→16→-16,起訖同值)可乾淨循環
- 毛線球的纏繞線不必手刻 bezier:兩個正交的細 stroke 橢圓(64×32 與 32×64,cream)疊在 coral 球體上即讀作交叉纏繞;球體 ellipse 最後加入(在下層)確保線在上方
- 彈跳動畫用純垂直 position 關鍵幀(150 地面 ↔ 92 頂點)即可乾淨 loop,並以 scale 在落地幀壓扁(116×86)、頂點還圓(100×100)做 squash & stretch;rotation 0→360 的連續自轉讓毛線球更顯活潑
- 補完本批後 Lottie 七階段分布趨於平衡(各 2-3 個),onboarding 與 recovery 不再是 1 個的失衡點;比對 Lottie 與 SVG 各階段數量仍是挑選下一批最有依據的方法
