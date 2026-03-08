# Reusable Components — skill/

Claude Code Skill 模板庫。每個 skill 是一個獨立資料夾，包含 `SKILL.md`（Claude 的指令）與對應的腳本或工具。

---

## 資料夾結構

```
skill/
├── README.md                              ← 本文件
├── INDEX.md                               ← 每個 skill 的完整說明
│
└── notebooklm-skill/                      ← Google NotebookLM 查詢 skill
    ├── SKILL.md                           ← Claude 的行為指令
    ├── scripts/                           ← Python 自動化腳本
    │   ├── run.py                         ← 統一入口（自動管理 venv）
    │   ├── ask_question.py                ← 查詢 NotebookLM
    │   ├── notebook_manager.py            ← 管理 notebook 資料庫
    │   ├── auth_manager.py                ← Google 身份驗證
    │   ├── browser_session.py             ← 瀏覽器 session 管理
    │   ├── browser_utils.py               ← 瀏覽器工具函式
    │   ├── cleanup_manager.py             ← 清除快取與資料
    │   ├── config.py                      ← 設定管理
    │   └── setup_environment.py           ← 初次環境建立
    ├── references/                        ← 延伸文件
    │   ├── api_reference.md
    │   ├── troubleshooting.md
    │   └── usage_patterns.md
    ├── requirements.txt
    ├── AUTHENTICATION.md
    └── CHANGELOG.md
```

---

## 使用方式

將需要的 skill 資料夾複製到 `~/.claude/skills/`：

```bash
cp -r skill/notebooklm-skill ~/.claude/skills/notebooklm
```

接著在 Claude Code 中說：
```
"What are my skills?"
```

詳細說明請見各 skill 的 `README.md` 與 [INDEX.md](./INDEX.md)。

---

## ⚠️ 注意事項

- `data/`、`.venv/` 資料夾不在版本控制內（含敏感資料與環境依賴）
- Skill 僅支援本機 Claude Code，不支援 Claude Web UI（需要瀏覽器自動化與網路存取）
