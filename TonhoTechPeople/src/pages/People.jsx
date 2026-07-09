import { useState } from 'react';
import { PeopleService } from '../services/peopleService';
import { Card } from '../components/Card';

export function People({ user, onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  async function search(value) {
    setQ(value);
    if (value.length < 2) return setResults([]);
    setResults(await PeopleService.pesquisar(value, user));
  }
  return (
    <Card title="Pesquisar Colaborador">
      <input className="search-input" value={q} onChange={e => search(e.target.value)} placeholder="Digite matrícula, nome ou CPF" />
      <div className="results-list">
        {results.map(c => (
          <button key={c.id || c.matricula} onClick={() => onSelect(c)}>
            <strong>{c.nome}</strong><span>{c.matricula} • {c.cargo} • {c.regional}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
