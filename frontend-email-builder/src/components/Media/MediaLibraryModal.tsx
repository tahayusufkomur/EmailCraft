import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { UploadedImageItem } from '../../types/api';

interface Props {
  onClose: () => void;
  onSelectUrl?: (url: string) => void;
}

const ACCEPTED_UPLOAD_TYPES = 'image/png,image/jpeg,image/gif,image/webp';
type MediaSortField = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const asErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Something went wrong while loading media.';
};

export function MediaLibraryModal({ onClose, onSelectUrl }: Props) {
  const [items, setItems] = useState<UploadedImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<MediaSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async (
    params: { q?: string; sort?: MediaSortField; order?: SortOrder },
    showLoading = true,
  ) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await api.listMedia(params);
      setItems(response.results);
    } catch (nextError) {
      setError(asErrorMessage(nextError));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadMedia(
        {
          q: searchQuery,
          sort: sortField,
          order: sortOrder,
        },
        true,
      );
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [loadMedia, searchQuery, sortField, sortOrder]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    if (files.length === 0) return;
    const input = event.currentTarget;

    setIsUploading(true);
    setUploadProgress({ completed: 0, total: files.length });
    setError(null);

    let firstUploadedUrl: string | null = null;
    let successfulUploads = 0;
    const failedFiles: string[] = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        try {
          const uploaded = await api.uploadImage(file);
          successfulUploads += 1;
          if (!firstUploadedUrl) {
            firstUploadedUrl = uploaded.file_url;
          }
        } catch {
          failedFiles.push(file.name);
        } finally {
          setUploadProgress({ completed: index + 1, total: files.length });
        }
      }

      await loadMedia(
        {
          q: searchQuery,
          sort: sortField,
          order: sortOrder,
        },
        false,
      );

      if (failedFiles.length > 0) {
        setError(`Uploaded ${successfulUploads}/${files.length}. Failed: ${failedFiles.join(', ')}`);
      }

      if (onSelectUrl && files.length === 1 && firstUploadedUrl) {
        onSelectUrl(firstUploadedUrl);
        onClose();
      }
    } finally {
      input.value = '';
      setUploadProgress(null);
      setIsUploading(false);
    }
  };

  const handleCopyUrl = async (item: UploadedImageItem) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(item.url);
        setCopiedItemId(item.id);
        window.setTimeout(() => {
          setCopiedItemId((current) => (current === item.id ? null : current));
        }, 1200);
      }
    } catch {
      setError('Unable to copy URL to clipboard.');
    }
  };

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="media-modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>Media Library</h2>
          <div className="media-modal-header-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading && uploadProgress
                ? `Uploading ${uploadProgress.completed}/${uploadProgress.total}...`
                : 'Upload photos'}
            </button>
            <button className="btn" type="button" onClick={onClose} aria-label="Close media modal">
              &times;
            </button>
          </div>
        </div>

        <input
          ref={uploadInputRef}
          type="file"
          accept={ACCEPTED_UPLOAD_TYPES}
          multiple
          style={{ display: 'none' }}
          onChange={handleUpload}
        />

        {error && <div className="media-modal-error">{error}</div>}

        <div className="media-modal-controls">
          <label className="media-modal-control">
            <span>Search</span>
            <input
              type="text"
              className="media-modal-input"
              placeholder="Search by filename"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <label className="media-modal-control">
            <span>Sort by</span>
            <select
              className="media-modal-select"
              value={sortField}
              onChange={(event) => setSortField(event.target.value as MediaSortField)}
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
          </label>

          <label className="media-modal-control">
            <span>Order</span>
            <select
              className="media-modal-select"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="media-modal-empty">Loading media...</div>
        ) : items.length === 0 ? (
          <div className="media-modal-empty">
            {hasSearch
              ? 'No media found for this search.'
              : 'No uploaded media yet. Upload photos to start reusing them across templates.'}
          </div>
        ) : (
          <div className="media-grid">
            {items.map((item) => (
              <article key={item.id} className="media-card">
                <img src={item.url} alt="" loading="lazy" className="media-card-image" />
                <div className="media-card-name" title={item.filename || 'Untitled'}>
                  {item.filename || 'Untitled'}
                </div>
                <div className="media-card-meta">
                  <span>{formatBytes(item.file_size)}</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <div className="media-card-actions">
                  {onSelectUrl && (
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => {
                        onSelectUrl(item.url);
                        onClose();
                      }}
                    >
                      Use image
                    </button>
                  )}
                  <button className="btn" type="button" onClick={() => void handleCopyUrl(item)}>
                    {copiedItemId === item.id ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
