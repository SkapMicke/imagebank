'use client';

import { useEffect, useMemo, useState } from 'react';
import { Upload, FolderPlus, Image as ImageIcon, Search } from 'lucide-react';

type Category = { id: string; name: string; slug: string };

type Img = {
  id: string;
  url: string;
  filename: string;
  size: number;
  createdAt: string;
  category?: Category | null;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<Img[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');

  async function loadCategories() {
    const res = await fetch('/api/categories');
    setCategories(await res.json());
  }

  async function loadImages(reset = false) {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('take', '40');

    if (!reset && cursor) params.set('cursor', cursor);
    if (categoryId) params.set('categoryId', categoryId);
    if (q) params.set('q', q);

    const res = await fetch(`/api/images?${params.toString()}`);
    const data = await res.json();

    setImages((old) => (reset ? data.images : [...old, ...data.images]));
    setCursor(data.nextCursor);
    setLoading(false);
  }

  async function createCategory() {
    if (!newCategory.trim()) return;

    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    });

    const cat = await res.json();

    setNewCategory('');
    await loadCategories();
    setCategoryId(cat.id);
  }

  async function uploadImages() {
    if (!files?.length || uploading) return;

    setUploading(true);

    const selectedFiles = Array.from(files);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      setUploadProgress(`Laddar upp ${i + 1} av ${selectedFiles.length}: ${file.name}`);

      const form = new FormData();
      form.append('file', file);

      if (categoryId) {
        form.append('categoryId', categoryId);
      }

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          failCount++;
          console.error('Upload failed:', file.name, await res.text());
          continue;
        }

        successCount++;
      } catch (error) {
        failCount++;
        console.error('Upload error:', file.name, error);
      }
    }

    setFiles(null);
    setUploadProgress('');

    const input = document.getElementById('fileInput') as HTMLInputElement | null;
    if (input) input.value = '';

    setUploading(false);

    await loadImages(true);

    if (failCount > 0) {
      alert(`Klart, men ${failCount} filer misslyckades. ${successCount} laddades upp.`);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setCursor(null);
    loadImages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId)?.name || 'Alla bilder',
    [categories, categoryId]
  );

  return (
    <main className="wrap">
      <section className="hero">
        <h1>Skap ImageBank</h1>
        <p>Ladda upp bilder från vilken enhet som helst. De sparas i molnet och kan kategoriseras.</p>
        <span className="pill">
          <ImageIcon size={15} />&nbsp; {activeCategory}
        </span>
      </section>

      <section className="panel">
        <div className="row">
          <input
            id="fileInput"
            className="file"
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => setFiles(e.target.files)}
          />

          <select
            className="select"
            value={categoryId}
            disabled={uploading}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Alla / Ingen kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button className="button" disabled={uploading || !files?.length} onClick={uploadImages}>
            <Upload size={16} /> {uploading ? 'Laddar upp...' : 'Ladda upp'}
          </button>
        </div>

        {files?.length ? <div className="progress">Valda filer: {files.length}</div> : null}
        {uploadProgress ? <div className="progress">{uploadProgress}</div> : null}
      </section>

      <section className="panel">
        <div className="row">
          <input
            className="input"
            placeholder="Ny kategori, t.ex. Dansband, Familj, Jobb..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="button dark" onClick={createCategory}>
            <FolderPlus size={16} /> Skapa kategori
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="row" style={{ flex: 1 }}>
            <input
              className="input"
              placeholder="Sök filnamn/titel..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadImages(true)}
            />
            <button className="button dark" onClick={() => loadImages(true)}>
              <Search size={16} /> Sök
            </button>
          </div>

          <span className="pill">Visar {images.length} bilder</span>
        </div>
      </section>

      {images.length === 0 ? (
        <div className="empty">Inga bilder än. Ladda upp några, din digitala hamstring börjar här.</div>
      ) : (
        <section className="grid">
          {images.map((img) => (
            <article className="card" key={img.id}>
              <a href={img.url} target="_blank">
                <img className="thumb" src={img.url} alt={img.filename} loading="lazy" />
              </a>
              <div className="meta">
                <b>{img.filename}</b>
                <span>
                  {img.category?.name || 'Ingen kategori'} · {(img.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        {cursor ? (
          <button className="button" disabled={loading} onClick={() => loadImages(false)}>
            {loading ? 'Laddar...' : 'Ladda fler'}
          </button>
        ) : null}
      </div>
    </main>
  );
}