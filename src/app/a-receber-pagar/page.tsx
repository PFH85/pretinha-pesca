'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Nav } from '@/components/Nav';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function AReceberPagarPage() {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [entradas, setEntradas] = useState<Record<string, unknown>[]>([]);
  const [despesas, setDespesas] = useState<Record<string, unknown>[]>([]);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);

    // Buscar entradas NÃO pagas
    const e = await supabase
      .from('entradas')
      .select('*')
      .eq('pago', false)
      .order('data', { ascending: true });

    // Buscar despesas NÃO pagas
    const d = await supabase
      .from('despesas')
      .select('*')
      .eq('pago', false)
      .order('data_pagamento', { ascending: true, nullsFirst: false });

    setEntradas(e.data || []);
    setDespesas(d.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { carregar(); }, [carregar]);

  // Filtrar por data
  const entradasFiltradas = useMemo(() => 
    entradas.filter((x) => (!de || x.data >= de) && (!ate || x.data <= ate)), 
    [entradas, de, ate]
  );
  
  const despesasFiltradas = useMemo(() => 
    despesas.filter((x) => (!de || x.data >= de) && (!ate || x.data <= ate)), 
    [despesas, de, ate]
  );

  // Calcular totais
  const totalAReceber = entradasFiltradas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
  const totalAPagar = despesasFiltradas.reduce((acc, i) => acc + Number(i.valor || 0), 0);
  const saldoLiquido = totalAReceber - totalAPagar;

  // Função para marcar como pago
  async function marcarComoPago(tipo: 'entrada' | 'despesa', id: string) {
    const tabela = tipo === 'entrada' ? 'entradas' : 'despesas';
    
    const { error } = await supabase
      .from(tabela)
      .update({ pago: true })
      .eq('id', id);

    if (error) {
      alert(`Erro ao marcar como pago: ${error.message}`);
      return;
    }

    await carregar(); // Recarregar dados
  }

  if (loading) {
    return (
      <div>
        <Nav />
        <main className="max-w-7xl mx-auto p-4">
          <p>Carregando...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold">A Receber / A Pagar</h1>

        {/* Filtros de Data */}
        <div className="flex gap-3 items-end">
          <label className="grid gap-1">
            <span>De</span>
            <input 
              type="date" 
              value={de} 
              onChange={(e) => setDe(e.target.value)} 
              className="border rounded px-3 py-2" 
            />
          </label>
          <label className="grid gap-1">
            <span>Até</span>
            <input 
              type="date" 
              value={ate} 
              onChange={(e) => setAte(e.target.value)} 
              className="border rounded px-3 py-2" 
            />
          </label>
          <button 
            onClick={carregar} 
            className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
          >
            Atualizar
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800">Total A Receber</h3>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800">Total A Pagar</h3>
            <p className="text-2xl font-bold text-red-600">
              R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className={`border rounded-lg p-4 ${saldoLiquido >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <h3 className={`font-semibold ${saldoLiquido >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              Saldo Líquido
            </h3>
            <p className={`text-2xl font-bold ${saldoLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Tabelas lado a lado */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* A Receber */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-green-700">
              A Receber ({entradasFiltradas.length})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="border-b px-3 py-2 text-left">Data</th>
                    <th className="border-b px-3 py-2 text-left">Cliente</th>
                    <th className="border-b px-3 py-2 text-right">Valor</th>
                    <th className="border-b px-3 py-2 text-left">Previsão</th>
                    <th className="border-b px-3 py-2 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {entradasFiltradas.map((entrada, index) => (
                    <tr key={entrada.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border-b px-3 py-2">
                        {new Date(entrada.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="border-b px-3 py-2">
                        {entrada.cliente_nome || 'Sem nome'}
                      </td>
                      <td className="border-b px-3 py-2 text-right font-medium">
                        R$ {Number(entrada.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border-b px-3 py-2">
                        {entrada.previsao ? new Date(entrada.previsao).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="border-b px-3 py-2 text-center">
                        <button
                          onClick={() => marcarComoPago('entrada', entrada.id)}
                          className="bg-green-600 text-white rounded px-2 py-1 text-xs hover:bg-green-700"
                        >
                          Recebido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {entradasFiltradas.length > 0 && (
                  <tfoot className="bg-green-100">
                    <tr>
                      <td className="border-t px-3 py-2 font-semibold" colSpan={2}>Total</td>
                      <td className="border-t px-3 py-2 text-right font-bold">
                        R$ {totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border-t px-3 py-2" colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
              
              {entradasFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  <p>Nenhuma entrada a receber</p>
                </div>
              )}
            </div>
          </div>

          {/* A Pagar */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-red-700">
              A Pagar ({despesasFiltradas.length})
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="border-b px-3 py-2 text-left">Data</th>
                    <th className="border-b px-3 py-2 text-left">Item</th>
                    <th className="border-b px-3 py-2 text-right">Valor</th>
                    <th className="border-b px-3 py-2 text-left">Vencimento</th>
                    <th className="border-b px-3 py-2 text-left">Fonte</th>
                    <th className="border-b px-3 py-2 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {despesasFiltradas.map((despesa, index) => (
                    <tr key={despesa.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border-b px-3 py-2">
                        {new Date(despesa.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="border-b px-3 py-2">
                        {despesa.item}
                      </td>
                      <td className="border-b px-3 py-2 text-right font-medium">
                        R$ {Number(despesa.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border-b px-3 py-2 text-xs">
                        {despesa.data_pagamento ? new Date(despesa.data_pagamento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="border-b px-3 py-2 text-xs">
                        {despesa.fonte_pagadora || despesa.tipo || '-'}
                      </td>
                      <td className="border-b px-3 py-2 text-center">
                        <button
                          onClick={() => marcarComoPago('despesa', despesa.id)}
                          className="bg-red-600 text-white rounded px-2 py-1 text-xs hover:bg-red-700"
                        >
                          Pago
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {despesasFiltradas.length > 0 && (
                  <tfoot className="bg-red-100">
                    <tr>
                      <td className="border-t px-3 py-2 font-semibold" colSpan={2}>Total</td>
                      <td className="border-t px-3 py-2 text-right font-bold">
                        R$ {totalAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border-t px-3 py-2" colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
              
              {despesasFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  <p>Nenhuma despesa a pagar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
