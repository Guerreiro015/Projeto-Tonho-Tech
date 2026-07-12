import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/Button';
import { LibraryService } from '../services/libraryService';

const emptyForm = { id: '', titulo: '', resumo: '', conteudo: '', categoria_id: '', status: 'RASCUNHO', publicado_em: null };

export function Library({ user }) {
  const canManage = ['ADMIN', 'RHDP'].includes(user.perfil);
  const [categorias, setCategorias] = useState([]);
  const [artigos, setArtigos] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('TODOS');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [cats, items] = await Promise.all([
        LibraryService.listarCategorias(),
        LibraryService.listarArtigos({ incluirRascunhos: canManage })
      ]);
      setCategorias(cats);
      setArtigos(items);
    } catch (error) {
      setMessage(error.message || 'Não foi possível carregar a Biblioteca RH.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [canManage]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return artigos.filter(item => {
      const matchesCategory = category === 'TODOS' || item.categoria?.nome === category;
      const haystack = `${item.titulo} ${item.resumo || ''} ${item.conteudo || ''} ${item.categoria?.nome || ''}`.toLowerCase();
      return matchesCategory && (!term || haystack.includes(term));
    });
  }, [artigos, search, category]);

  function beginCreate() { setEditing({ ...emptyForm }); setMessage(''); }
  function beginEdit(item) {
    setEditing({
      id: item.id,
      titulo: item.titulo || '',
      resumo: item.resumo || '',
      conteudo: item.conteudo || '',
      categoria_id: item.categoria_id || item.categoria?.id || '',
      status: item.status || 'RASCUNHO',
      publicado_em: item.publicado_em || null
    });
    setSelected(null);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setMessage('');
    try {
      await LibraryService.salvarArtigo(editing);
      setEditing(null);
      setMessage('Conteúdo salvo com sucesso.');
      await load();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar conteúdo.');
    } finally { setSaving(false); }
  }

  async function archive(item) {
    if (!window.confirm(`Arquivar “${item.titulo}”?`)) return;
    try {
      await LibraryService.arquivarArtigo(item);
      setSelected(null);
      setMessage('Conteúdo arquivado.');
      await load();
    } catch (error) { setMessage(error.message || 'Não foi possível arquivar.'); }
  }

  return (
    <div className="library-page">
      <section className="library-hero">
        <div>
          <span className="eyebrow">CENTRAL DE CONHECIMENTO</span>
          <h2>📚 Biblioteca RH</h2>
          <p>Procedimentos, políticas, modelos e orientações para consulta rápida.</p>
        </div>
        {canManage && <Button onClick={beginCreate}>+ Novo conteúdo</Button>}
      </section>

      <section className="library-toolbar tt-card">
        <input className="library-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar na biblioteca: vale transporte, crachá, convênio, reembolso..." />
        <div className="library-categories">
          <button className={category === 'TODOS' ? 'active' : ''} onClick={() => setCategory('TODOS')}>Todos</button>
          {categorias.filter(c => c.ativo !== false).map(c => (
            <button key={c.id} className={category === c.nome ? 'active' : ''} onClick={() => setCategory(c.nome)}>{c.icone} {c.nome}</button>
          ))}
        </div>
      </section>

      {message && <div className={message.includes('sucesso') || message.includes('arquivado') ? 'success-box' : 'error-box'}>{message}</div>}

      {loading ? <section className="tt-card">Carregando Biblioteca RH...</section> : filtered.length === 0 ? (
        <section className="tt-card library-empty"><strong>Nenhum conteúdo encontrado.</strong><span>Tente outro termo ou categoria.</span></section>
      ) : (
        <section className="library-grid">
          {filtered.map(item => (
            <article key={item.id} className="library-card" onClick={() => setSelected(item)}>
              <div className="library-card-top">
                <span className={`library-badge library-${item.categoria?.cor || 'blue'}`}>{item.categoria?.icone || '📘'} {item.categoria?.nome || 'Geral'}</span>
                {canManage && item.status !== 'PUBLICADO' && <span className="library-status">{item.status}</span>}
              </div>
              <h3>{item.titulo}</h3>
              <p>{item.resumo || 'Clique para consultar o conteúdo.'}</p>
              <footer>Atualizado em {new Date(item.atualizado_em).toLocaleDateString('pt-BR')}</footer>
            </article>
          ))}
        </section>
      )}

      {selected && <div className="modal-backdrop" onMouseDown={() => setSelected(null)}>
        <article className="modal-card library-reader" onMouseDown={e => e.stopPropagation()}>
          <div className="library-reader-head">
            <span className={`library-badge library-${selected.categoria?.cor || 'blue'}`}>{selected.categoria?.icone || '📘'} {selected.categoria?.nome || 'Geral'}</span>
            <button className="library-close" onClick={() => setSelected(null)}>×</button>
          </div>
          <h2>{selected.titulo}</h2>
          {selected.resumo && <p className="library-reader-summary">{selected.resumo}</p>}
          <div className="library-reader-content">{selected.conteudo}</div>
          <div className="library-reader-meta">Versão {selected.versao || 1} • Atualizado em {new Date(selected.atualizado_em).toLocaleString('pt-BR')}</div>
          {canManage && <div className="modal-actions"><button className="table-action" onClick={() => archive(selected)}>Arquivar</button><Button onClick={() => beginEdit(selected)}>Editar</Button></div>}
        </article>
      </div>}

      {editing && <div className="modal-backdrop">
        <form className="modal-card modal-card-wide library-editor" onSubmit={submit}>
          <h3>{editing.id ? 'Editar conteúdo' : 'Novo conteúdo da Biblioteca'}</h3>
          <div className="library-editor-grid">
            <label className="tt-field full"><span>Título</span><input required value={editing.titulo} onChange={e => setEditing({ ...editing, titulo: e.target.value })} /></label>
            <label className="tt-field"><span>Categoria</span><select required value={editing.categoria_id} onChange={e => setEditing({ ...editing, categoria_id: e.target.value })}><option value="">Selecione...</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
            <label className="tt-field"><span>Status</span><select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })}><option value="RASCUNHO">Rascunho</option><option value="PUBLICADO">Publicado</option><option value="ARQUIVADO">Arquivado</option></select></label>
            <label className="tt-field full"><span>Resumo</span><textarea rows="3" required value={editing.resumo} onChange={e => setEditing({ ...editing, resumo: e.target.value })} /></label>
            <label className="tt-field full"><span>Conteúdo</span><textarea rows="10" required value={editing.conteudo} onChange={e => setEditing({ ...editing, conteudo: e.target.value })} /></label>
          </div>
          <div className="modal-actions"><button type="button" className="table-action" onClick={() => setEditing(null)}>Cancelar</button><Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar conteúdo'}</Button></div>
        </form>
      </div>}
    </div>
  );
}
