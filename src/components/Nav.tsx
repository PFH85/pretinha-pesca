'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export function Nav() {
  const supabase = getSupabaseClient();
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaster = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_master')
            .eq('id', user.id)
            .single();
          
          setIsMaster(profile?.is_master || false);
        }
      } catch (error) {
        console.error('Erro ao verificar master:', error);
        setIsMaster(false);
      } finally {
        setLoading(false);
      }
    };

    checkMaster();
  }, [supabase]);

  const links = [
    { href: '/', label: 'Início' },
    { href: '/entradas', label: 'Entradas' },
    { href: '/despesas', label: 'Despesas' },
    { href: '/banco', label: 'Banco' },
    { href: '/a-receber-pagar', label: 'A Receber/A Pagar' },
    { href: '/investimentos', label: 'Investimentos' },
    { href: '/calculadora', label: 'Calculadora de Peixes' },
    { href: '/analises', label: 'Análises' },
  ];

  if (loading) {
    return (
      <nav className="w-full border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="text-sm text-gray-500">Carregando...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-4 flex-wrap">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm hover:underline">
            {l.label}
          </Link>
        ))}
        {isMaster && (
          <Link href="/admin" className="text-sm hover:underline text-red-600 font-bold">
            ⚙️ Admin
          </Link>
        )}
      </div>
    </nav>
  );
}
