# 🎣 Pretinha Pesca - Deploy Guide

## 🚀 Como colocar no ar

### 1. Criar conta no GitHub
- Acesse: https://github.com
- Clique em "Sign up"
- Use seu email

### 2. Criar repositório
- Clique em "New repository"
- Nome: `pretinha-pesca`
- Público ou Privado (sua escolha)
- Não marque nenhuma opção extra

### 3. Conectar este projeto ao GitHub
```bash
git remote add origin https://github.com/SEU_USUARIO/pretinha-pesca.git
git push -u origin main
```

### 4. Deploy no Vercel
- Acesse: https://vercel.com
- Clique em "Continue with GitHub"
- Escolha o repositório `pretinha-pesca`
- Clique em "Deploy"

### 5. Configurar variáveis de ambiente
No Vercel, vá em:
- Project Settings > Environment Variables
- Adicione estas 3 variáveis:

```
NEXT_PUBLIC_SUPABASE_URL = [sua_url_supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [sua_chave_anonima]
SUPABASE_SERVICE_ROLE_KEY = [sua_chave_service_role]
```

### 6. Redeploy
- Clique em "Redeploy" no Vercel
- Site estará no ar!

## 🔑 Suas credenciais Supabase:
(Cole aqui suas credenciais para referência)

```
URL: [preencher]
ANON KEY: [preencher]  
SERVICE ROLE: [preencher]
```

## ✅ Checklist final:
- [ ] Código no GitHub
- [ ] Deploy no Vercel
- [ ] Variáveis configuradas
- [ ] Site funcionando
- [ ] Teste no celular
