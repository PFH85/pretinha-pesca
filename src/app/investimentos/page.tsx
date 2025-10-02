'use client';
import { useEffect, useState, useCallback } from 'react';
import { Nav } from '@/components/Nav';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface Investimento {
  id: string;
  tipo: string;
  valor: number;
  motivo: string;
  created_at: string;
  user_id: string;
  cliente?: string;
}

export default function InvestimentosPage() {
  const supabase = getSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [totais, setTotais] = useState<{[key: string]: number}>({});
  const [isMaster, setIsMaster] = useState(false);
  
  // Estados para adicionar novo investimento
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInvestimento, setNewInvestimento] = useState({
    responsavel: 'PH',
    valor: '',
    motivo: ''
  });

  const carregarInvestimentos = useCallback(async () => {
    setLoading(true);
    
    // Verificar se é Master
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (uid) {
      const { data: prof } = await supabase.from('profiles').select('is_master').eq('id', uid).maybeSingle();
      setIsMaster(!!prof?.is_master);
    }
    
    // Buscar ajustes que são investimentos
    const { data: ajustesData, error: ajustesError } = await supabase
      .from('ajustes_banco')
      .select('*')
      .order('created_at', { ascending: false });

    if (ajustesError) {
      console.error('Erro ao carregar dados:', ajustesError);
      setLoading(false);
      return;
    }

    // Usar TODOS os ajustes como investimentos (todos são relacionados ao negócio)
    const investimentosAjustes = ajustesData || [];

    // Usar apenas os ajustes (que já incluem as despesas da planilha)
    // Não incluir despesas da tabela para evitar duplicação
    const todosInvestimentos = investimentosAjustes.map(inv => ({
      ...inv,
      cliente: inv.motivo?.includes('DICO') || inv.motivo?.includes('Dico') ? 'DICO' : 'PH'
    }));

    setInvestimentos(todosInvestimentos);

    // Calcular totais por cliente
    const totaisPorCliente: {[key: string]: number} = {};
    
    todosInvestimentos.forEach(inv => {
      const cliente = inv.cliente || 'PH';
      totaisPorCliente[cliente] = (totaisPorCliente[cliente] || 0) + (inv.valor || 0);
    });

    setTotais(totaisPorCliente);
    setLoading(false);
  }, [supabase]);

  const adicionarInvestimento = async () => {
    if (!newInvestimento.valor || !newInvestimento.motivo.trim()) {
      alert('Preencha valor e motivo!');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      alert('Faça login para adicionar investimento.');
      return;
    }

    const { error } = await supabase.from('ajustes_banco').insert([
      {
        user_id: userId,
        tipo: 'entrada',
        valor: Number(newInvestimento.valor),
        motivo: `${newInvestimento.responsavel} - ${newInvestimento.motivo}`,
      },
    ]);

    if (error) {
      alert(`Erro ao adicionar: ${error.message}`);
      return;
    }

    // Resetar form
    setNewInvestimento({ responsavel: 'PH', valor: '', motivo: '' });
    setShowAddForm(false);
    
    // Recarregar dados
    await carregarInvestimentos();
  };

  useEffect(() => {
    carregarInvestimentos();
  }, [carregarInvestimentos]);

  const valorTotal = investimentos.reduce((sum, inv) => sum + (inv.valor || 0), 0);

  if (loading) {
    return (
      <div>
        <Nav />
        <main className="max-w-5xl mx-auto p-4">
          <p>Carregando investimentos...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Nav />
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Controle de Investimentos</h1>
          <div className="flex gap-2">
            {isMaster && (
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
              >
                {showAddForm ? 'Cancelar' : '+ Adicionar Investimento'}
              </button>
            )}
            <button 
              onClick={carregarInvestimentos}
              disabled={loading}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {/* Formulário para adicionar investimento (apenas Master) */}
        {isMaster && showAddForm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Adicionar Novo Investimento</h3>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <label className="grid gap-1">
                <span>Responsável</span>
                <select 
                  value={newInvestimento.responsavel}
                  onChange={(e) => setNewInvestimento(prev => ({ ...prev, responsavel: e.target.value }))}
                  className="border rounded px-3 py-2"
                >
                  <option value="PH">PH</option>
                  <option value="DICO">DICO</option>
                </select>
              </label>
              
              <label className="grid gap-1">
                <span>Valor (R$)</span>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={newInvestimento.valor}
                  onChange={(e) => setNewInvestimento(prev => ({ ...prev, valor: e.target.value }))}
                  className="border rounded px-3 py-2"
                  placeholder="0.00"
                />
              </label>
              
              <label className="grid gap-1">
                <span>Motivo/Descrição</span>
                <input 
                  value={newInvestimento.motivo}
                  onChange={(e) => setNewInvestimento(prev => ({ ...prev, motivo: e.target.value }))}
                  className="border rounded px-3 py-2"
                  placeholder="Ex: Investimento inicial, compra de equipamentos..."
                />
              </label>
              
              <button 
                onClick={adicionarInvestimento}
                className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Resumo de Totais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800">Total Investido - PH</h3>
            <p className="text-2xl font-bold text-blue-600">
              R$ {(totais.PH || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800">Total Investido - DICO</h3>
            <p className="text-2xl font-bold text-green-600">
              R$ {(totais.DICO || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800">Total Geral</h3>
            <p className="text-2xl font-bold text-gray-600">
              R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Lista de Investimentos */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detalhamento dos Investimentos</h2>
          <p className="text-sm text-gray-600">
            Inclui investimentos iniciais + despesas operacionais + entradas PH (automáticas)
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-4 py-3 text-left text-sm font-semibold">Data</th>
                  <th className="border-b px-4 py-3 text-left text-sm font-semibold">Descrição</th>
                  <th className="border-b px-4 py-3 text-left text-sm font-semibold">Responsável</th>
                  <th className="border-b px-4 py-3 text-right text-sm font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {investimentos.map((inv, index) => {
                  const cliente = inv.cliente || 'PH';
                  const data = new Date(inv.created_at).toLocaleDateString('pt-BR');
                  
                  return (
                    <tr key={inv.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border-b px-4 py-3 text-sm">{data}</td>
                      <td className="border-b px-4 py-3 text-sm">{inv.motivo}</td>
                      <td className="border-b px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cliente === 'DICO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {cliente}
                        </span>
                      </td>
                      <td className="border-b px-4 py-3 text-sm text-right font-medium">
                        R$ {(inv.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {investimentos.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">Nenhum investimento registrado</h3>
              <p className="mb-4">
                Para começar a usar o controle de investimentos:
              </p>
              <div className="text-sm text-left max-w-md mx-auto space-y-2">
                <p>📝 <strong>Opção 1:</strong> Use o botão &quot;+ Adicionar Investimento&quot; (Master)</p>
                <p>🎯 <strong>Opção 2:</strong> Registre entradas/despesas pagas por PH ou DICO</p>
                <p>💡 <strong>Automático:</strong> Sistema cria investimentos quando PH/DICO fazem pagamentos</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
