import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { loansControllerMine, loansControllerOpen, loansControllerReturnItem, type LoanListDto } from '../api/generated';
import { useSession } from '../session';
import { dateLabel, today } from './Catalog';

export default function Loans({ operations = false }: { operations?: boolean }) {
  const { session } = useSession();
  const allowed = !operations || session?.role === 'operacoes';
  const client = useQueryClient();
  const [selected, setSelected] = useState<LoanListDto | null>(null);
  const [query, setQuery] = useState('');
  const loans = useQuery({ queryKey: ['loans', operations], queryFn: () => operations ? loansControllerOpen() : loansControllerMine(), enabled: allowed });
  const returned = useMutation({ mutationFn: (id: string) => loansControllerReturnItem(id), onSuccess: () => { setSelected(null); void client.invalidateQueries(); } });
  if (!allowed) return <Navigate to="/home" replace />;
  const items = loans.data?.filter(loan => `${loan.equipment.nome} ${loan.equipment.patrimonio} ${loan.userId ?? ''}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <main className="home-content" id="content">
    <header className="flow-heading"><div><h1>{operations ? 'Operações' : 'Meus empréstimos'}</h1><p>{operations ? 'Empréstimos em aberto' : `${loans.data?.length ?? 0} de 3 itens em seu nome`}</p></div><label>Buscar empréstimo<input className="input" value={query} onChange={event => setQuery(event.target.value)} /></label></header>
    {loans.isPending && <p role="status">Carregando empréstimos…</p>}
    {loans.error && <div role="alert"><p>{loans.error.message}</p><button className="btn" onClick={() => void loans.refetch()}>Tentar novamente</button></div>}
    {items?.length === 0 && <p className="empty-state">Nenhum empréstimo em aberto encontrado.</p>}
    <div className="loan-list">{items?.map(loan => <article className="loan-row" key={loan.id}>
      <div><h2>{loan.equipment.nome}</h2><p>{loan.equipment.patrimonio}</p>{operations && <p>{loan.userName ?? loan.userId}</p>}</div>
      <div><span>Retirada</span><p>{new Date(loan.borrowedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p></div>
      <div><span>Devolver até</span><p>{dateLabel(loan.dueOn)}</p><span className={loan.dueOn.slice(0,10) < today() ? 'flow-error' : ''}>{loan.dueOn.slice(0,10) < today() ? 'Em atraso' : 'Em dia'}</span></div>
      <button className="btn btn-primary" onClick={() => { returned.reset(); setSelected(loan); }}>{operations ? 'Registrar devolução' : 'Devolver'}</button>
    </article>)}</div>
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open && !returned.isPending) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="flow-overlay" /><Dialog.Content className="flow-dialog">
      <Dialog.Title>Confirmar devolução</Dialog.Title><Dialog.Description>{selected?.equipment.nome} · {selected?.equipment.patrimonio}</Dialog.Description>
      {returned.error && <p role="alert" className="flow-error">{returned.error.message}</p>}
      <div className="filter-row"><Dialog.Close className="btn" disabled={returned.isPending}>Cancelar</Dialog.Close><button className="btn btn-primary" disabled={returned.isPending} onClick={() => selected && returned.mutate(selected.id)}>{returned.isPending ? 'Registrando…' : 'Confirmar devolução'}</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}
