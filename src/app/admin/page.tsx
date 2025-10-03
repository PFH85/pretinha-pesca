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
  const [calculadoras, setCalculadoras] = useState<Record<string, unknown>[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, unknown>[]>([]);
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
    const c = await supabase.from('calculadoras_peixes').select('*').order('created_at', { ascending: false });
    // Não conseguimos acessar auth.users diretamente, então vamos usar mapeamento manual
    const u = { data: [] };
    setEntradas(e.data || []);
    setDespesas(d.data || []);
    setAjustes(a.data || []);
    setCalculadoras(c.data || []);
    setUsuarios(u.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { if (authorized) carregar(); }, [authorized, carregar]);

  // Filtrar e manter ordenação por data mais recente
  const entradasFiltradas = useMemo(() => {
    return entradas
      .filter((x) => (!de || (x.data as string) >= de) && (!ate || (x.data as string) <= ate))
      .sort((a, b) => new Date(b.data as string).getTime() - new Date(a.data as string).getTime());
  }, [entradas, de, ate]);
  
  const despesasFiltradas = useMemo(() => {
    return despesas
      .filter((x) => (!de || (x.data as string) >= de) && (!ate || (x.data as string) <= ate))
      .sort((a, b) => new Date(b.data as string).getTime() - new Date(a.data as string).getTime());
  }, [despesas, de, ate]);
  
  const ajustesFiltrados = useMemo(() => {
    return ajustes
      .filter((x) => { 
        const d = (x.created_at as string)?.slice(0,10); 
        return (!de || d >= de) && (!ate || d <= ate); 
      })
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());
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

  async function deletarCalculadora(id: string) {
    // 🔒 CONFIRMAÇÃO DE SEGURANÇA
    const confirmacao = window.confirm(
      '⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\n' +
      'Tem certeza que deseja excluir este orçamento?\n\n' +
      '• O PDF não poderá mais ser gerado\n' +
      '• Esta ação é irreversível\n\n' +
      'Confirma a exclusão?'
    );
    
    if (!confirmacao) {
      return; // Usuário cancelou
    }
    
    setMsg(null);
    const { error } = await supabase.from('calculadoras_peixes').delete().eq('id', id);
    if (error) { 
      setMsg(`Erro ao excluir orçamento: ${error.message}`); 
      return; 
    }
    setMsg('✅ Orçamento excluído com sucesso.');
    await carregar(); // Recarrega para atualizar a lista
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

  // Função para obter prefixo do email do usuário
  function getUserEmailPrefix(userId: string): string {
    // Mapeamento manual dos IDs conhecidos com prefixos reais dos emails
    const userMap: Record<string, string> = {
      '6da7dab9-b099-4fb6-9f96-45998cbdc129': 'pedro', // emailpedroheringer@gmail.com
      '5011a438-79c1-4e59-a4a1-70ee726f2117': 'guiar', // guiarodolforibeiro@gmail.com
      '832aaca6-721b-42ce-8818-e7059f1f7bd2': 'pesso', // pessoa93453@yahoo.com
      'd142e2ca-8e27-44eb-96bf-dcf3b53ef537': 'carla', // carlacampanuccy@gmail.com
    };
    
    // Se temos o ID mapeado, usa o prefixo
    if (userMap[userId]) {
      return userMap[userId];
    }
    
    // Fallback: primeiras 5 letras do ID em maiúsculo
    return userId.substring(0, 5).toUpperCase();
  }

  // Função para gerar nome único do arquivo PDF
  function generatePDFFileName(clienteNome: string): string {
    const nomeBase = `Orçamento_${clienteNome || 'Cliente'}`;
    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    return `${nomeBase}_${hoje}`;
  }

  // Função para gerar PDF da calculadora
  function gerarPDF(calc: Record<string, unknown>) {
    try {
      // Parse das linhas da calculadora
      const linhas = JSON.parse((calc.linhas as string) || '[]');
      const linhasComDados = linhas.filter((l: any) => l.peixe || l.precoKg || l.pesoKg);
      
      // Calcular totais
      const totalPeso = linhasComDados.reduce((acc: number, linha: any) => acc + (Number(linha.pesoKg) || 0), 0);
      const totalValor = linhasComDados.reduce((acc: number, linha: any) => acc + (Number(linha.precoKg) * Number(linha.pesoKg) || 0), 0);

      const hoje = new Date().toLocaleDateString('pt-BR');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${generatePDFFileName(calc.nome as string)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
            .info { margin-bottom: 15px; }
            .info div { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .total { font-weight: bold; font-size: 16px; }
            .total td { background-color: #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐟 Pretinha Pesca</h1>
            <p>${generatePDFFileName(calc.nome as string)}</p>
          </div>
          
          <div class="info">
            <div><strong>Cliente:</strong> ${(calc.nome as string) || 'Não informado'}</div>
            <div><strong>Data:</strong> ${hoje}</div>
            ${calc.data_pagamento ? `<div><strong>Pagamento Para:</strong> ${new Date(calc.data_pagamento as string).toLocaleDateString('pt-BR')}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Peixe</th>
                <th>Preço/kg</th>
                <th>Peso Total (kg)</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              ${linhasComDados.map((linha: any) => `
                <tr>
                  <td>${linha.peixe || ''}</td>
                  <td>${linha.precoKg ? 'R$ ' + Number(linha.precoKg).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}</td>
                  <td>${linha.pesoKg ? Number(linha.pesoKg).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}</td>
                  <td>${linha.precoKg && linha.pesoKg ? 'R$ ' + (Number(linha.precoKg) * Number(linha.pesoKg)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total">
                <td colspan="2">TOTAL</td>
                <td>${totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg</td>
                <td>R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            <p>Documento gerado automaticamente pela Pretinha Pesca</p>
            <p>Data: ${hoje}</p>
          </div>
        </body>
        </html>
      `;

      // Abrir janela para impressão
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Aguardar um pouco e abrir diálogo de impressão
        setTimeout(() => {
          printWindow.print();
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('❌ Erro ao gerar PDF. Verifique os dados da calculadora.');
    }
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
                  <tr key={e.id as string}>
                    <td className="border px-2 py-1"><input type="date" className="border rounded px-2 py-1" value={(e.data as string) || ''} onChange={(ev) => e.data = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={(e.cliente_nome as string) || ''} onChange={(ev) => e.cliente_nome = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={(e.contato as string) || ''} onChange={(ev) => e.contato = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input type="number" step="0.01" className="border rounded px-2 py-1 text-right" value={(e.valor as number) ?? ''} onChange={(ev) => e.valor = ev.target.value === '' ? null : Number(ev.target.value)} /></td>
                    <td className="border px-2 py-1"><input type="date" className="border rounded px-2 py-1" value={(e.previsao as string) || ''} onChange={(ev) => e.previsao = ev.target.value} /></td>
                    <td className="border px-2 py-1 text-center"><input type="checkbox" checked={!!e.pago} onChange={(ev) => e.pago = ev.target.checked} /></td>
                    <td className="border px-2 py-1 space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => salvarLinha('entradas', e.id as string, { data: e.data, cliente_nome: e.cliente_nome || null, contato: e.contato || null, valor: e.valor, previsao: e.previsao || null, pago: !!e.pago })}>Salvar</button>
                      <button className="border rounded px-2 py-1" onClick={() => excluirLinha('entradas', e.id as string)}>Excluir</button>
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
                  <tr key={d.id as string}>
                    <td className="border px-2 py-1"><input type="date" className="border rounded px-2 py-1" value={(d.data as string) || ''} onChange={(ev) => d.data = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={(d.item as string) || ''} onChange={(ev) => d.item = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={(d.tipo as string) || ''} onChange={(ev) => d.tipo = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input type="number" step="0.01" className="border rounded px-2 py-1 text-right" value={(d.valor as number) ?? ''} onChange={(ev) => d.valor = ev.target.value === '' ? null : Number(ev.target.value)} /></td>
                    <td className="border px-2 py-1 text-center"><input type="checkbox" checked={!!d.pago} onChange={(ev) => d.pago = ev.target.checked} /></td>
                    <td className="border px-2 py-1 space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => salvarLinha('despesas', d.id as string, { data: d.data, item: d.item, tipo: d.tipo, valor: d.valor, pago: !!d.pago })}>Salvar</button>
                      <button className="border rounded px-2 py-1" onClick={() => excluirLinha('despesas', d.id as string)}>Excluir</button>
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
                  <tr key={a.id as string}>
                    <td className="border px-2 py-1">{(a.created_at as string)?.slice(0,10)}</td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={(a.tipo as string) || ''} onChange={(ev) => a.tipo = ev.target.value} /></td>
                    <td className="border px-2 py-1"><input type="number" step="0.01" className="border rounded px-2 py-1 text-right" value={(a.valor as number) ?? ''} onChange={(ev) => a.valor = ev.target.value === '' ? null : Number(ev.target.value)} /></td>
                    <td className="border px-2 py-1"><input className="border rounded px-2 py-1" value={(a.motivo as string) || ''} onChange={(ev) => a.motivo = ev.target.value} /></td>
                    <td className="border px-2 py-1 space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => salvarLinha('ajustes_banco', a.id as string, { tipo: a.tipo, valor: a.valor, motivo: a.motivo || null })}>Salvar</button>
                      <button className="border rounded px-2 py-1" onClick={() => excluirLinha('ajustes_banco', a.id as string)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Seção Calculadoras */}
        <section className="space-y-2">
          <h2 className="text-xl font-bold border-b pb-1">📄 Calculadoras de Peixes</h2>
          <div className="text-sm text-gray-600 mb-3">
            PDFs das calculadoras salvas por todos os usuários
          </div>
          
          <div className="overflow-x-auto">
            <table className="border-collapse border border-gray-400 w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Data</th>
                  <th className="border px-2 py-1">Cliente</th>
                  <th className="border px-2 py-1">Total Peso</th>
                  <th className="border px-2 py-1">Total Valor</th>
                  <th className="border px-2 py-1">Vencimento</th>
                  <th className="border px-2 py-1">Usuário</th>
                  <th className="border px-2 py-1">PDF</th>
                  <th className="border px-2 py-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {calculadoras.map((calc: Record<string, unknown>) => (
                  <tr key={calc.id as string}>
                    <td className="border px-2 py-1 text-xs">
                      {new Date(calc.created_at as string).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="border px-2 py-1 text-xs">
                      {(calc.nome as string) || 'Sem nome'}
                    </td>
                    <td className="border px-2 py-1 text-xs text-right">
                      {Number(calc.total_peso || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg
                    </td>
                    <td className="border px-2 py-1 text-xs text-right">
                      R$ {Number(calc.total_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border px-2 py-1 text-xs">
                      {calc.data_pagamento ? new Date(calc.data_pagamento as string).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="border px-2 py-1 text-xs text-center">
                      {getUserEmailPrefix(calc.user_id as string)}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button 
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        onClick={() => gerarPDF(calc)}
                      >
                        📄 Gerar PDF
                      </button>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button 
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        onClick={() => deletarCalculadora(calc.id as string)}
                        title="Deletar orçamento"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {calculadoras.length === 0 && (
              <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                <p>Nenhuma calculadora salva ainda</p>
              </div>
            )}
          </div>
        </section>

        {loading && <p>Carregando...</p>}
      </main>
    </div>
  );
}
