import { useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { MediaLibraryModal } from '../../Media/MediaLibraryModal';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  showPreview?: boolean;
  previewSize?: number;
  previewRounded?: boolean;
}

export function ImageUrlPicker({
  value,
  onChange,
  label = 'Image URL',
  showPreview = true,
  previewSize = 48,
  previewRounded = false,
}: Props) {
  const [showMedia, setShowMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      onChange(result.file_url);
    } catch {
      // silent
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      {showPreview && value && (
        <div style={{ marginBottom: 8, textAlign: 'center' }}>
          <img
            src={value}
            alt=""
            style={{
              width: previewSize,
              height: previewSize,
              borderRadius: previewRounded ? '50%' : 4,
              objectFit: 'cover',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowMedia(true)}
          style={{ flex: 1, fontSize: 11 }}
        >
          Browse Media
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ flex: 1, fontSize: 11 }}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>
      <div className="form-group">
        <label>{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          style={{ fontSize: 11 }}
        />
      </div>
      {showMedia && (
        <MediaLibraryModal
          onClose={() => setShowMedia(false)}
          onSelectUrl={(url) => {
            onChange(url);
            setShowMedia(false);
          }}
        />
      )}
    </>
  );
}
