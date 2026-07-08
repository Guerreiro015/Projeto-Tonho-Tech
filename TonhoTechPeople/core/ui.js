export const UI = {
  hideLoader(){ const el=document.getElementById('loader'); if(el) el.style.display='none'; },
  toast(titulo='Sucesso', mensagem='Operação realizada.'){ const t=document.getElementById('toast'); document.getElementById('toastTitulo').textContent=titulo; document.getElementById('toastMensagem').textContent=mensagem; t.classList.add('show'); clearTimeout(this._timer); this._timer=setTimeout(()=>t.classList.remove('show'),3200); },
  setTitle(titulo, subtitulo=''){ document.getElementById('tituloTela').textContent=titulo; document.getElementById('subtituloTela').textContent=subtitulo; },
  darkToggle(){ document.body.classList.toggle('dark'); localStorage.setItem('portal-theme', document.body.classList.contains('dark')?'dark':'light'); },
  loadTheme(){ if(localStorage.getItem('portal-theme')==='dark') document.body.classList.add('dark'); },
  safe(v){ return String(v ?? '').replace(/[&<>'"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch])); }
};
