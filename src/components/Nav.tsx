"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

export function Nav() {
  const supabase = getSupabaseClient();
  const [isMaster, setIsMaster] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      setEmail(userData.user?.email ?? null);
      if (!uid) { setIsMaster(false); return; }
      const { data } = await supabase.from('profiles').select('is_master').eq('id', uid).maybeSingle();
      setIsMaster(!!data?.is_master);
    })();
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
    ...(isMaster ? [
      { href: '/admin', label: 'Admin' }
    ] : []),
  ];
  return (
    <nav className="w-full border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-4 flex-wrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm hover:underline">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="text-xs text-gray-700 flex items-center gap-3">
          {email ? (
            <>
              <span>
                {email} {isMaster && <span className="ml-2 inline-block border rounded px-2 py-0.5">Master</span>}
              </span>
              <button
                className="border rounded px-2 py-0.5"
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
              >Sair</button>
            </>
          ) : (
            <Link href="/login" className="hover:underline">Entrar</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
