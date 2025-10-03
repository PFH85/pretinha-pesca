'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Nav } from '@/components/Nav';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function BancoPage() {
  const supabase = getSupabaseClient();
  // Removidas as variáveis não utilizadas
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [loading, setLoading] = useState(false);
  const [entradas, setEntradas] = useState<Record<string, unknown>[]>([]);
  const [despesas, setDespesas] = useState<Record<string, unknown>[]>([]);
  const [ajustes, setAjustes] = useState<Record<string, unknown>[]>([]);
  const [entradasPendentes, setEntradasPendentes] = useState<Record<string, unknown>[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    // Removida a função filtros não utilizada

    // Apenas entradas pagas pela empresa (EM) - não PH/DICO (que são investimentos)
    const e = await supabase
      .from('entradas')
      .select('*')
      .eq('pago', true)
      .or('pagador.eq.EM,pagador.is.null') // EM ou null (dados antigos)
      .order('data', { ascending: false });

    // Apenas despesas pagas pela empresa (EM) - não PH/DICO (que são investimentos)
    const d = await supabase
      .from('despesas')
      .select('*')
      .eq('pago', true)
      .or('fonte_pagadora.eq.EM,fonte_pagadora.is.null') // EM ou null (dados antigos)
      .order('data', { ascending: false });

    const a = await supabase
      .from('ajustes_banco')
      .select('*')
      .order('created_at', { ascending: false });

    // Buscar entradas PH/DICO pendentes para criar linha no banco
    const ep = await supabase
      .from('entradas')
      .select('*')
      .eq('pago', false)
      .or('pagador.eq.PH,pagador.eq.DICO,pagador.eq.ph,pagador.eq.dico')
      .order('data', { ascending: false });

    setEntradas(e.data || []);
    setDespesas(d.data || []);
    setAjustes(a.data || []);
    setEntradasPendentes(ep.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  // Função para criar linha automaticamente no banco
  async function criarLinhaBanco(entrada: Record<string, unknown>) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      alert('❌ Erro: Usuário não autenticado.');
      return;
    }

    const confirmacao = confirm(
      `💰 Criar linha no banco para entrada ${entrada.cliente_nome}?\n\n` +
      `Valor: R$ ${Number(entrada.valor).toLocaleString('pt-BR')}\n` +
      `Pagador: ${entrada.pagador}\n\n` +
      `Isso criará uma entrada no caixa da empresa.`
    );

    if (!confirmacao) return;

    // Criar entrada no banco
    const { error } = await supabase.from('ajustes_banco').insert([{
      user_id: userId,
      tipo: 'entrada',
      valor: entrada.valor,
      motivo: `EM - Caixa da empresa (${entrada.pagador})`
    }]);

    if (error) {
      alert(`❌ Erro ao criar linha no banco: ${error.message}`);
    } else {
      alert(`✅ Linha criada no banco com sucesso!`);
      await carregar(); // Recarregar dados
    }
  }

  const entradasFiltradas = useMemo(() => entradas.filter((x) => (!de || (x.data as string) >= de) && (!ate || (x.data as string) <= ate)), [entradas, de, ate]);
  const despesasFiltradas = useMemo(() => despesas.filter((x) => (!de || (x.data as string) >= de) && (!ate || (x.data as string) <= ate)), [despesas, de, ate]);
  const ajustesFiltrados = useMemo(() => ajustes.filter((x) => {
    const d = (x.created_at as string)?.slice(0,10);
    return (!de || d >= de) && (!ate || d <= ate);
  }), [ajustes, de, ate]);

  // Saldo inicial fixo + apenas movimentações novas (criadas após hoje)
  const SALDO_INICIAL = 2508.43;
  const dataCorte = '2025-01-02'; // Data a partir da qual considerar movimentações
  
  // Filtrar apenas entradas/despesas criadas após a data de corte
  const entradasNovas = entradasFiltradas.filter(e => (e.data as string) >= dataCorte);
  const despesasNovas = despesasFiltradas.filter(d => (d.data as string) >= dataCorte);
  
  // Incluir ajustes de banco no cálculo do saldo
  const ajustesEntradas = ajustesFiltrados.filter(a => 
    (a.tipo as string) === 'entrada' && 
    (a.motivo as string)?.includes('EM Caixa empresa')
  );
  const ajustesSaidas = ajustesFiltrados.filter(a => 
    (a.tipo as string) === 'saida' && 
    (a.motivo as string)?.includes('EM')
  );
  
  const somaEntradasNovas = entradasNovas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
  const somaDespesasNovas = despesasNovas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
  const somaAjustesEntradas = ajustesEntradas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
  const somaAjustesSaidas = ajustesSaidas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
  
  const saldoAtual = SALDO_INICIAL + somaEntradasNovas - somaDespesasNovas + somaAjustesEntradas - somaAjustesSaidas;

  function toCSV(values: string[]): string {
    return values
      .map((v) => {
        const s = v ?? '';
        if (s.includes(',') || s.includes('\n') || s.includes('"')) {
          return '"' + s.replaceAll('"', '""') + '"';
        }
        return s;
      })
      .join(',');
  }

  function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const headerLine = toCSV(headers);
    const lines = [headerLine, ...rows.map((r) => toCSV(r))].join('\n');
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportEntradasCSV() {
    const headers = ['id', 'data', 'valor', 'previsao', 'pago'];
    const rows = entradasFiltradas.map((e: Record<string, unknown>) => [
      String(e.id || ''),
      String(e.data || ''),
      String(e.valor ?? ''),
      String(e.previsao || ''),
      String(e.pago ? 'true' : 'false'),
    ]);
    downloadCSV('entradas_pagas.csv', headers, rows);
  }

  function exportDespesasCSV() {
    const headers = ['id', 'data', 'item', 'tipo', 'valor', 'pago'];
    const rows = despesasFiltradas.map((d: Record<string, unknown>) => [
      String(d.id || ''),
      String(d.data || ''),
      String(d.item || ''),
      String(d.tipo || ''),
      String(d.valor ?? ''),
      String(d.pago ? 'true' : 'false'),
    ]);
    downloadCSV('despesas_pagas.csv', headers, rows);
  }

  function exportAjustesCSV() {
    const headers = ['id', 'created_at', 'tipo', 'valor', 'motivo'];
    const rows = ajustesFiltrados.map((a: Record<string, unknown>) => [
      String(a.id || ''),
      String(a.created_at || ''),
      String(a.tipo || ''),
      String(a.valor ?? ''),
      String(a.motivo || ''),
    ]);
    downloadCSV('ajustes.csv', headers, rows);
  }

  function exportConsolidadoCSV() {
    const headers = ['origem', 'id', 'data', 'tipo', 'item', 'valor', 'observacao'];
    const rows: string[][] = [];
    entradasFiltradas.forEach((e: Record<string, unknown>) => {
      rows.push(['entrada', String(e.id || ''), String(e.data || ''), 'pago', '', String(e.valor ?? ''), `previsao:${e.previsao || ''}`]);
    });
    despesasFiltradas.forEach((d: Record<string, unknown>) => {
      rows.push(['despesa', String(d.id || ''), String(d.data || ''), 'pago', String(d.item || ''), String(d.valor ?? ''), String(d.tipo || '')]);
    });
    ajustesFiltrados.forEach((a: Record<string, unknown>) => {
      rows.push(['ajuste', String(a.id || ''), String(a.created_at || ''), String(a.tipo || ''), '', String(a.valor ?? ''), String(a.motivo || '')]);
    });
    downloadCSV('consolidado.csv', headers, rows);
  }

  return (
    <div>
      <Nav />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">Banco</h1>
        
        {/* Saldo Atual */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800">Saldo Atual da Empresa</h2>
          <p className="text-3xl font-bold text-blue-600">
            R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-blue-600">
            (Saldo inicial: R$ {SALDO_INICIAL.toFixed(2)} + movimentações novas)
          </p>
          <p className="text-xs text-blue-500 mt-2">
            ⚠️ Mostra apenas movimentações pagas pela empresa (EM). 
            Pagamentos PH/DICO são contabilizados na aba Investimentos.
          </p>
        </div>

        {/* Entradas PH/DICO Pendentes */}
        {entradasPendentes.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-3">
              💰 Entradas PH/DICO Pendentes - Criar Linha no Banco
            </h2>
            <div className="space-y-2">
              {entradasPendentes.map((entrada: Record<string, unknown>) => (
                <div key={entrada.id as string} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex-1">
                    <span className="font-medium">{entrada.cliente_nome as string}</span>
                    <span className="text-gray-500 ml-2">({entrada.pagador as string})</span>
                    <span className="text-green-600 font-bold ml-4">
                      R$ {Number(entrada.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">
                      - {new Date(entrada.data as string).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <button
                    onClick={() => criarLinhaBanco(entrada)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    📝 Criar Linha no Banco
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              💡 Clique em "Criar Linha no Banco" para adicionar automaticamente ao caixa da empresa
            </p>
          </div>
        )}

        <div className="flex gap-3 items-end">
          <label className="grid gap-1">
            <span>De</span>
            <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="border rounded px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span>Até</span>
            <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="border rounded px-3 py-2" />
          </label>
          <button onClick={carregar} className="bg-black text-white rounded px-3 py-2">Atualizar</button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={exportEntradasCSV} className="border rounded px-3 py-2">Exportar Entradas (CSV)</button>
          <button onClick={exportDespesasCSV} className="border rounded px-3 py-2">Exportar Despesas (CSV)</button>
          <button onClick={exportAjustesCSV} className="border rounded px-3 py-2">Exportar Ajustes (CSV)</button>
          <button onClick={exportConsolidadoCSV} className="border rounded px-3 py-2">Exportar Consolidado (CSV)</button>
        </div>


        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-medium">Entradas pagas pela empresa (EM)</h2>
            <table className="w-full border text-sm">
              <thead><tr className="bg-gray-50"><th className="border px-2 py-1 text-left">Data</th><th className="border px-2 py-1 text-left">Descrição</th><th className="border px-2 py-1 text-right">Valor</th></tr></thead>
              <tbody>
                {entradasNovas.map((e: Record<string, unknown>) => (
                  <tr key={e.id as string}>
                    <td className="border px-2 py-1">{e.data as string}</td>
                    <td className="border px-2 py-1">{(e.cliente_nome as string) || 'Entrada sem descrição'}</td>
                    <td className="border px-2 py-1 text-right">{Number(e.valor).toFixed(2)}</td>
                  </tr>
                ))}
                {ajustesEntradas.map((a: Record<string, unknown>) => (
                  <tr key={`ajuste-${a.id as string}`}>
                    <td className="border px-2 py-1">{new Date(a.created_at as string).toLocaleDateString('pt-BR')}</td>
                    <td className="border px-2 py-1">{(a.motivo as string) || 'Ajuste de banco'}</td>
                    <td className="border px-2 py-1 text-right">{Number(a.valor).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-medium"><td className="border px-2 py-1">Total</td><td className="border px-2 py-1"></td><td className="border px-2 py-1 text-right">{(somaEntradasNovas + somaAjustesEntradas).toFixed(2)}</td></tr></tfoot>
            </table>
          </div>
          <div>
            <h2 className="font-medium">Despesas pagas pela empresa (EM)</h2>
            <table className="w-full border text-sm">
              <thead><tr className="bg-gray-50"><th className="border px-2 py-1 text-left">Data</th><th className="border px-2 py-1 text-left">Descrição</th><th className="border px-2 py-1 text-right">Valor</th></tr></thead>
              <tbody>
                {despesasNovas.map((d: Record<string, unknown>) => (
                  <tr key={d.id as string}>
                    <td className="border px-2 py-1">{d.data as string}</td>
                    <td className="border px-2 py-1">
                      {d.item as string}
                      {(d.fonte_pagadora as string) && ` (${d.fonte_pagadora as string})`}
                      {!(d.fonte_pagadora as string) && (d.pagador as string) && ` (${d.pagador as string})`}
                    </td>
                    <td className="border px-2 py-1 text-right">{Number(d.valor).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-medium"><td className="border px-2 py-1">Total</td><td className="border px-2 py-1"></td><td className="border px-2 py-1 text-right">{somaDespesasNovas.toFixed(2)}</td></tr></tfoot>
            </table>
          </div>
        </div>


        {loading && <p>Carregando...</p>}
      </main>
    </div>
  );
}
