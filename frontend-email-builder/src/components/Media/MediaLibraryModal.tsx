import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api';
import type { UploadedImageItem } from '../../types/api';
import { useConfigStore } from '../../store/configStore';

interface Props {
  onClose: () => void;
  onSelectUrl?: (url: string) => void;
}

const ACCEPTED_UPLOAD_TYPES = 'image/png,image/jpeg,image/gif,image/webp';
type MediaSortField = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';
const PAGE_SIZE = 24;

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
  const maxMediaFilesPerUpload = useConfigStore((s) => s.maxMediaFilesPerUpload);
  const [items, setItems] = useState<UploadedImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<MediaSortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [totalCount, setTotalCount] = useState(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestVersionRef = useRef(0);

  const loadFirstPage = useCallback(async (
    params: { q?: string; sort?: MediaSortField; order?: SortOrder },
    showLoading = true,
  ) => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    if (showLoading) setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    try {
      const response = await api.listMedia({
        ...params,
        limit: PAGE_SIZE,
        offset: 0,
      });
      if (requestVersionRef.current !== requestVersion) return;
      setItems(response.results);
      setHasMore(response.has_more);
      setNextOffset(response.next_offset);
      setTotalCount(response.total);
    } catch (nextError) {
      if (requestVersionRef.current !== requestVersion) return;
      setError(asErrorMessage(nextError));
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || nextOffset === null) return;
    const requestVersion = requestVersionRef.current;

    setIsLoadingMore(true);
    try {
      const response = await api.listMedia({
        q: searchQuery,
        sort: sortField,
        order: sortOrder,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      if (requestVersionRef.current !== requestVersion) return;
      setItems((current) => {
        const existingIds = new Set(current.map((item) => item.id));
        const appended = response.results.filter((item) => !existingIds.has(item.id));
        return [...current, ...appended];
      });
      setHasMore(response.has_more);
      setNextOffset(response.next_offset);
      setTotalCount(response.total);
    } catch (nextError) {
      if (requestVersionRef.current !== requestVersion) return;
      setError(asErrorMessage(nextError));
    } finally {
      if (requestVersionRef.current === requestVersion) {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoading, isLoadingMore, nextOffset, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFirstPage(
        {
          q: searchQuery,
          sort: sortField,
          order: sortOrder,
        },
        true,
      );
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [loadFirstPage, searchQuery, sortField, sortOrder]);

  useEffect(() => {
    const panel = panelRef.current;
    const sentinel = sentinelRef.current;
    if (!panel || !sentinel || !hasMore || isLoading || isLoadingMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      {
        root: panel,
        rootMargin: '220px 0px',
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    if (files.length === 0) return;
    const input = event.currentTarget;

    if (files.length > maxMediaFilesPerUpload) {
      setError(`You can upload at most ${maxMediaFilesPerUpload} files at once.`);
      input.value = '';
      return;
    }

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
          const uploaded = await api.uploadImage(file, { uploadBatchSize: files.length });
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

      await loadFirstPage(
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
      <div className="media-modal-panel" ref={panelRef} onClick={(event) => event.stopPropagation()}>
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
          <>
            <div className="media-grid">
              {items.map((item) => (
                <article key={item.id} className="media-card">
                  <img
                    src={item.thumbnail_url || item.url}
                    alt=""
                    loading="lazy"
                    className="media-card-image"
                  />
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
            <div className="media-modal-footer">
              <span>{`Showing ${items.length}${totalCount > 0 ? ` of ${totalCount}` : ''}`}</span>
              <span>
                {isLoadingMore ? 'Loading more...' : hasMore ? 'Scroll to load more' : 'All media loaded'}
              </span>
            </div>
            <div ref={sentinelRef} className="media-modal-sentinel" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
