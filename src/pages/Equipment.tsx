import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { equipmentControllerCreate, equipmentControllerList, equipmentControllerRemove, equipmentControllerUpdate, type CatalogResponseDtoItemsItem, type EquipmentInputDto } from '../api/generated';
import { useSession } from '../session';

const schema = z.object({ nome: z.string().trim().min(1, 'Informe o nome'), patrimonio: z.string().trim().min(1, 'Informe o patrimônio'),
  categoria: z.enum(['notebook','monitor','cabo','camera']), situacao: z.enum(['disponivel','manutencao']), observacoes: z.string().max(2000) });
type Form = z.infer<typeof schema>;
const defaults: Form = { nome: '', patrimonio: '', categoria: 'notebook', situacao: 'disponivel', observacoes: '' };

export default function Equipment() {
  const { session } = useSession();
  const client = useQueryClient();
  const [editing, setEditing] = useState<string>();
  const [deleting, setDeleting] = useState<CatalogResponseDtoItemsItem | null>(null);
  const [cursor, setCursor] = useState<string>();
  const [message, setMessage] = useState('');
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: defaults });
  const items = useQuery({ queryKey: ['equipment-management', cursor], queryFn: () => equipmentControllerList({ limit: 100, cursor }), enabled: session?.role === 'operacoes' });
  const save = useMutation({ mutationFn: (data: EquipmentInputDto) => editing ? equipmentControllerUpdate(editing, data) : equipmentControllerCreate(data), onSuccess: () => {
    form.reset(defaults); setEditing(undefined); setMessage('Equipamento salvo.'); void client.invalidateQueries();
  } });
  const remove = useMutation({ mutationFn: (id: string) => equipmentControllerRemove(id), onSuccess: () => {
    setDeleting(null); setMessage('Equipamento excluído.'); void client.invalidateQueries();
  } });
  if (session?.role !== 'operacoes') return <Navigate to="/home" replace />;
  return <main className="home-content" id="content">
    <header className="flow-heading"><div><h1>Equipamentos</h1><p>Cadastre e gerencie o acervo.</p></div></header>
    <form className="equipment-form" onSubmit={form.handleSubmit(data => save.mutate(data))}>
      <h2>{editing ? 'Editar equipamento' : 'Cadastrar equipamento'}</h2>
      <label>Nome<input className="input" {...form.register('nome')} /></label>
      <label>Patrimônio<input className="input" {...form.register('patrimonio')} /></label>
      <label>Categoria<select className="input" {...form.register('categoria')}><option value="notebook">Notebook</option><option value="monitor">Monitor</option><option value="cabo">Cabo</option><option value="camera">Câmera</option></select></label>
      <label>Situação<select className="input" {...form.register('situacao')}><option value="disponivel">Disponível</option><option value="manutencao">Em manutenção</option></select></label>
      <label>Observações<textarea className="input" {...form.register('observacoes')} /></label>
      {Object.entries(form.formState.errors).map(([key,error]) => <p role="alert" className="flow-error" key={key}>{error.message}</p>)}
      {save.error && <p role="alert" className="flow-error">{save.error.message}</p>}
      <div className="filter-row"><button className="btn btn-primary" disabled={save.isPending}>{save.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar equipamento'}</button>
        {editing && <button type="button" className="btn" onClick={() => { setEditing(undefined); form.reset(defaults); save.reset(); }}>Cancelar edição</button>}</div>
    </form>
    {message && <p role="status">{message}</p>}
    {items.isPending && <p role="status">Carregando equipamentos…</p>}
    {items.error && <div role="alert"><p>{items.error.message}</p><button className="btn" onClick={() => void items.refetch()}>Tentar novamente</button></div>}
    <div className="loan-list">{items.data?.items.map(item => <article className="loan-row" key={item.id}>
      <div><h2>{item.nome}</h2><p>{item.patrimonio} · {item.status === 'manutencao' ? 'Em manutenção' : item.status === 'emprestado' ? 'Emprestado' : 'Disponível'}</p></div>
      <button className="btn" disabled={item.status === 'emprestado'} onClick={() => {
        setEditing(item.id); save.reset(); form.reset({ nome: item.nome, patrimonio: item.patrimonio,
          categoria: item.categoria as Form['categoria'], situacao: item.status === 'manutencao' ? 'manutencao' : 'disponivel', observacoes: item.observacoes ?? '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}>Editar</button>
      <button className="btn" disabled={item.status === 'emprestado'} onClick={() => { remove.reset(); setDeleting(item); }}>Excluir</button>
    </article>)}</div>
    <div className="filter-row">{cursor && <button className="btn" onClick={() => setCursor(undefined)}>Voltar ao início</button>}{items.data?.nextCursor && <button className="btn" onClick={() => setCursor(items.data?.nextCursor ?? undefined)}>Próxima página</button>}</div>
    <Dialog.Root open={!!deleting} onOpenChange={open => { if (!open && !remove.isPending) setDeleting(null); }}><Dialog.Portal><Dialog.Overlay className="flow-overlay" /><Dialog.Content className="flow-dialog">
      <Dialog.Title>Excluir equipamento</Dialog.Title><Dialog.Description>{deleting?.nome} · {deleting?.patrimonio}. Equipamentos com histórico de empréstimo são protegidos.</Dialog.Description>
      {remove.error && <p role="alert" className="flow-error">{remove.error.message}</p>}
      <div className="filter-row"><Dialog.Close className="btn" disabled={remove.isPending}>Cancelar</Dialog.Close><button className="btn" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>Confirmar exclusão</button></div>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}
