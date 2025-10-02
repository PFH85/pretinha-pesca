'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Função para validar senha
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

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Validar senha apenas no cadastro
        const erroSenha = validarSenha(password);
        if (erroSenha) {
          setMessage(`⚠️ ${erroSenha}`);
          setLoading(false);
          return;
        }

        // Cadastro
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          setMessage(`Erro no cadastro: ${error.message}`);
        } else {
          setMessage('✅ Conta criada! Verifique seu email para confirmar.');
        }
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          setMessage(`Erro no login: ${error.message}`);
        } else {
          setMessage('✅ Login realizado com sucesso!');
          router.push('/');
        }
      }
    } catch (error) {
      setMessage('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function redefinirSenhaEmail() {
    if (!email.trim()) {
      setMessage('⚠️ Digite seu email para redefinir a senha.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setMessage(`❌ Erro: ${error.message}`);
      } else {
        setMessage('✅ Email de redefinição enviado! Verifique sua caixa de entrada e spam.');
        setShowForgotPassword(false);
      }
    } catch (error) {
      setMessage('❌ Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">🎣 Pretinha Pesca</h1>
          <p className="text-gray-600">Sistema de Gestão Pesqueira</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">
            {isSignUp ? 'Criar Conta' : 'Fazer Login'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                minLength={8}
                required
              />
              {isSignUp && (
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p className="font-medium">A senha deve conter:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Pelo menos 8 caracteres</li>
                    <li>1 letra maiúscula (A-Z)</li>
                    <li>1 letra minúscula (a-z)</li>
                    <li>1 número (0-9)</li>
                    <li>1 caractere especial (!@#$%^&*)</li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-4 space-y-2">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
                setShowForgotPassword(false);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm block w-full"
            >
              {isSignUp ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar uma'}
            </button>
            
            {!isSignUp && (
              <button
                onClick={() => {
                  setShowForgotPassword(!showForgotPassword);
                  setMessage(null);
                }}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                {showForgotPassword ? 'Voltar ao login' : 'Esqueci minha senha'}
              </button>
            )}
          </div>

          {/* Esqueci a senha */}
          {!isSignUp && showForgotPassword && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">🔑 Redefinir Senha</h3>
              <p className="text-sm text-blue-700 mb-3">
                Digite seu email abaixo e clique em &quot;Enviar Email&quot;.
              </p>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Seu Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="digite@seuemail.com"
                  required
                />
              </div>
              
              <button
                onClick={redefinirSenhaEmail}
                disabled={loading || !email.trim()}
                className="w-full bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : '📧 Enviar Email de Redefinição'}
              </button>
              
              <p className="text-xs text-blue-600 mt-2">
                ⚠️ Verifique sua caixa de entrada e spam após enviar.
              </p>
            </div>
          )}

          {/* Message */}
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

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>&quot;Que cada dia seja uma boa pescaria!&quot;</p>
        </div>
      </div>
    </div>
  );
}
