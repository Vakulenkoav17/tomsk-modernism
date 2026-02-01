// src/components/SearchModal.jsx
import { useState, useEffect } from 'react';
import { useSearch } from '../hooks/useSearch';
import { useNavigate } from 'react-router-dom';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const { results, search, clearResults } = useSearch?.() || { results: [], search: () => {}, clearResults: () => {} };
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length > 1) {
      search(query.trim());
    } else {
      // Если строка пустая или короче 2 символов — очищаем результаты
      clearResults?.();
    }
  }, [query, search, clearResults]);

  const handleClear = () => {
    setQuery('');
    clearResults?.();
  };

  const handleResultClick = (res) => {
    if (res.type === 'Объект') navigate(`/objects/${res.id}`);
    if (res.type === 'Архитектор') navigate(`/architects/${res.id}`);
    if (res.type === 'Мозаика') navigate(`/mosaics/${res.id}`);
    onClose();
  };

  return (
    <div className="search-modal active">
      <div className="search-content">
        <button className="search-close" onClick={onClose} aria-label="Закрыть поиск">
          &times;
        </button>

        <h2>Поиск по сайту</h2>

        <div style={{ position: 'relative', marginTop: '10px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Введите ваш запрос..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          {/* Лаконичная иконка лупы справа внутри поля */}
          {query.length === 0 && (
            <div
              style={{
                position: 'absolute',
                right: '40px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#999'
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                
              </svg>
            </div>
          )}

          {/* Крестик очистки */}
          {query.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Очистить поиск"
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '18px',
                color: '#999'
              }}
            >
              &times;
            </button>
          )}
        </div>

        <div className="search-results">
          {results && results.map((res, i) => (
            <div
              key={i}
              className="search-result-item"
              onClick={() => handleResultClick(res)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleResultClick(res);
                }
              }}
            >
              <strong>{res.name}</strong><br />
              <small>{res.type}: {res.desc || res.bio || res.location}</small>
            </div>
          ))}

          {(!results || results.length === 0) && query.trim().length > 1 && (
            <div style={{ fontSize: '13px', color: '#777' }}>
              Ничего не найдено.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
