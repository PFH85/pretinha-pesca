import Link from 'next/link';

export function Nav() {
  const links = [
    { href: '/', label: 'Início' },
    { href: '/entradas', label: 'Entradas' },
    { href: '/despesas', label: 'Despesas' },
    { href: '/banco', label: 'Banco' },
    { href: '/calculadora', label: 'Calculadora de Peixes' },
    { href: '/analises', label: 'Análises' },
  ];
  return (
    <nav className="w-full border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex gap-4 flex-wrap">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm hover:underline">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
