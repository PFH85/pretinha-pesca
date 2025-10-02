'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Nav } from '@/components/Nav';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function AdminPage() {
  const supabase = getSupabaseClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<Record<string, unknown>[]>([]);
  const [despesas, setDespesas] = useState<Record<string, unknown>[]>([]);
  const [ajustes, setAjustes] = useState<Record<string, unknown>[]>([]);
  const [mostrarTodasEntradas, setMostrarTodasEntradas] = useState(false);
  const [mostrarTodasDespesas, setMostrarTodasDespesas] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) { setAuthorized(false); return; }
      const { data: prof } = await supabase.from('profiles').select('is_master').eq('id', uid).maybeSingle();
      setAuthorized(!!prof?.is_master);
    })();
  }, [supabase]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    const e = await supabase.from('entradas').select('*').order('data', { ascending: false });
    const d = await supabase.from('despesas').select('*').order('data', { ascending: false });
    const a = await supabase.from('ajustes_banco').select('*').order('created_at', { ascending: false });
    setEntradas(e.data || []);
    setDespesas(d.data || []);
    setAjustes(a.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { if (authorized) carregar(); }, [authorized, carregar]);

  // Filtrar e manter ordenação por data mais recente
  const entradasFiltradas = useMemo(() => {
    return entradas
      .filter((x) => (!de || x.data >= de) && (!ate || x.data <= ate))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [entradas, de, ate]);
  
  const despesasFiltradas = useMemo(() => {
    return despesas
      .filter((x) => (!de || x.data >= de) && (!ate || x.data <= ate))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [despesas, de, ate]);
  
  const ajustesFiltrados = useMemo(() => {
    return ajustes
      .filter((x) => { 
        const d = x.created_at?.slice(0,10); 
        return (!de || d >= de) && (!ate || d <= ate); 
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ajustes, de, ate]);

  // Arrays limitados para visualização inicial (últimas 10)
  const entradasParaMostrar = useMemo(() => {
    return mostrarTodasEntradas ? entradasFiltradas : entradasFiltradas.slice(0, 10);
  }, [entradasFiltradas, mostrarTodasEntradas]);

  const despesasParaMostrar = useMemo(() => {
    return mostrarTodasDespesas ? despesasFiltradas : despesasFiltradas.slice(0, 10);
  }, [despesasFiltradas, mostrarTodasDespesas]);

  async function salvarLinha(tabela: 'entradas'|'despesas'|'ajustes_banco', id: string, payload: Record<string, unknown>) {
    setMsg(null);
    const { error } = await supabase.from(tabela).update(payload).eq('id', id);
    if (error) { setMsg(`Erro ao salvar: ${error.message}`); return; }
    setMsg('Alterações salvas.');
    await carregar();
  }

  async function excluirLinha(tabela: 'entradas'|'despesas'|'ajustes_banco', id: string) {
    // 🔒 CONFIRMAÇÃO DE SEGURANÇA
    const confirmacao = window.confirm(
      '⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\n' +
      'Tem certeza que deseja excluir este registro?\n\n' +
      '• Se for uma entrada/despesa PH/DICO, também será removida dos investimentos\n' +
      '• Esta ação afetará o saldo do banco\n\n' +
      'Confirma a exclusão?'
    );
    
    if (!confirmacao) {
      return; // Usuário cancelou
    }
    
    setMsg(null);
    const { error } = await supabase.from(tabela).delete().eq('id', id);
    if (error) { setMsg(`Erro ao excluir: ${error.message}`); return; }
    setMsg('✅ Registro excluído com sucesso.');
    await carregar();
  }

  if (authorized === null) {
    return (
      <div>
        <Nav />
        <main className="max-w-5xl mx-auto p-4">Verificando permissão...</main>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div>
        <Nav />
        <main className="max-w-5xl mx-auto p-4">Acesso restrito ao Master.</main>
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <main className="max-w-6xl mx-auto p-4 space-y-5">
        <h1 className="text-xl font-semibold">Admin (Master)</h1>

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
        {msg && <p className="text-sm">{msg}</p>}

        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">Entradas</h2>
            <div className="flex gap-2 items-center text-sm">
              <span className="text-gray-600">
                Mostrando {entradasParaMostrar.length} de {entradasFiltradas.length}
              </span>
              {entradasFiltradas.length > 10 && (
                <button
                  onClick={() => setMostrarTodasEntradas(!mostrarTodasEntradas)}
                  className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
                >
                  {mostrarTodasEntradas ? 'Mostrar apenas 10' : 'Mostrar todas'}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1 text-left">Data</th>
                  <th className="border px-2 py-1">Cliente</th>
                  <th className="border px-2 py-1">Contato</th>
                  <th className="border px-2 py-1 text-right">Valor</th>
                  <th className="border px-2 py-1">Previsão</th>
                  <th className="border px-2 py-1">Pago</th>
                  <th className="border px-2 py-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {entradasParaMostrar.map((e: Record<string, unknown>) => (
                  <tr key={e.id}>
                    <td className="border px-2 py-1"><input type="date" className="border rounded px-2 py-1" value={e.data || ''} onChange={(ev) => e.data = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={e.cliente_nome || ''} onChange={(ev) => e.cliente_nome = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={e.contato || ''} onChange={(ev) => e.contato = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input type="number" step="0.01" className="border rounded px-2 py-1 text-right" value={e.valor ?? ''} onChange={(ev) => e.valor = ev.target.value === '' ? null : Number(ev.target.value)} /></td>
                    <td className="border px-2 py-1"><input type="date" className="border rounded px-2 py-1" value={e.previsao || ''} onChange={(ev) => e.previsao = ev.target.value} /></td>
                    <td className="border px-2 py-1 text-center"><input type="checkbox" checked={!!e.pago} onChange={(ev) => e.pago = ev.target.checked} /></td>
                    <td className="border px-2 py-1 space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => salvarLinha('entradas', e.id, { data: e.data, cliente_nome: e.cliente_nome || null, contato: e.contato || null, valor: e.valor, previsao: e.previsao || null, pago: !!e.pago })}>Salvar</button>
                      <button className="border rounded px-2 py-1" onClick={() => excluirLinha('entradas', e.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">Despesas</h2>
            <div className="flex gap-2 items-center text-sm">
              <span className="text-gray-600">
                Mostrando {despesasParaMostrar.length} de {despesasFiltradas.length}
              </span>
              {despesasFiltradas.length > 10 && (
                <button
                  onClick={() => setMostrarTodasDespesas(!mostrarTodasDespesas)}
                  className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
                >
                  {mostrarTodasDespesas ? 'Mostrar apenas 10' : 'Mostrar todas'}
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1 text-left">Data</th>
                  <th className="border px-2 py-1">Item</th>
                  <th className="border px-2 py-1">Tipo</th>
                  <th className="border px-2 py-1 text-right">Valor</th>
                  <th className="border px-2 py-1">Pago</th>
                  <th className="border px-2 py-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {despesasParaMostrar.map((d: Record<string, unknown>) => (
                  <tr key={d.id}>
                    <td className="border px-2 py-1"><input type="date" className="border rounded px-2 py-1" value={d.data || ''} onChange={(ev) => d.data = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={d.item || ''} onChange={(ev) => d.item = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={d.tipo || ''} onChange={(ev) => d.tipo = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input type="number" step="0.01" className="border rounded px-2 py-1 text-right" value={d.valor ?? ''} onChange={(ev) => d.valor = ev.target.value === '' ? null : Number(ev.target.value)} /></td>
                    <td className="border px-2 py-1 text-center"><input type="checkbox" checked={!!d.pago} onChange={(ev) => d.pago = ev.target.checked} /></td>
                    <td className="border px-2 py-1 space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => salvarLinha('despesas', d.id, { data: d.data, item: d.item, tipo: d.tipo, valor: d.valor, pago: !!d.pago })}>Salvar</button>
                      <button className="border rounded px-2 py-1" onClick={() => excluirLinha('despesas', d.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-medium">Ajustes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1 text-left">Data</th>
                  <th className="border px-2 py-1">Tipo</th>
                  <th className="border px-2 py-1 text-right">Valor</th>
                  <th className="border px-2 py-1">Motivo</th>
                  <th className="border px-2 py-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ajustesFiltrados.map((a: Record<string, unknown>) => (
                  <tr key={a.id}>
                    <td className="border px-2 py-1">{a.created_at?.slice(0,10)}</td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={a.tipo || ''} onChange={(ev) => a.tipo = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input type="number" step="0.01" className="border rounded px-2 py-1 text-right" value={a.valor ?? ''} onChange={(ev) => a.valor = ev.target.value === '' ? null : Number(ev.target.value)} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={a.motivo || ''} onChange={(ev) => a.motivo = ev.target.value} /></td>
                    <td className="border px-2 py-1 space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => salvarLinha('ajustes_banco', a.id, { tipo: a.tipo, valor: a.valor, motivo: a.motivo || null })}>Salvar</button>
                      <button className="border rounded px-2 py-1" onClick={() => excluirLinha('ajustes_banco', a.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {loading && <p>Carregando...</p>}
      </main>
    </div>
  );
}
