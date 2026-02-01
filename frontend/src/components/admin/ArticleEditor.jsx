import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL, apiForm } from '../../api/client';
import useSmoothScroll from '../../hooks/useSmoothScroll';

const MAX_IMAGES = 5;

export default function ArticleEditor({ value, onChange, type }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [scrollToken, setScrollToken] = useState(0);
  const blocks = Array.isArray(value) ? value : [];
  const editorRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const smoothScroll = useSmoothScroll();

  const updateBlocks = (next) => {
    if (onChange) onChange(next);
  };

  const handleAddBlock = () => {
    const nextId = Date.now();
    updateBlocks([...blocks, { id: nextId, text: '', images: [], caption: '' }]);
    pendingScrollRef.current = { type: 'add', id: nextId };
    setScrollToken(Date.now());
  };

  const handleRemoveBlock = (id) => {
    const currentIndex = blocks.findIndex((block) => block.id === id);
    const prevBlock = currentIndex > 0 ? blocks[currentIndex - 1] : null;
    pendingScrollRef.current = { type: 'remove', id: prevBlock ? prevBlock.id : null };
    setScrollToken(Date.now());
    updateBlocks(blocks.filter((block) => block.id !== id));
  };

  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending) return;
    pendingScrollRef.current = null;
    const scrollToTarget = () => {
      if (pending.type === 'add' && pending.id) {
        const target = document.querySelector(`[data-block-id="${pending.id}"]`);
        if (target) smoothScroll(target, 120, 600);
        return;
      }
      if (pending.type === 'remove') {
        if (pending.id) {
          const target = document.querySelector(`[data-block-id="${pending.id}"]`);
          if (target) smoothScroll(target, 120, 500);
          return;
        }
        if (editorRef.current) smoothScroll(editorRef.current, 120, 500);
      }
    };
    requestAnimationFrame(scrollToTarget);
  }, [scrollToken, blocks.length, smoothScroll]);

  const handleTextChange = (id, text) => {
    updateBlocks(blocks.map((block) => (block.id === id ? { ...block, text } : block)));
  };

  const handleCaptionChange = (id, caption) => {
    updateBlocks(blocks.map((block) => (block.id === id ? { ...block, caption } : block)));
  };

  const handleRemoveImage = (id, index) => {
    updateBlocks(
      blocks.map((block) => {
        if (block.id !== id) return block;
        const nextImages = block.images.filter((_, i) => i !== index);
        return { ...block, images: nextImages };
      })
    );
  };

  const handleImagesChange = async (id, files) => {
    const block = blocks.find((item) => item.id === id);
    if (!block) return;
    const currentCount = block.images.length;
    const fileList = Array.from(files).slice(0, MAX_IMAGES - currentCount);
    if (fileList.length === 0) return;

    const formData = new FormData();
    formData.append('type', type);
    fileList.forEach((file) => formData.append('images', file));

    try {
      setUploadingId(id);
      const data = await apiForm('/api/uploads', 'POST', formData);
      const newImages = Array.isArray(data.files) ? data.files : [];
      updateBlocks(
        blocks.map((item) => {
          if (item.id !== id) return item;
          return { ...item, images: [...item.images, ...newImages] };
        })
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const resolveImageUrl = (value) => {
    if (!value) return '';
    return value.startsWith('http') ? value : `${API_URL}${value}`;
  };

  return (
    <div className="article-editor" ref={editorRef}>
      <div className="article-editor-header">
        <h4 className="card-form-title">Статья</h4>
        {blocks.length === 0 && (
          <button type="button" className="btn btn-small btn-icon" onClick={handleAddBlock}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M10 4v12M4 10h12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Добавить статью
          </button>
        )}
      </div>

      {blocks.length === 0 && <div className="article-empty">Абзацев пока нет.</div>}

      {blocks.map((block, index) => (
        <div key={block.id} className="article-editor-block" data-block-id={block.id}>
          <div className="article-editor-top">
            <div className="article-editor-title">Абзац {index + 1}</div>
            <button
              type="button"
              className="btn btn-small btn-danger-outline btn-icon"
              onClick={() => handleRemoveBlock(block.id)}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path
                  d="M5 6.5h10M8 6.5v8M12 6.5v8M7.5 6.5l1-2h3l1 2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Удалить
            </button>
          </div>

          <div className="article-editor-media">
            {block.images.length > 0 && (
              <div className="article-editor-thumbs">
                {block.images.map((img, imgIndex) => (
                  <div key={`${block.id}-${imgIndex}`} className="article-thumb">
                    <img src={resolveImageUrl(img)} alt="" />
                    <button
                      type="button"
                      className="article-thumb-remove"
                      onClick={() => handleRemoveImage(block.id, imgIndex)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="article-upload">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleImagesChange(block.id, event.target.files)}
                disabled={uploadingId === block.id || block.images.length >= MAX_IMAGES}
              />
              {uploadingId === block.id
                ? 'Загрузка...'
                : block.images.length >= MAX_IMAGES
                  ? `Можно до ${MAX_IMAGES} фото`
                  : 'Загрузить фото'}
            </label>
          </div>

          <textarea
            className="form-textarea"
            placeholder="Текст абзаца"
            value={block.text}
            onChange={(event) => handleTextChange(block.id, event.target.value)}
          />
          <input
            type="text"
            className="form-input"
            placeholder="О фотографии"
            value={block.caption || ''}
            onChange={(event) => handleCaptionChange(block.id, event.target.value)}
          />

          {index === blocks.length - 1 && (
            <div className="article-editor-actions">
              <button type="button" className="btn btn-small btn-icon" onClick={handleAddBlock}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M10 4v12M4 10h12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Добавить абзац
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
