import { Nav } from '@/components/Nav';

export default function AnalisesPage() {
  return (
    <div>
      <Nav />
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <h1 className="text-xl font-semibold">Análises</h1>
        <p className="text-sm text-gray-600">Em breve: gráficos, fechamento mensal e sugestões com IA.</p>
      </main>
    </div>
  );
}
