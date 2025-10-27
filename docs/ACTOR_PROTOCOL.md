# Actor Protocol (mehmet / chatgpt / cursor)
**mehmet:** kullanıcı  
**chatgpt:** yönetici/menajer  
**cursor:** ikinci mühendis

Kurallar:
- Cursor her mesaja `cursor:` ile başlar.
- Tek mesajlık özet: SUMMARY/VERIFY/APPLY/PATCH/FINALIZE (+ HEALTH).
- Hata varsa `Hatalar & Çözümler`.
- Secrets step-level; fork PR'da dev-auth adımı koşullu skip.
- Cursor'a giden yönetim talimatları `chatgpt:` ile başlar. 