import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { Link } from 'react-router-dom';
import { equipmentControllerList, loansControllerCreate, loansControllerMine, type CatalogResponseDtoItemsItem } from '../api/generated';

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value.slice(0, 10) + 'T12:00:00Z'));
}

export function today() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function deadline() {
  const date = new Date(today() + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + 14);
  return dateLabel(date.toISOString());
}

export default function Catalog() {
  const client = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'disponivel' | 'emprestado' | 'manutencao'>('all');
  const [cursor, setCursor] = useState<string>();
  const [selected, setSelected] = useState<CatalogResponseDtoItemsItem | null>(null);
  const [message, setMessage] = useState('');
  const catalog = useQuery({ queryKey: ['catalog', q, status, cursor], queryFn: () => equipmentControllerList({ q, status, cursor, limit: 24 }) });
  const loans = useQuery({ queryKey: ['loans', false], queryFn: () => loansControllerMine() });
  const overdue = loans.data?.some(loan => loan.dueOn.slice(0, 10) < today());
  const atLimit = (loans.data?.length ?? 0) >= 3;
  const borrow = useMutation({ mutationFn: (body: { equipmentId: string }) => loansControllerCreate(body),
    onSuccess: loan => {
      setMessage(`Empréstimo confirmado. Devolver até ${dateLabel(loan.dueOn)}.`);
      setSelected(null);
      void client.invalidateQueries();
    }, onError: () => { void client.invalidateQueries(); },
  });

  return <main className="home-content" id="content">
    <header className="flow-heading"><div><h1>Catálogo</h1><p>{catalog.data ? `${catalog.data.available} de ${catalog.data.total} equipamentos disponíveis` : 'Consulte os equipamentos'}</p></div>
      <label>Buscar equipamento<input className="input" value={q} onChange={event => { setQ(event.target.value); setCursor(undefined); }} placeholder="Nome ou patrimônio" /></label></header>
    <div className="filter-row" aria-label="Situação dos equipamentos">{(['all', 'disponivel', 'emprestado', 'manutencao'] as const).map((value, index) =>
      <button className={`btn ${status === value ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={status === value} key={value} onClick={() => { setStatus(value); setCursor(undefined); }}>{['Todos', 'Disponíveis', 'Emprestados', 'Em manutenção'][index]}</button>)}</div>
    {overdue && <p className="flow-error">Você tem empréstimo em atraso. <Link to="/meus-emprestimos">Ver meus empréstimos</Link></p>}
    {message && <p role="status">{message}</p>}
    {catalog.isPending && <p role="status">Carregando catálogo…</p>}
    {(catalog.error || loans.error) && <div className="flow-error" role="alert"><p>{(catalog.error ?? loans.error)?.message}</p><button className="btn" onClick={() => { void catalog.refetch(); void loans.refetch(); }}>Tentar novamente</button></div>}
    {catalog.data?.items.length === 0 && <p className="empty-state">Nenhum equipamento encontrado.</p>}
    <div className="equipment-grid">{catalog.data?.items.map(item => <article className="equipment-card" key={item.id}>
      {item.imageUrl ? <img src={item.imageUrl} alt={item.nome} loading="lazy" /> : <div className="image-placeholder">Sem foto</div>}
      <span className="section-kicker">{item.categoria}</span><h2>{item.nome}</h2><p>{item.patrimonio}</p>
      <p>{item.status === 'manutencao' ? 'Em manutenção' : item.status === 'emprestado' ? 'Emprestado' : 'Disponível'}</p>
      <button className="btn btn-primary" disabled={item.status !== 'disponivel' || atLimit || overdue || !loans.data}
        onClick={() => { borrow.reset(); setSelected(item); }}>
        {item.isMine ? 'Está com você' : item.status !== 'disponivel' ? 'Indisponível' : overdue ? 'Bloqueado por atraso' : atLimit ? 'Limite de 3 itens' : 'Solicitar empréstimo'}
      </button></article>)}</div>
    <div className="filter-row">{cursor && <button className="btn" onClick={() => setCursor(undefined)}>Voltar ao início</button>}{catalog.data?.nextCursor && <button className="btn" onClick={() => setCursor(catalog.data?.nextCursor ?? undefined)}>Próxima página</button>}</div>
    <footer><a href="https://pixabay.com/" target="_blank" rel="noreferrer">Fotos: Pixabay</a></footer>
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open && !borrow.isPending) setSelected(null); }}>
      <Dialog.Portal><Dialog.Overlay className="flow-overlay" /><Dialog.Content className="flow-dialog">
        <Dialog.Title>Confirmar empréstimo</Dialog.Title><Dialog.Description>{selected?.nome} · {selected?.patrimonio}. Devolução prevista até {deadline()}.</Dialog.Description>
        {borrow.error && <p className="flow-error" role="alert">{borrow.error.message}</p>}
        <div className="filter-row"><Dialog.Close className="btn" disabled={borrow.isPending}>Cancelar</Dialog.Close><button className="btn btn-primary" disabled={borrow.isPending} onClick={() => selected && borrow.mutate({ equipmentId: selected.id })}>{borrow.isPending ? 'Solicitando…' : 'Confirmar'}</button></div>
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </main>;
}
