## Screenshots Playbook

- Hızlı paylaşım: PR/Issue açıklamasına veya yoruma görselleri sürükle-bırak (tercih edilen). GitHub otomatik URL üretir.
- Kalıcı dokümantasyon: Bu klasöre koy; bu klasör **Git LFS ile izlenir**.
- İsim standardı: `YYYY-MM-DD_hhmm_context.png`
  - Örn: `2025-08-15_1753_ui-control-3003-refused.png`
- Markdown ile gömme örneği:
  `![ui-control](./2025-08-15_1753_ui-control-3003-refused.png)`

### LFS Notu
- Büyük görseller (png/jpg/jpeg/webp) için LFS etkin: `.gitattributes` bu uzantıları LFS’e yönlendirir.
- Yerelde bir kez çalıştırın: `git lfs install`
- Commit → Push → PR açıklamasına görselleri bırakın; PR şablonundaki "Screenshots & Proofs" bölümünü doldurun. 