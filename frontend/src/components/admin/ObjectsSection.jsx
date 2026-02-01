import React from 'react';
import AddressField from './AddressField';
import ArticleEditor from './ArticleEditor';

export default function ObjectsSection({
  active,
  rootRef,
  objForm,
  objAddressSuggestions,
  objActiveIndex,
  objAddressOpen,
  objAddressLoading,
  isObjReady,
  isSubmitting,
  objects,
  articleBlocks,
  previewUrl,
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
  onClearCardData,
  onEditObject,
  onDeleteObject,
}) {
  if (!active) return null;

  return (
    <div className="admin-form active" ref={rootRef}>
      <h3 className="admin-section-title">
        {objForm.mode === 'edit' ? 'Редактировать объект' : 'Добавить объект на карту'}
      </h3>

      <form onSubmit={onSubmit}>
        <AddressField
          label="Адрес"
          note="автогеокодинг"
          name="address"
          value={objForm.address}
          placeholder="ул. Ленина, 45"
          loading={objAddressLoading}
          open={objAddressOpen}
          suggestions={objAddressSuggestions}
          activeIndex={objActiveIndex}
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
              value={objForm.name}
              onChange={onFieldChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Архитектор/Автор</label>
            <input
              type="text"
              className="form-input"
              name="architect"
              value={objForm.architect}
              onChange={onFieldChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Год</label>
            <input
              type="text"
              className="form-input"
              name="year"
              value={objForm.year}
              onChange={onFieldChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-textarea"
              name="desc"
              value={objForm.desc}
              onChange={onFieldChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Фото</label>
            <input type="file" className="form-input" accept="image/*" onChange={onImageChange} />
            {previewUrl && (
              <div className="card-image-preview">
                <img src={previewUrl} alt="Превью" />
              </div>
            )}
          </div>
          {objForm.mode === 'edit' && (
            <div className="card-form-actions">
              <button type="submit" className="btn btn-primary btn-small" disabled={isSubmitting}>
                Сохранить
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={onClearCardData} disabled={isSubmitting}>
                Очистить
              </button>
            </div>
          )}
        </div>

        <ArticleEditor
          value={articleBlocks}
          onChange={onArticleChange}
          type="objects"
        />

        <div className="admin-actions">
          <button type="submit" className="btn btn-primary" disabled={!isObjReady || isSubmitting}>
            {isSubmitting
              ? 'Сохранение...'
              : objForm.mode === 'edit'
                ? 'Сохранить изменения'
                : 'Добавить объект'}
          </button>
          {objForm.mode === 'edit' && (
            <button type="button" className="btn btn-secondary" onClick={onCancelEdit} disabled={isSubmitting}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <h3 className="admin-list-title">Существующие объекты</h3>
      <div className="items-list">
        {objects.map((obj) => (
          <div key={obj.id} className="item-row">
            <div className="item-info">
              <div className="item-name">{obj.name || obj.address}</div>
              <div className="item-desc">
                {obj.architect} {obj.year && `(${obj.year})`} | {obj.address}
              </div>
            </div>
            <div className="item-actions">
              <button className="btn btn-small btn-icon" onClick={() => onEditObject(obj)}>
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M4 14.5V16h1.5L15 6.5 13.5 5 4 14.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                Редактировать
              </button>
              <button className="btn btn-small btn-danger-outline btn-icon" onClick={() => onDeleteObject(obj.id)}>
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
          </div>
        ))}
      </div>
    </div>
  );
}
