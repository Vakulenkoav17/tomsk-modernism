import React from 'react';
import ArticleEditor from './ArticleEditor';

export default function ArchitectsSection({
  active,
  rootRef,
  archForm,
  architects,
  isSubmitting,
  articleBlocks,
  onArticleChange,
  onArchInputChange,
  onArchImageChange,
  onSubmit,
  onCancelEdit,
  onEditArchitect,
  onDeleteArchitect,
}) {
  if (!active) return null;

  return (
    <div className="admin-form active" ref={rootRef}>
      <h3 className="admin-section-title">
        {archForm.mode === 'edit' ? 'Редактировать архитектора' : 'Добавить архитектора'}
      </h3>

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label className="form-label">Имя *</label>
          <input
            type="text"
            className="form-input"
            name="name"
            value={archForm.name}
            onChange={onArchInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Годы жизни</label>
          <input
            type="text"
            className="form-input"
            name="years"
            value={archForm.years}
            onChange={onArchInputChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Биография</label>
          <textarea
            className="form-textarea"
            name="bio"
            value={archForm.bio}
            onChange={onArchInputChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Фото</label>
          <input type="file" className="form-input" accept="image/*" onChange={onArchImageChange} />
        </div>

        <ArticleEditor
          value={articleBlocks}
          onChange={onArticleChange}
          type="architects"
        />

        <div className="admin-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? 'Сохранение...'
              : archForm.mode === 'edit'
                ? 'Сохранить изменения'
                : 'Добавить архитектора'}
          </button>
          {archForm.mode === 'edit' && (
            <button type="button" className="btn btn-secondary" onClick={onCancelEdit} disabled={isSubmitting}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="admin-list-title">Существующие архитекторы</h3>
      <div className="items-list">
        {architects.map((arch) => (
          <div key={arch.id} className="item-row">
            <div className="item-info">
              <div className="item-name">{arch.name}</div>
              <div className="item-desc">{arch.years}</div>
            </div>
            <div className="item-actions">
              <button className="btn btn-small" onClick={() => onEditArchitect(arch)}>
                Редактировать
              </button>
              <button className="btn btn-small btn-delete" onClick={() => onDeleteArchitect(arch.id)}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
