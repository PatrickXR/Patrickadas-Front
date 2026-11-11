import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { equipmentControllerList, loansControllerMine, loansControllerOpen, loansControllerReturnItem, type LoanListDto } from '../api/generated';
import { useSession } from '../session';
import { dateLabel, today } from './Catalog';

export default function Loans({ operations = false }: { operations?: boolean }) {
  const { session } = useSession();
  const allowed = !operations || session?.role === 'operacoes';
  const client = useQueryClient();
  const [selected, setSelected] = useState<LoanListDto | null>(null);
  const [query, setQuery] = useState('');
  const loans = useQuery({ queryKey: ['loans', operations], queryFn: () => operations ? loansControllerOpen() : loansControllerMine(), enabled: allowed });
  const inventory = useQuery({ queryKey: ['inventory-summary'], queryFn: () => equipmentControllerList({ limit: 1 }), enabled: allowed && operations });
  const returned = useMutation({ mutationFn: (id: string) => loansControllerReturnItem(id), onSuccess: () => { setSelected(null); void client.invalidateQueries(); } });
  if (!allowed) return <Navigate to="/home" replace />;
  const items = loans.data?.filter(loan => `${loan.equipment.nome} ${loan.equipment.patrimonio} ${loan.userName ?? ''} ${loan.userId ?? ''}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <main className="home-content" id="content">
    <header className="flow-heading"><div><h1>{operations ? 'Operações' : 'Meus empréstimos'}</h1><p>{operations ? 'Empréstimos em aberto' : `${loans.data?.length ?? 0} de 3 itens em seu nome · prazo padrão de 14 dias`}</p></div><label>Buscar empréstimo<input className="input" value={query} onChange={event => setQuery(event.target.value)} /></label>{operations && <Link className="btn btn-primary" to="/equipamentos">Cadastrar equipamento</Link>}</header>
    {!operations && <div className="loan-slots" aria-label={`${loans.data?.length ?? 0} de 3 vagas ocupadas`}>{[0,1,2].map(index => <span key={index} className={index < (loans.data?.length ?? 0) ? loans.data?.some(loan => loan.dueOn < today()) ? 'occupied overdue' : 'occupied' : ''} />)}</div>}
    {operations && <dl className="operations-kpis">
      <div><dt>Em aberto</dt><dd>{loans.data?.length ?? '—'}</dd></div>
      <div><dt>Em atraso</dt><dd className="flow-error">{loans.data?.filter(loan => loan.dueOn < today()).length ?? '—'}</dd></div>
      <div><dt>Disponíveis</dt><dd>{inventory.data?.available ?? '—'}</dd></div>
      <div><dt>Manutenção</dt><dd>{inventory.data?.maintenance ?? '—'}</dd></div>
    </dl>}
    {inventory.error && <div role="alert"><p>{inventory.error.message}</p><button className="btn" onClick={() => void inventory.refetch()}>Recarregar indicadores</button></div>}
    {loans.isPending && <p role="status">Carregando empréstimos…</p>}
    {loans.error && <div role="alert"><p>{loans.error.message}</p><button className="btn" onClick={() => void loans.refetch()}>Tentar novamente</button></div>}
    {items?.length === 0 && <div className="empty-state"><p>Nenhum empréstimo em aberto encontrado.</p>{!operations && <Link className="btn" to="/catalogo">Ir ao catálogo</Link>}</div>}
    {operations ? <div className="operations-table-scroll"><table className="operations-table"><caption className="sr-only">Empréstimos em aberto do tenant</caption><thead><tr>{['Pessoa','Equipamento','Patrimônio','Retirada','Prazo','Situação','Ação'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{items?.map(loan => <tr key={loan.id}>
      <td>{loan.userName ?? loan.userId}</td><td>{loan.equipment.nome}</td><td>{loan.equipment.patrimonio}</td><td>{new Date(loan.borrowedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</td><td>{dateLabel(loan.dueOn)}</td><td className={loan.dueOn < today() ? 'flow-error' : ''}>{loan.dueOn < today() ? 'Em atraso' : 'Em dia'}</td><td><button className="btn btn-primary" onClick={() => { returned.reset(); setSelected(loan); }}>Registrar devolução</button></td>
    </tr>)}</tbody></table></div> : <div className="loan-list">{items?.map(loan => <article className={`loan-row ${loan.dueOn < today() ? 'loan-overdue' : ''}`} key={loan.id}>
      <div><h2>{loan.equipment.nome}</h2><p>{loan.equipment.patrimonio}</p>{operations && <p>{loan.userName ?? loan.userId}</p>}</div>
      <div><span>Retirada</span><p>{new Date(loan.borrowedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p></div>
      <div><span>Devolver até</span><p>{dateLabel(loan.dueOn)}</p><span className={loan.dueOn.slice(0,10) < today() ? 'flow-error' : ''}>{loan.dueOn.slice(0,10) < today() ? 'Em atraso' : 'Em dia'}</span></div>
      <button className="btn btn-primary" onClick={() => { returned.reset(); setSelected(loan); }}>{operations ? 'Registrar devolução' : 'Devolver'}</button>
    </article>)}</div>}
    {!operations && <footer className="loan-rules"><span>Até 3 itens por pessoa</span><span>14 dias corridos</span><span>Devolva os atrasados para solicitar outro item</span></footer>}
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open && !returned.isPending) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="flow-overlay" /><Dialog.Content className="flow-dialog">
      <Dialog.Title>Confirmar devolução</Dialog.Title><Dialog.Description>{selected?.equipment.nome} · {selected?.equipment.patrimonio}</Dialog.Description>
      {returned.error && <p role="alert" className="flow-error">{returned.error.message}</p>}
      <div className="filter-row"><Dialog.Close className="btn" disabled={returned.isPending}>Cancelar</Dialog.Close><button className="btn btn-primary" disabled={returned.isPending} onClick={() => selected && returned.mutate(selected.id)}>{returned.isPending ? 'Registrando…' : 'Confirmar devolução'}</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}
