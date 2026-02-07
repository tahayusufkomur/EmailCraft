import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { UploadedImageItem } from '../../types/api';

interface Props {
  onClose: () => void;
  onSelectUrl?: (url: string) => void;
}

const ACCEPTED_UPLOAD_TYPES = 'image/png,image/jpeg,image/gif,image/webp';

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
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await api.listMedia();
      setItems(response.results);
    } catch (nextError) {
      setError(asErrorMessage(nextError));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const input = event.currentTarget;

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await api.uploadImage(file);
      await loadMedia(false);
      if (onSelectUrl) {
        onSelectUrl(uploaded.file_url);
        onClose();
      }
    } catch (nextError) {
      setError(asErrorMessage(nextError));
    } finally {
      input.value = '';
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
              {isUploading ? 'Uploading...' : 'Upload new photo'}
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
          style={{ display: 'none' }}
          onChange={handleUpload}
        />

        {error && <div className="media-modal-error">{error}</div>}

        {isLoading ? (
          <div className="media-modal-empty">Loading media...</div>
        ) : items.length === 0 ? (
          <div className="media-modal-empty">
            No uploaded media yet. Upload a photo to start reusing it across templates.
          </div>
        ) : (
          <div className="media-grid">
            {items.map((item) => (
              <article key={item.id} className="media-card">
                <img src={item.url} alt="" loading="lazy" className="media-card-image" />
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
