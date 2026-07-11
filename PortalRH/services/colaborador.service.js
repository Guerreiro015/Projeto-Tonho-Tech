import { ExcelService } from './excel.service.js';
import { UI } from '../core/ui.js';

export const ColaboradorService = {
  iniciar(){ document.getElementById('txtPesquisa').addEventListener('input', e=>this.buscar(e.target.value)); },
  buscar(texto){
    const lista=document.getElementById('listaPesquisa'); lista.innerHTML='';
    const resultados=ExcelService.pesquisar(texto);
    const usuario = window.PortalRH?.usuario;
    const regional = String(usuario?.regional || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const suporte = usuario?.perfil === 'Suporte Regional';
    const permiteTodas = !regional || ['todas','todos','geral','matriz'].includes(regional);
    resultados
      .filter(c => !suporte || permiteTodas || String(c.folha || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') === regional)
      .forEach(c=>{
      const item=document.createElement('div'); item.className='result-item';
      item.innerHTML=`<strong>${UI.safe(c.nome)}</strong><br><small>Matrícula: ${UI.safe(c.matricula)} • ${UI.safe(c.cargo)} • Regional: ${UI.safe(c.folha)}</small>`;
      item.addEventListener('click',()=>this.selecionar(c)); lista.appendChild(item);
    });
  },
  selecionar(c){
    window.PortalRH.colaborador=c;
    document.getElementById('txtPesquisa').value=c.nome;
    document.getElementById('listaPesquisa').innerHTML='';
    const set=(id,val)=>document.getElementById(id).textContent=val || '---';
    if (window.PortalRH?.usuario?.perfil === 'Suporte Regional') {
      const regional = String(window.PortalRH.usuario.regional || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      const permiteTodas = !regional || ['todas','todos','geral','matriz'].includes(regional);
      const regionalColab = String(c.folha || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      if (!permiteTodas && regionalColab !== regional) {
        UI.toast('Regional não permitida', 'Este colaborador pertence a outra regional.');
        return;
      }
    }
    set('nomeColaborador',c.nome); set('matriculaColaborador',c.matricula); set('cpfColaborador',c.cpf); set('cargoColaborador',c.cargo); set('empresaColaborador',c.empresa); set('folhaColaborador',c.folha); set('admissaoColaborador',c.admissao); set('horarioColaborador',c.horario); set('situacaoColaborador',c.situacao);
    const st=document.getElementById('statusColaborador'); st.textContent='Colaborador selecionado'; st.className='pill ok';
    if (window.PortalRH && typeof window.PortalRH.atualizarHistoricoColaborador === 'function') {
      window.PortalRH.atualizarHistoricoColaborador();
      if (typeof window.PortalRH.atualizarInteligencia === 'function') window.PortalRH.atualizarInteligencia();
    }
    UI.toast('Colaborador selecionado', c.nome);
  }
};
