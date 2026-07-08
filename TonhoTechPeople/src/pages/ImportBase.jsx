import { useState } from 'react';
import { PeopleService } from '../services/peopleService';
import { Card } from '../components/Card';

export function ImportBase() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const data = await PeopleService.importarExcel(file);
      setResult(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card title="Importar Base de Colaboradores">
      <p>Selecione o arquivo <strong>QUADRO GERAL.xlsm</strong>. A coluna <strong>Folha</strong> será usada como Regional.</p>
      <input type="file" accept=".xlsx,.xls,.xlsm" onChange={handleFile} />
      {loading && <p>Sincronizando com Supabase...</p>}
      {result && <div className="success-box">Base importada: {result.colaboradores.length} colaboradores e {result.regionais.length} regionais.</div>}
    </Card>
  );
}
