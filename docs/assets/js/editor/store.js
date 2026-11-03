// What the editor keeps in this browser (IndexedDB "blog-editor"): drafts,
// saved as you type, and images not yet published.
const NAME = 'blog-editor';
let opened = null;

function db() {
  if (!opened) {
    opened = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('drafts')) d.createObjectStore('drafts', {keyPath: 'id'});
        if (!d.objectStoreNames.contains('images')) d.createObjectStore('images', {keyPath: 'id'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    opened.catch(() => { opened = null; });
  }
  return opened;
}

async function run(name, mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(name, mode);
    const r = fn(t.objectStore(name));
    t.oncomplete = () => resolve(r ? r.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('storage was refused'));
  });
}

export const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

export const getDraft = id => run('drafts', 'readonly', s => s.get(id));
export const putDraft = rec => run('drafts', 'readwrite', s => s.put(rec));
export const deleteDraft = id => run('drafts', 'readwrite', s => s.delete(id));
export const allDrafts = () => run('drafts', 'readonly', s => s.getAll());

export async function putImage(file) {
  const id = randomId();
  await run('images', 'readwrite', s => s.put({id, blob: file, name: file.name || 'image', type: file.type, added: Date.now()}));
  return id;
}
export const getImage = id => run('images', 'readonly', s => s.get(id));
export const allImages = () => run('images', 'readonly', s => s.getAll());
export const deleteImage = id => run('images', 'readwrite', s => s.delete(id));
