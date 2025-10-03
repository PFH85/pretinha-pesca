# 🎣 PRETINHA PESCA - VARIÁVEIS DE AMBIENTE PARA DEPLOY

## 📋 VARIÁVEIS NECESSÁRIAS NO VERCEL:

### 🔑 SUPABASE CONFIGURATION:
```
NEXT_PUBLIC_SUPABASE_URL=https://aiabrkhliswisbmsarnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpYWJya2hsaXN3aXNibXNhcm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MzcwNzEsImV4cCI6MjA3NTAxMzA3MX0.MFCIic6M42n83ccFOwZ0DY7XQMaFPNuHEecqcw2G4ww
SUPABASE_SERVICE_ROLE_KEY=[CHAVE_SERVICE_ROLE_DO_SUPABASE]
```

## 🎯 COMO CONFIGURAR NO VERCEL:

1. **Acesse**: https://vercel.com/dashboard
2. **Projeto**: pretinha-pesca
3. **Settings** → **Environment Variables**
4. **Adicione as 3 variáveis acima**

## ⚠️ IMPORTANTE:
- ✅ URL e ANON_KEY já estão corretos
- 🔄 SERVICE_ROLE_KEY precisa ser obtida do Supabase Dashboard
- 🎯 Todas as variáveis devem estar em UPPERCASE

## 🔍 VERIFICAÇÃO:
- ✅ Supabase URL: aiabrkhliswisbmsarnn.supabase.co
- ✅ Projeto: pretinha pesca novo
- ✅ Banco: PostgreSQL com RLS ativo
- ✅ Usuários: 4 usuários criados e confirmados

---
**Status**: VARIÁVEIS DOCUMENTADAS ✅
