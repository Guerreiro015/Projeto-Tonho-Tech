export const IndexedDBService = {
  dbName: 'PortalRHDB',
  version: 1,
  db: null,

  abrir() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('colaboradores')) {
          db.createObjectStore('colaboradores', { keyPath: 'matricula' });
        }
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'chave' });
        }
      };

      request.onsuccess = event => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  },

  async garantirDB() {
    if (!this.db) await this.abrir();
    return this.db;
  },

  async salvarColaboradores(colaboradores = []) {
    const db = await this.garantirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readwrite');
      const store = tx.objectStore('colaboradores');
      store.clear();
      colaboradores.forEach(c => {
        if (c.matricula) store.put(c);
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async listarColaboradores() {
    const db = await this.garantirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readonly');
      const request = tx.objectStore('colaboradores').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async limparColaboradores() {
    const db = await this.garantirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('colaboradores', 'readwrite');
      tx.objectStore('colaboradores').clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
};
