# 🌐 GUIA COMPLETO - DOMÍNIO GRATUITO EM 15 MINUTOS

## 🎯 **OBJETIVO**: Configurar `pretinhapesca.tk` ou `ppesca.tk`

---

## 📱 **PASSO 1: REGISTRAR DOMÍNIO GRATUITO**

### **Opção A - Freenom (MAIS CONFIÁVEL):**
1. **Acesse**: https://www.freenom.com/en/freeondns/
2. **Busca**: Digite `pretinhapesca` na caixa de busca
3. **Choose**: Clique no `.tk` que aparecer (gratuito)
4. **Period**: Click "Continue" → Selecionar 12 months FREE
5. **Checkout**: Preencher:
   - **Email**: Seu email real
   - **Password**: Criar senha
   - **Phone**: +55 (11) 99999-9999
   - **Address**: Seu endereço
6. **Complete**: Clique "Complete Order"

### **Opção B - DuckDNS (ALTERNATIVA):**
1. **Acesse**: https://www.duckdns.org/
2. **Sign up**: Vinculado ao Google
3. **Subdomain**: Escolher `ppesca`
4. **Domain**: Selecionar `.duckdns.org`
5. **Create**: Sua URL será `ppesca.duckdns.org`

---

## ⚙️ **PASSO 2: CONFIGURAR NO VERCEL**

### **2.1 Acessar Vercel:**
1. **Login**: https://vercel.com/dashboard
2. **Projeto**: Clique em "pretinha-pesca"
3. **Settings**: Aba lateral → "Settings"
4. **Domains**: Clique "Domains"

### **2.2 Adicionar domínio:**
1. **Add Domain**: Botão azul
2. **Digite**: `pretinhapesca.tk` (ou seu domínio escolhido)
3. **Verify**: Click "Add"

### **2.3 Copiar configurações DNS:**
Vercel vai mostrar algo como:
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**👉 COPIE ESSAS CONFIGURAÇÕES EXATAS!**

---

## 🔧 **PASSO 3: CONFIGURAR DNS**

### **Para Freenom:**
1. **Login**: https://www.freenom.com/
2. **Services**: "My Domains"
3. **Manage**: Clique em seu domínio
4. **DNS**: Aba "Manage Freenom DNS"
5. **Records**: Adicionar os registros EXATOS que o Vercel pediu

### **Para DuckDNS:**
1. **Dashboard**: https://www.duckdns.org/
2. **Domain**: Clique em `ppesca.duckdns.org`
3. **IPv4**: Cole o IP: `76.76.19.61`
4. **Update**: Click "Update"

---

## ⏳ **PASSO 4: AGUARDAR PROPAGAÇÃO**

### **Status no Vercel:**
- **Pending**: ⚠️ Aguardando DNS
- **Valid**: ✅ Funcionando!
- **Invalid Configuration**: ❌ Erro - verificar DNS

### **Tempo médio**: 5-15 minutos

---

## 🎯 **PASSO 5: TESTAR**

### **URLs para testar:**
- `https://pretinhapesca.tk/login`
- `https://www.pretinhapesca.tk/login`

### **Verificar se funciona:**
1. ✅ Abre página de login
2. ✅ Não redireciona para SSO Vercel
3. ✅ Login funciona normalmente

---

## 🚨 **SOLUÇÃO DE PROBLEMAS:**

### **Se DNS não propagar em 30 minutos:**
1. **Verificar configuração** no provedor DNS
2. **Esperar mais tempo** (pode levar 24h)
3. **Usar DuckDNS** como alternativa rápida

### **Se Vercel mostra "Invalid":**
1. **Verificar IP**: Deve ser exatamente `76.76.19.61`
2. **Verificar tipo**: A para root (@), CNAME para www
3. **Aguardar**: Pode levar tempo para propagar

---

## 📋 **RESULTADO FINAL:**

### **Ao invés de:**
```
❌ https://pretinha-pesca-git-main-pedros-projects-7c727e0c.vercel.app/
```

### **Você terá:**
```
✅ https://pretinhapesca.tk/login
```

**Muito mais profissional!**

---

## ⚡ **INSTRUÇÕES PARA FUNCIONÁRIOS:**

**Copie e cole assim:**
```
🎣 Acesse o sistema Pretinha Pesca:

https://pretinhapesca.tk/login

📧 Suas credenciais:
- Carla: carlacampanuccy@gmail.com / Cc@12345  
- Pessoa: pessoa93453@yahoo.com / Ap@12345

✅ Este link vai direto para login, sem problemas!
```

---
