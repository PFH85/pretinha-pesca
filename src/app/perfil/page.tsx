'use client';
import { useState, useEffect } from 'react';
import { Nav } from '@/components/Nav';
import { AuthGuard } from '@/components/AuthGuard';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function PerfilPage() {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
      }
    })();
  }, [supabase]);

  // Função para validar senha forte
  function validarSenha(senha: string): string | null {
    if (senha.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    if (!/[A-Z]/.test(senha)) {
      return 'A senha deve conter pelo menos 1 letra maiúscula';
    }
    if (!/[a-z]/.test(senha)) {
      return 'A senha deve conter pelo menos 1 letra minúscula';
    }
    if (!/[0-9]/.test(senha)) {
      return 'A senha deve conter pelo menos 1 número';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
      return 'A senha deve conter pelo menos 1 caractere especial (!@#$%^&*(),.?":{}|<>)';
    }
    return null; // Senha válida
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMessage('⚠️ Preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMessage('⚠️ A nova senha e confirmação não coincidem.');
      setLoading(false);
      return;
    }

    const erroSenha = validarSenha(novaSenha);
    if (erroSenha) {
      setMessage(`⚠️ ${erroSenha}`);
      setLoading(false);
      return;
    }

    try {
      // Primeiro, verificar se a senha atual está correta fazendo um login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senhaAtual,
      });

      if (loginError) {
        setMessage('⚠️ Senha atual incorreta.');
        setLoading(false);
        return;
      }

      // Se chegou aqui, a senha atual está correta, então alterar
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) {
        setMessage(`❌ Erro ao alterar senha: ${error.message}`);
      } else {
        setMessage('✅ Senha alterada com sucesso!');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      }
    } catch {
      setMessage('❌ Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function redefinirSenhaEmail() {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/perfil`,
      });

      if (error) {
        setMessage(`❌ Erro: ${error.message}`);
      } else {
        setMessage('✅ Email de redefinição enviado! Verifique sua caixa de entrada.');
      }
    } catch {
      setMessage('❌ Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div>
        <Nav />
        <main className="max-w-2xl mx-auto p-4 space-y-6">
          <h1 className="text-2xl font-bold">Meu Perfil</h1>

          {/* Informações da conta */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Informações da Conta</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Alterar senha */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Alterar Senha</h2>
            
            <form onSubmit={alterarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua senha atual"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a nova senha"
                  minLength={8}
                  required
                />
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p className="font-medium">A nova senha deve conter:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Pelo menos 8 caracteres</li>
                    <li>1 letra maiúscula (A-Z)</li>
                    <li>1 letra minúscula (a-z)</li>
                    <li>1 número (0-9)</li>
                    <li>1 caractere especial (!@#$%^&*)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite a nova senha novamente"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>

            {/* Opção alternativa */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-2">Esqueceu sua senha atual?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enviaremos um email para redefinir sua senha.
              </p>
              <button
                onClick={redefinirSenhaEmail}
                disabled={loading}
                className="bg-gray-600 text-white rounded-lg py-2 px-4 hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar Email de Redefinição'}
              </button>
            </div>

            {/* Mensagem */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                message.includes('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
