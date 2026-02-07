import type { ImageBlock as ImageBlockType } from '../../types/blocks';
import { useEditorStore } from '../../store/editorStore';
import { useRef, useState } from 'react';
import { api } from '../../lib/api';
import { applyImageUrlToBlock } from '../../lib/media';
import { MediaLibraryModal } from '../Media/MediaLibraryModal';

interface Props {
  block: ImageBlockType;
}

export function ImageBlock({ block }: Props) {
  const updateBlock = useEditorStore((s) => s.updateBlock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const input = e.currentTarget;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      let firstUploadedUrl: string | null = null;
      let successfulUploads = 0;
      const failedFiles: string[] = [];

      for (const file of files) {
        try {
          const uploaded = await api.uploadImage(file);
          successfulUploads += 1;
          if (!firstUploadedUrl) {
            firstUploadedUrl = uploaded.file_url;
          }
        } catch {
          failedFiles.push(file.name);
        }
      }

      if (firstUploadedUrl) {
        applyImageUrlToBlock(block, firstUploadedUrl, updateBlock);
      }

      if (failedFiles.length > 0) {
        setErrorMessage(`Uploaded ${successfulUploads}/${files.length}. Failed: ${failedFiles.join(', ')}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.trim().length > 0) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to upload image.');
      }
    } finally {
      input.value = '';
      setIsUploading(false);
    }
  };

  if (!block.data.src) {
    return (
      <>
        <div className="image-block-placeholder">
          <span style={{ fontSize: 24 }}>&#x1F5BC;</span>
          <span>{isUploading ? 'Uploading image...' : 'Add an image'}</span>
          <div className="image-block-placeholder-actions">
            <button
              className="btn"
              type="button"
              onClick={() => setShowMediaLibrary(true)}
              disabled={isUploading}
            >
              Select existing
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Upload new photo
            </button>
          </div>
          {errorMessage && <span className="image-block-error">{errorMessage}</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
        {showMediaLibrary && (
          <MediaLibraryModal
            onClose={() => setShowMediaLibrary(false)}
            onSelectUrl={(url) => {
              applyImageUrlToBlock(block, url, updateBlock);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="image-block-content" style={{ textAlign: block.style.alignment || 'center' }}>
      <img
        src={block.data.src}
        alt={block.data.alt}
        style={{ maxWidth: block.data.width, width: '100%' }}
      />
    </div>
  );
}
