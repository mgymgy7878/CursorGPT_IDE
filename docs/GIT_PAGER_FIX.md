# Git Pager Fix — Cursor/VS Code Run Panel

## Problem
`git log` komutları Cursor/VS Code Run panelinde takılıyor çünkü:
- Git varsayılan olarak `less` pager kullanır
- Run paneli tam etkileşimli TTY değil
- `less` tuş beklerken iptal butonu çalışmaz

## Solution (Applied)
```bash
# Kalıcı çözüm (global)
git config --global core.pager cat
git config --global pager.log false

# Tek seferlik bypass
git --no-pager log --oneline -7
```

## Why This Works
- `core.pager = cat`: Tüm git komutlarında pager devre dışı
- `pager.log = false`: Sadece git log için ekstra güvenlik
- `--no-pager`: Tek seferlik bypass (CI/script'ler için)

## Alternative Methods
```bash
# Environment variable (session)
$env:GIT_PAGER='cat'

# Command-specific
git config --global pager.diff false
git config --global pager.branch false
```

## Emergency Recovery
Eğer yine takılırsa:
1. **Ctrl+C** / **Ctrl+Break**
2. PowerShell: `Get-Process less -ErrorAction SilentlyContinue | Stop-Process -Force`
3. Tekrar dene: `git --no-pager log`

## References
- [Git Documentation](https://git-scm.com/docs/git)
- [VS Code Terminal Basics](https://code.visualstudio.com/docs/terminal/basics)
- [Microsoft Learn - PowerShell](https://learn.microsoft.com/en-us/answers/questions/554494/how-to-end-running-command-in-visual-studio-2019-t)

---
**Status:** ✅ FIXED  
**Applied:** 25 Ekim 2025  
**Test:** `git log --oneline -7` ✅ PASS
