'use client';
import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { format } from 'date-fns';
import { getSupabaseClient } from '@/lib/supabaseClient';

const TIPOS = ['Despesa fixa', 'Despesa variável', 'Pessoal', 'Material de pesca', 'Manutenção'];

// TIPOS CUSTOMIZADOS - Quando escolher "Outros", mostrar campo de texto
const TIPOS_EMAIL_CUSTOMIZADO = 'Outros (especificar):';

export default function DespesasPage() {
  const supabase = getSupabaseClient();
  const [item, setItem] = useState('');
  const [tipo, setTipo] = useState('');
  const [tipoCustomizado, setTipoCustomizado] = useState('');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [valor, setValor] = useState<number | ''>('');
  const [pago, setPago] = useState(false);
  // pagador removido - não existe na tabela despesas
  const [fontePagadora, setFontePagadora] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    
    // 🔒 VALIDAÇÕES DE SEGURANÇA
    
    // Validar item/descrição
    if (!item || item.trim().length < 3) {
      setStatus('⚠️ Descrição do item deve ter pelo menos 3 caracteres.');
      return;
    }
    
    // Validar tipo de despesa
    if (!tipo) {
      setStatus('⚠️ Selecione o tipo de despesa.');
      return;
    }

    // Se escolheu "Outros", validar tipo customizado
    if (tipo === 'Outros' && (!tipoCustomizado || tipoCustomizado.trim().length < 3)) {
      setStatus('⚠️ Especifique o tipo de despesa (mínimo 3 caracteres).');
      return;
    }

    // Determinar tipo final
    const tipoFinal = tipo === 'Outros' ? tipoCustomizado.trim() : tipo;
    
    // Validar valor
    if (!valor || valor <= 0) {
      setStatus('⚠️ O valor deve ser maior que zero.');
      return;
    }
    
    if (valor > 500000) {
      setStatus('⚠️ Valor muito alto. Para despesas acima de R$ 500.000, confirme com o administrador.');
      return;
    }
    
    // Validar data de pagamento
    if (dataPagamento) {
      const hoje = new Date();
      const dataPag = new Date(dataPagamento);
      const diffDias = (dataPag.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDias > 365) {
        setStatus('⚠️ Data de pagamento não pode ser superior a 1 ano.');
        return;
      }
      
      if (diffDias < -30) {
        setStatus('⚠️ Data de pagamento não pode ser anterior a 30 dias.');
        return;
      }
    }
    
    // Validar fonte pagadora quando marcado como pago
    if (pago && !fontePagadora) {
      setStatus('⚠️ Selecione a fonte pagadora quando marcar como pago.');
      return;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setStatus('Faça login para salvar.');
      return;
    }
    
    const { error } = await supabase.from('despesas').insert([
      {
        user_id: userId,
        item,
        tipo: tipoFinal,
        data,
        valor: typeof valor === 'string' && valor === '' ? 0 : Number(valor),
        pago,
        // pagador não existe na tabela despesas, apenas em entradas
        fonte_pagadora: fontePagadora || null,
        data_pagamento: dataPagamento || null,
      },
    ]);
    
    if (error) {
      setStatus(`Erro: ${error.message}`);
      return;
    }

    // Se despesa paga por PH ou DICO, adicionar como investimento
    const fontePagadoraUpper = fontePagadora?.toUpperCase();
    if (pago && (fontePagadoraUpper === 'PH' || fontePagadoraUpper === 'DICO')) {
      const { error: ajusteError } = await supabase.from('ajustes_banco').insert([
        {
          user_id: userId,
          tipo: 'entrada',
          valor: typeof valor === 'string' && valor === '' ? 0 : Number(valor),
          motivo: `Despesa ${fontePagadoraUpper} - ${item} (automático)`,
        },
      ]);
      
      if (ajusteError) {
        console.warn('Erro ao criar ajuste para despesa:', ajusteError.message);
      } else {
        console.log(`✅ Investimento criado para despesa ${fontePagadoraUpper}: R$ ${valor}`);
      }
    }
    
    setStatus('Salvo com sucesso.');
    setItem('');
    setTipo('');
    setTipoCustomizado('');
    setData(format(new Date(), 'yyyy-MM-dd'));
    setValor('');
    setPago(false);
    setFontePagadora('');
    setDataPagamento('');
  }

  return (
    <div>
      <Nav />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">Despesas</h1>
        <form onSubmit={salvar} className="grid gap-3 max-w-lg">
          <label className="grid gap-1">
            <span>Item</span>
            <input 
              value={item} 
              onChange={(e) => setItem(e.target.value)} 
              className="border rounded px-3 py-2" 
              placeholder="Descrição do item/despesa (min. 3 caracteres)"
              minLength={3}
              maxLength={200}
              required 
            />
          </label>
          <label className="grid gap-1">
            <span>📋 Tipo de Despesa (OBRIGATÓRIO!) *</span>
            <select 
              value={tipo === TIPOS_EMAIL_CUSTOMIZADO ? 'Outros' : tipo} 
              onChange={(e) => setTipo(e.target.value)} 
              className="border rounded px-3 py-2 text-red-600 font-bold" 
              required
            >
              <option value="">❌ Selecionar tipo OBRIGATÓRIO...</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="Outros">Outros (especificar)</option>
            </select>
          </label>
          
          {tipo === 'Outros' && (
            <label className="grid gap-1">
              <span>Especificar tipo *</span>
              <input
                type="text"
                value={tipoCustomizado}
                onChange={(e) => setTipoCustomizado(e.target.value)}
                className="border rounded px-3 py-2"
                placeholder="Digite o tipo de despesa"
                required={tipo === 'Outros'}
              />
            </label>
          )}
          
          <label className="grid gap-1">
            <span>🗓️ Data de Hoje (Automática) 🗓️</span>
            <input 
              type="date" 
              value={data} 
              readOnly 
              className="border rounded px-3 py-2 bg-gray-200 cursor-not-allowed" 
              disabled 
              style={{pointerEvents: 'none', userSelect: 'none'}}
            />
          </label>
          <label className="grid gap-1">
            <span>Fonte Pagadora</span>
            <select 
              value={fontePagadora} 
              onChange={(e) => setFontePagadora(e.target.value)} 
              className="border rounded px-3 py-2"
            >
              <option value="">Selecione...</option>
              <option value="PH">PH</option>
              <option value="EM">EM</option>
              <option value="DICO">DICO</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span>Valor</span>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              max="500000"
              value={valor} 
              onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))} 
              className="border rounded px-3 py-2" 
              placeholder="Ex: 150.00"
              required 
            />
          </label>
          <label className="grid gap-1">
            <span>Data para Pagamento</span>
            <input 
              type="date" 
              value={dataPagamento} 
              onChange={(e) => setDataPagamento(e.target.value)} 
              className="border rounded px-3 py-2" 
              placeholder="Data prevista para pagamento"
            />
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} />
            <span>Pago</span>
          </label>
          
          {/* Campo pagador não existe na tabela despesas, apenas fonte_pagadora */}
          
          <button className="bg-black text-white rounded px-3 py-2 w-fit">Salvar</button>
          {status && <p className="text-sm">{status}</p>}
        </form>
      </main>
    </div>
  );
}
