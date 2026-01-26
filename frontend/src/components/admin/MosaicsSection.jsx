import React from 'react';
import AddressField from './AddressField';
import ArticleEditor from './ArticleEditor';

export default function MosaicsSection({
  active,
  rootRef,
  mosaicForm,
  mosaicAddressSuggestions,
  mosaicActiveIndex,
  mosaicAddressOpen,
  mosaicAddressLoading,
  isMosaicReady,
  isSubmitting,
  mosaics,
  articleBlocks,
  onArticleChange,
  onFieldChange,
  onAddressChange,
  onImageChange,
  onSuggestionKeyDown,
  onAddressKeyDown,
  onSelectSuggestion,
  onAddressFocus,
  onAddressBlur,
  onSubmit,
  onCancelEdit,
  onEditMosaic,
  onDeleteMosaic,
}) {
  if (!active) return null;

  return (
    <div className="admin-form active" ref={rootRef}>
      <h3 className="admin-section-title">
        {mosaicForm.mode === 'edit' ? 'Редактировать мозаику' : 'Добавить мозаику на карту'}
      </h3>

      <form onSubmit={onSubmit}>
        <AddressField
          label="Адрес"
          note="автогеокодинг"
          name="location"
          value={mosaicForm.location}
          placeholder="ул. Ленина, 45"
          loading={mosaicAddressLoading}
          open={mosaicAddressOpen}
          suggestions={mosaicAddressSuggestions}
          activeIndex={mosaicActiveIndex}
          onChange={onAddressChange}
          onKeyDown={(e) => {
            onSuggestionKeyDown(e);
            onAddressKeyDown(e);
          }}
          onFocus={onAddressFocus}
          onBlur={onAddressBlur}
          onSelectSuggestion={onSelectSuggestion}
          required
        />

        <div className="card-form-section">
          <h4 className="card-form-title">Данные карточки</h4>
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input
              type="text"
              className="form-input"
              name="name"
              value={mosaicForm.name}
              onChange={onFieldChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Архитектор/Автор</label>
            <input
              type="text"
              className="form-input"
              name="author"
              value={mosaicForm.author}
              onChange={onFieldChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Год</label>
            <input
              type="text"
              className="form-input"
              name="year"
              value={mosaicForm.year}
              onChange={onFieldChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-textarea"
              name="desc"
              value={mosaicForm.desc}
              onChange={onFieldChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Фото</label>
            <input type="file" className="form-input" accept="image/*" onChange={onImageChange} />
          </div>
        </div>

        <ArticleEditor
          value={articleBlocks}
          onChange={onArticleChange}
          type="mosaics"
        />

        <div className="admin-actions">
          <button type="submit" className="btn btn-primary" disabled={!isMosaicReady || isSubmitting}>
            {isSubmitting
              ? 'Сохранение...'
              : mosaicForm.mode === 'edit'
                ? 'Сохранить изменения'
                : 'Добавить мозаику'}
          </button>
          {mosaicForm.mode === 'edit' && (
            <button type="button" className="btn btn-secondary" onClick={onCancelEdit} disabled={isSubmitting}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="admin-list-title">Существующие мозаики</h3>
      <div className="items-list">
        {mosaics.map((mosaic) => (
          <div key={mosaic.id} className="item-row">
            <div className="item-info">
              <div className="item-name">{mosaic.name}</div>
              <div className="item-desc">{mosaic.location}</div>
            </div>
            <div className="item-actions">
              <button className="btn btn-small" onClick={() => onEditMosaic(mosaic)}>
                Редактировать
              </button>
              <button className="btn btn-small btn-delete" onClick={() => onDeleteMosaic(mosaic.id)}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
