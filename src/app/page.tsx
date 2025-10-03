import { Nav } from '@/components/Nav';
import { AuthGuard } from '@/components/AuthGuard';

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed relative" 
           style={{backgroundImage: 'url(/images/pescadores_barco.jpg)'}}>
        {/* Overlay escuro para melhorar legibilidade */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <Nav />
        <main className="max-w-5xl mx-auto p-4 relative z-10">
          <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">🎣 Pretinha Pesca v2.0</h1>
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4 bg-opacity-90">
            <p className="text-green-800 font-semibold">✅ Sistema Atualizado - Versão 2.0.0</p>
            <p className="text-green-700 text-sm">Todas as validações e funcionalidades implementadas</p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-8 border border-blue-200 bg-opacity-90">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">
              ⚓ Navegando com Segurança Rumo ao Sucesso
            </h2>
            
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Como as águas do oceano que se renovam a cada maré, nossa empresa cresce com 
              <strong> coragem, disciplina e planejamento</strong>. Cada pescaria é uma nova oportunidade, 
              cada investimento uma âncora para o futuro, e cada decisão um rumo traçado com sabedoria.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-lg bg-opacity-95">
                <div className="text-3xl mb-2">🌊</div>
                <h3 className="font-semibold text-blue-700">Prosperidade</h3>
                <p className="text-sm text-gray-600">
                  Investimentos sólidos garantem mares calmos para nossa navegação empresarial
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-lg bg-opacity-95">
                <div className="text-3xl mb-2">🛡️</div>
                <h3 className="font-semibold text-blue-700">Segurança</h3>
                <p className="text-sm text-gray-600">
                  Controle financeiro rigoroso protege nossa embarcação dos temporais do mercado
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-lg bg-opacity-95">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-blue-700">Excelência</h3>
                <p className="text-sm text-gray-600">
                  Cada pescaria planejada com precisão gera os melhores frutos do mar
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-blue-700 font-medium">
                &quot;Que cada dia seja uma boa pescaria e cada decisão nos leve a águas mais prósperas!&quot; 
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-white drop-shadow-lg">
              Use o menu de navegação acima para acessar as funcionalidades do sistema.
            </p>
          </div>
             </div>
           </main>
         </div>
      </AuthGuard>
    );
  }
