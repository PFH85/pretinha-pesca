'use client';
import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { format } from 'date-fns';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function EntradasPage() {
  const supabase = getSupabaseClient();
  const [valor, setValor] = useState<number | ''>('');
  const [previsao, setPrevisao] = useState<string>('');
  const [pago, setPago] = useState(false);
  const [pagador, setPagador] = useState('EM');
  const [cliente, setCliente] = useState('');
  const [contato, setContato] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const hoje = format(new Date(), 'yyyy-MM-dd');

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    
    // 🔒 VALIDAÇÕES DE SEGURANÇA
    
    // Validar valor
    if (!valor || valor <= 0) {
      setStatus('⚠️ O valor deve ser maior que zero.');
      return;
    }
    
    if (valor > 1000000) {
      setStatus('⚠️ Valor muito alto. Para valores acima de R$ 1.000.000, confirme com o administrador.');
      return;
    }
    
    // Validar cliente
    if (!cliente || cliente.trim().length < 2) {
      setStatus('⚠️ Nome do cliente deve ter pelo menos 2 caracteres.');
      return;
    }
    
    // Validar data de previsão
    if (previsao) {
      const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dataPrevisao = previsao;
      
      // Não permitir data anterior a hoje
      if (dataPrevisao < hoje) {
        setStatus('⚠️ Data de previsão não pode ser anterior a hoje.');
        return;
      }
      
      // Não permitir data superior a 1 ano
      const hojeObj = new Date();
      const dataPrevisaoObj = new Date(previsao);
      const diffDias = (dataPrevisaoObj.getTime() - hojeObj.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDias > 365) {
        setStatus('⚠️ Data de previsão não pode ser superior a 1 ano.');
        return;
      }
    }
    
    // Pagador sempre preenchido (pré-definido como EM)

    // 🔒 VALIDAÇÃO CRÍTICA: Só pode marcar "Pago" se previsão = hoje
    if (pago && previsao) {
      const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      if (previsao !== hoje) {
        setStatus('⚠️ Só é possível marcar como "Pago" se a data de previsão for hoje!');
        return;
      }
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setStatus('Faça login para salvar.');
      return;
    }
    
    const { error } = await supabase.from('entradas').insert([
      {
        user_id: userId,
        valor: typeof valor === 'string' && valor === '' ? 0 : Number(valor),
        data: hoje,
        previsao: previsao || null,
        pago,
        pagador: pagador || null,
        cliente_nome: cliente || null,
        contato: contato || null,
      },
    ]);
    
    if (error) {
      setStatus(`Erro: ${error.message}`);
      return;
    }

    // Se marcou como pago e pagador é PH/DICO, criar investimento e banco
    if (pago && (pagador === 'PH' || pagador === 'DICO' || pagador === 'ph' || pagador === 'dico')) {
      try {
        const { error: ajusteError } = await supabase.from('ajustes_banco').insert([{
          user_id: userId,
          tipo: 'entrada',
          valor: typeof valor === 'string' && valor === '' ? 0 : Number(valor),
          motivo: `${pagador} - Investimento + EM Caixa empresa`
        }]);
        
        if (ajusteError) {
          console.error('❌ Erro ao criar investimento/banco:', ajusteError);
          setStatus(`⚠️ Entrada salva, mas erro ao criar investimento: ${ajusteError.message}`);
        } else {
          setStatus('✅ Entrada salva e investimento/banco criados com sucesso!');
        }
      } catch (error) {
        console.error('❌ Erro geral:', error);
        setStatus(`⚠️ Entrada salva, mas erro ao criar investimento: ${error}`);
      }
    } else {
      setStatus('Salvo com sucesso.');
    }
    setValor('');
    setPrevisao('');
    setPago(false);
    setPagador('EM');
    setCliente('');
    setContato('');
  }

  return (
    <div>
      <Nav />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">Entradas</h1>
        <form onSubmit={salvar} className="grid gap-3 max-w-lg">
          <label className="grid gap-1">
            <span>Cliente</span>
            <input
              placeholder="Nome do cliente (min. 2 caracteres)"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="border rounded px-3 py-2"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label className="grid gap-1">
            <span>Contato</span>
            <input
              placeholder="Telefone, WhatsApp ou email"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </label>
          <label className="grid gap-1">
            <span>Valor</span>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              max="1000000"
              value={valor} 
              onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))} 
              className="border rounded px-3 py-2" 
              placeholder="Ex: 1500.00"
              required 
            />
          </label>
          <label className="grid gap-1">
            <span>🗓️ Data de Hoje (Automática) 🗓️</span>
            <input 
              type="date" 
              value={hoje} 
              readOnly 
              className="border rounded px-3 py-2 bg-gray-200 cursor-not-allowed" 
              disabled 
              style={{pointerEvents: 'none', userSelect: 'none'}}
            />
          </label>
          <label className="grid gap-1">
            <span>Previsão de recebimento</span>
            <input 
              type="date" 
              value={previsao} 
              onChange={(e) => setPrevisao(e.target.value)} 
              className="border rounded px-3 py-2" 
              min={new Date().toISOString().split('T')[0]}
            />
          </label>
          
          <label className="grid gap-1">
            <span>Quem fará o pagamento? *</span>
            <select 
              value={pagador} 
              onChange={(e) => setPagador(e.target.value)} 
              className="border rounded px-3 py-2"
              required
            >
              <option value="EM">EM</option>
              <option value="PH">PH</option>
              <option value="DICO">DICO</option>
            </select>
          </label>
          
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={pago} onChange={(e) => setPago(e.target.checked)} />
            <span>Pago</span>
          </label>
          
          <button className="bg-black text-white rounded px-3 py-2 w-fit">Salvar</button>
          {status && <p className="text-sm">{status}</p>}
        </form>
      </main>
    </div>
  );
}
