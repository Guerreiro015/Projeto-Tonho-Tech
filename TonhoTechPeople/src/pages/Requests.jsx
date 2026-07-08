import { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { RequestService } from '../services/requestService';

export function Requests({ user }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { RequestService.minhas(user).then(setRows); }, [user]);
  return (
    <Card title={user.perfil === 'SUPORTE' ? 'Minhas Solicitações' : 'Solicitações'}>
      <table className="tt-table"><thead><tr><th>Protocolo</th><th>Colaborador</th><th>Tipo</th><th>Regional</th><th>Status</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.protocolo}</td><td>{r.colaborador_nome}</td><td>{r.tipo}</td><td>{r.regional_colaborador}</td><td>{r.status}</td></tr>)}</tbody></table>
    </Card>
  );
}
