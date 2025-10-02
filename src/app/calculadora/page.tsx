'use client';
import { useMemo, useState } from 'react';
import { Nav } from '@/components/Nav';
import { getSupabaseClient } from '@/lib/supabaseClient';

type Linha = { peixe: string; precoKg: number | ''; pesoKg: number | '' };

export default function CalculadoraPage() {
  const supabase = getSupabaseClient();
  const [linhas, setLinhas] = useState<Linha[]>(Array.from({ length: 15 }, () => ({ peixe: '', precoKg: '', pesoKg: '' })));
  const [nomeCalculadora, setNomeCalculadora] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const totais = useMemo(() => {
    let totalPeso = 0;
    let totalValor = 0;
    for (const l of linhas) {
      const preco = typeof l.precoKg === 'number' ? l.precoKg : 0;
      const peso = typeof l.pesoKg === 'number' ? l.pesoKg : 0;
      totalPeso += peso;
      totalValor += preco * peso;
    }
    return { totalPeso, totalValor };
  }, [linhas]);

  async function salvarCalculadora() {
    // 🔒 VALIDAÇÕES DE SEGURANÇA
    
    if (!nomeCalculadora.trim() || nomeCalculadora.trim().length < 2) {
      setStatus('⚠️ Nome do cliente deve ter pelo menos 2 caracteres');
      return;
    }
    
    // Verificar se há pelo menos uma linha preenchida
    const linhasComDados = linhas.filter(l => 
      l.peixe.trim() || (typeof l.precoKg === 'number' && l.precoKg > 0) || (typeof l.pesoKg === 'number' && l.pesoKg > 0)
    );
    
    if (linhasComDados.length === 0) {
      setStatus('⚠️ Preencha pelo menos uma linha da calculadora');
      return;
    }
    
    // Validar valores excessivos
    const valorTotal = totais.totalValor;
    if (valorTotal > 1000000) {
      setStatus('⚠️ Valor total muito alto. Para vendas acima de R$ 1.000.000, confirme com o administrador');
      return;
    }
    
    // Validar peso total
    if (totais.totalPeso > 10000) {
      setStatus('⚠️ Peso total muito alto (acima de 10 toneladas). Verifique os valores');
      return;
    }
    
    // Validar data de pagamento
    if (dataPagamento) {
      const hoje = new Date();
      const dataPag = new Date(dataPagamento);
      const diffDias = (dataPag.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
      
      if (diffDias > 365) {
        setStatus('⚠️ Data de pagamento não pode ser superior a 1 ano');
        return;
      }
      
      if (diffDias < -7) {
        setStatus('⚠️ Data de pagamento não pode ser anterior a 7 dias');
        return;
      }
    }

    setStatus(null);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    if (!userId) {
      setStatus('Faça login para salvar');
      return;
    }

    const dadosCalculadora = {
      nome: nomeCalculadora,
      linhas: JSON.stringify(linhas),
      total_peso: totais.totalPeso,
      total_valor: totais.totalValor,
      data_pagamento: dataPagamento || null,
      user_id: userId
    };

    const { error } = await supabase.from('calculadoras_peixes').insert([dadosCalculadora]);
    
    if (error) {
      setStatus(`Erro ao salvar: ${error.message}`);
      return;
    }

    setStatus('Calculadora salva com sucesso!');
  }

  function exportarPDF() {
    // Criar conteúdo HTML para o PDF
    const linhasComDados = linhas.filter(l => l.peixe || l.precoKg || l.pesoKg);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Calculadora de Peixes - ${nomeCalculadora || 'Sem nome'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .title { font-size: 18px; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .number { text-align: right; }
          .total-row { background-color: #f0f9ff; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">Pretinha Pesca</div>
          <div class="title">Calculadora de Peixes</div>
          ${nomeCalculadora ? `<div style="margin-top: 10px;">${nomeCalculadora}</div>` : ''}
          <div style="margin-top: 10px; font-size: 14px;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          ${dataPagamento ? `<div style="margin-top: 5px; font-size: 14px; color: #dc2626;"><strong>Pagamento Para: ${new Date(dataPagamento).toLocaleDateString('pt-BR')}</strong></div>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Peixe</th>
              <th>Preço/kg (R$)</th>
              <th>Peso Total (kg)</th>
              <th>Resultado (R$)</th>
            </tr>
          </thead>
          <tbody>
            ${linhasComDados.map(l => {
              const preco = typeof l.precoKg === 'number' ? l.precoKg : 0;
              const peso = typeof l.pesoKg === 'number' ? l.pesoKg : 0;
              const resultado = preco * peso;
              return `
                <tr>
                  <td>${l.peixe}</td>
                  <td class="number">${preco.toFixed(2)}</td>
                  <td class="number">${peso.toFixed(2)}</td>
                  <td class="number">${resultado.toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>TOTAIS</strong></td>
              <td></td>
              <td class="number"><strong>${totais.totalPeso.toFixed(2)} kg</strong></td>
              <td class="number"><strong>R$ ${totais.totalValor.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="footer">
          Gerado por Pretinha Pesca - Sistema de Gestão Pesqueira
        </div>
      </body>
      </html>
    `;

    // Abrir nova janela com o conteúdo para impressão/PDF
    const novaJanela = window.open('', '_blank');
    if (novaJanela) {
      novaJanela.document.write(htmlContent);
      novaJanela.document.close();
      novaJanela.focus();
      
      // Aguardar um pouco e então abrir o diálogo de impressão
      setTimeout(() => {
        novaJanela.print();
      }, 500);
    }
  }

  function limparCalculadora() {
    setLinhas(Array.from({ length: 15 }, () => ({ peixe: '', precoKg: '', pesoKg: '' })));
    setNomeCalculadora('');
    setDataPagamento('');
    setStatus(null);
  }

  return (
    <div>
      <Nav />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">Calculadora de Peixes</h1>
        
        {/* Controles */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <label className="grid gap-1">
              <span>Cliente</span>
              <input 
                value={nomeCalculadora} 
                onChange={(e) => setNomeCalculadora(e.target.value)}
                placeholder="Ex: Restaurante Silva, João da Pesca"
                className="border rounded px-3 py-2 min-w-[250px]" 
              />
            </label>
            
            <label className="grid gap-1">
              <span>Pagamento Para</span>
              <input 
                type="date"
                value={dataPagamento} 
                onChange={(e) => setDataPagamento(e.target.value)}
                className="border rounded px-3 py-2" 
              />
            </label>
            
            <button 
              onClick={salvarCalculadora}
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
            >
              💾 Salvar
            </button>
            
            <button 
              onClick={exportarPDF}
              className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700"
            >
              📄 Exportar PDF
            </button>
            
            <button 
              onClick={limparCalculadora}
              className="bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700"
            >
              🗑️ Limpar
            </button>
          </div>
          
          {status && (
            <p className={`text-sm ${status.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
              {status}
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-1 text-left">Peixe</th>
                <th className="border px-2 py-1 text-left">Preço/kg</th>
                <th className="border px-2 py-1 text-left">Peso total (kg)</th>
                <th className="border px-2 py-1 text-left">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l, i) => {
                const preco = typeof l.precoKg === 'number' ? l.precoKg : 0;
                const peso = typeof l.pesoKg === 'number' ? l.pesoKg : 0;
                const resultado = preco * peso;
                return (
                  <tr key={i}>
                    <td className="border px-2 py-1">
                      <input value={l.peixe} onChange={(e) => setLinhas((prev) => prev.map((x, idx) => idx === i ? { ...x, peixe: e.target.value } : x))} className="border rounded px-2 py-1 w-full" />
                    </td>
                    <td className="border px-2 py-1">
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="1000"
                        value={l.precoKg} 
                        onChange={(e) => setLinhas((prev) => prev.map((x, idx) => idx === i ? { ...x, precoKg: e.target.value === '' ? '' : Number(e.target.value) } : x))} 
                        className="border rounded px-2 py-1 w-full" 
                        placeholder="0.00"
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="10000"
                        value={l.pesoKg} 
                        onChange={(e) => setLinhas((prev) => prev.map((x, idx) => idx === i ? { ...x, pesoKg: e.target.value === '' ? '' : Number(e.target.value) } : x))} 
                        className="border rounded px-2 py-1 w-full" 
                        placeholder="0.00"
                      />
                    </td>
                    <td className="border px-2 py-1">{resultado.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium">
                <td className="border px-2 py-1">Totais</td>
                <td className="border px-2 py-1" />
                <td className="border px-2 py-1">{totais.totalPeso.toFixed(2)}</td>
                <td className="border px-2 py-1">{totais.totalValor.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
}
