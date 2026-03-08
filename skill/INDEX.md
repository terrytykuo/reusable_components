# Skill Index

---

## `notebooklm-skill/`

**分類**: 知識查詢 / 研究輔助
**語言**: Python 3.8+
**依賴**: `patchright`（瀏覽器自動化）、`python-dotenv`
**平台限制**: 僅支援本機 Claude Code（不支援 Web UI）

**安裝**:
```bash
cp -r skill/notebooklm-skill ~/.claude/skills/notebooklm
# 在 Claude Code 中說：「What are my skills?」
# 首次使用時自動建立 .venv 並安裝依賴
```

**功能說明**:
讓 Claude Code 直接與 Google NotebookLM 對話，從你上傳的文件中取得有來源根據的答案。適合需要查閱大量文件但不想每次把文件貼進 Claude 的情境。

核心流程：Claude 收到問題 → 呼叫 Python 腳本 → 啟動 Chrome 瀏覽器 → 前往 NotebookLM → 送出問題 → 取得 Gemini 的引用回答 → 關閉瀏覽器 → 回傳給 Claude。每次問題都是獨立的 stateless session（無對話記憶）。

**主要腳本**:
| 腳本 | 功能 |
|------|------|
| `scripts/run.py` | 統一入口，自動管理 `.venv` 與依賴安裝，所有腳本都透過此檔執行 |
| `scripts/ask_question.py` | 向指定 notebook 提問，回傳引用型答案 |
| `scripts/notebook_manager.py` | 新增/列出/搜尋/啟用/移除 notebook 資料庫 |
| `scripts/auth_manager.py` | Google 帳號認證（一次性，cookie 持久化） |
| `scripts/cleanup_manager.py` | 清除瀏覽器快取或全部資料 |

**常用指令**（透過 Claude Code）:
```
"Set up NotebookLM authentication"          → 開啟 Chrome 登入 Google
"Add [URL] to my NotebookLM library"        → 新增 notebook 到本地資料庫
"Show my NotebookLM notebooks"              → 列出所有已儲存的 notebook
"Ask my API docs about [topic]"             → 查詢相關 notebook
"Clear NotebookLM browser data"             → 清除 session 快取
```

**適用情境**:
- 查詢專案 API 文件、設計規格、技術白皮書
- 讓 Claude 在寫程式前先「讀懂」文件，減少幻覺
- 需要引用來源的技術查詢（每個回答附帶文件出處）
- 管理多個主題的知識庫（Workshop manual、SDK 文件、產品規格等）

**限制**:
- 每次問題為獨立 session，無法在同一次對話中引用「上一個回答」
- 免費 Google 帳號每日約 50 次查詢上限
- 文件需先手動上傳至 NotebookLM，並設定為「任何知道連結的人可查看」
- 首次啟動需人工在 Chrome 中登入 Google（之後自動維持）

**來源**: 第三方 open-source skill，原作者 PleasePrompto
**原始 repo**: `https://github.com/PleasePrompto/notebooklm-skill`
**詳細文件**: `notebooklm-skill/README.md`、`notebooklm-skill/references/`
