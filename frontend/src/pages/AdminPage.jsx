import { useEffect, useRef, useState } from 'react';
import { useObjects } from '../hooks/useObjects';
import { useArchitects } from '../hooks/useArchitects';
import { useMosaics } from '../hooks/useMosaics';
import useAddressSuggestions from '../hooks/useAddressSuggestions';
import AdminDrawMap from '../components/AdminDrawMap';
import ObjectsSection from '../components/admin/ObjectsSection';
import ArchitectsSection from '../components/admin/ArchitectsSection';
import MosaicsSection from '../components/admin/MosaicsSection';
import { API_URL } from '../api/client';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('objects');

  const [objForm, setObjForm] = useState({
    id: null,
    mode: 'create',
    address: '',
    name: '',
    architect: '',
    year: '',
    desc: '',
    image: null,
    articleBlocks: [],
    lat: '',
    lng: '',
    polygonCoords: [],
  });

  const [archForm, setArchForm] = useState({
    id: null,
    mode: 'create',
    name: '',
    years: '',
    bio: '',
    image: null,
    articleBlocks: [],
  });

  const [mosaicForm, setMosaicForm] = useState({
    id: null,
    mode: 'create',
    name: '',
    author: '',
    year: '',
    location: '',
    desc: '',
    image: null,
    articleBlocks: [],
    lat: '',
    lng: '',
    polygonCoords: [],
  });

  const [objResolveLoading, setObjResolveLoading] = useState(false);
  const [mosaicResolveLoading, setMosaicResolveLoading] = useState(false);
  const [objAddressSelected, setObjAddressSelected] = useState(false);
  const [mosaicAddressSelected, setMosaicAddressSelected] = useState(false);
  const [archPreviewUrl, setArchPreviewUrl] = useState('');
  const [objSubmitting, setObjSubmitting] = useState(false);
  const [mosaicSubmitting, setMosaicSubmitting] = useState(false);
  const [archSubmitting, setArchSubmitting] = useState(false);
  const objFormRef = useRef(null);
  const mosaicFormRef = useRef(null);
  const archFormRef = useRef(null);

  const { objects, addObject, updateObject, deleteObject } = useObjects();
  const { architects, addArchitect, updateArchitect, deleteArchitect } = useArchitects();
  const { mosaics, addMosaic, updateMosaic, deleteMosaic } = useMosaics();

  const objAddress = useAddressSuggestions({
    value: objForm.address,
    setValue: (next) => setObjForm((prev) => ({ ...prev, address: next })),
    onInputChange: () => setObjAddressSelected(false),
    onSelectFinal: () => setObjAddressSelected(true),
  });

  const mosaicAddress = useAddressSuggestions({
    value: mosaicForm.location,
    setValue: (next) => setMosaicForm((prev) => ({ ...prev, location: next })),
    onInputChange: () => setMosaicAddressSelected(false),
    onSelectFinal: () => setMosaicAddressSelected(true),
  });

  const objAddressLoading = objAddress.loading || objResolveLoading;
  const mosaicAddressLoading = mosaicAddress.loading || mosaicResolveLoading;

  const isObjReady =
    objForm.address.trim().length >= 5 &&
    objForm.polygonCoords.length >= 3 &&
    objAddressSelected &&
    !objAddressLoading;

  const isMosaicReady =
    mosaicForm.location.trim().length >= 5 &&
    mosaicForm.polygonCoords.length >= 3 &&
    mosaicAddressSelected &&
    !mosaicAddressLoading;

  const handleObjFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setObjForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMosaicFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMosaicForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleArchInputChange = (e) => {
    const { name, value } = e.target;
    setArchForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleObjectPolygonChange = (coords) => {
    setObjForm((prev) => ({
      ...prev,
      polygonCoords: coords,
      ...(coords.length > 0 && !prev.lat && !prev.lng && {
        lat: coords[0][0],
        lng: coords[0][1],
      }),
    }));
    if (coords.length >= 3) setObjAddressSelected(true);
  };

  const handleMosaicPolygonChange = (coords) => {
    setMosaicForm((prev) => ({
      ...prev,
      polygonCoords: coords,
      ...(coords.length > 0 && !prev.lat && !prev.lng && {
        lat: coords[0][0],
        lng: coords[0][1],
      }),
    }));
    if (coords.length >= 3) setMosaicAddressSelected(true);
  };

  const handleObjectResolve = ({ lat, lng, polygonCoords: resolvedPolygon }) => {
    setObjForm((prev) => ({
      ...prev,
      lat: lat || prev.lat,
      lng: lng || prev.lng,
      polygonCoords:
        resolvedPolygon && resolvedPolygon.length >= 3 ? resolvedPolygon : prev.polygonCoords,
    }));
    setObjAddressSelected(true);
  };

  const handleMosaicResolve = ({ lat, lng, polygonCoords: resolvedPolygon }) => {
    setMosaicForm((prev) => ({
      ...prev,
      lat: lat || prev.lat,
      lng: lng || prev.lng,
      polygonCoords:
        resolvedPolygon && resolvedPolygon.length >= 3 ? resolvedPolygon : prev.polygonCoords,
    }));
    setMosaicAddressSelected(true);
  };

  const getObjectCenter = () => {
    if (objForm.lat && objForm.lng) return [Number(objForm.lat), Number(objForm.lng)];
    if (objForm.polygonCoords?.length > 0) return objForm.polygonCoords[0];
    return [56.4866, 84.9719];
  };

  const getMosaicCenter = () => {
    if (mosaicForm.lat && mosaicForm.lng) return [Number(mosaicForm.lat), Number(mosaicForm.lng)];
    if (mosaicForm.polygonCoords?.length > 0) return mosaicForm.polygonCoords[0];
    return [56.4866, 84.9719];
  };

  const scrollToForm = (ref) => {
    if (!ref?.current) return;
    requestAnimationFrame(() => {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (!archForm.image) {
      setArchPreviewUrl('');
      return undefined;
    }

    if (archForm.image instanceof File) {
      const previewUrl = URL.createObjectURL(archForm.image);
      setArchPreviewUrl(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }

    const resolved = archForm.image.startsWith('http')
      ? archForm.image
      : `${API_URL}${archForm.image}`;
    setArchPreviewUrl(resolved);
    return undefined;
  }, [archForm.image]);

  const handleAddOrUpdateObject = async (e) => {
    e.preventDefault();
    if (objSubmitting) return;
    if (!isObjReady) {
      toast.error('Пожалуйста, выберите адрес и завершите обвод.');
      return;
    }

    try {
      setObjSubmitting(true);
      const coords = objForm.lat && objForm.lng ? [objForm.lat, objForm.lng] : null;
      if (!coords && objForm.polygonCoords.length === 0) {
        toast.error('Сначала задайте контур здания.');
        setObjSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('address', objForm.address);
      formData.append('isUnique', false);
      formData.append('hasCard', true);
      formData.append('lat', objForm.lat || coords?.[0] || '');
      formData.append('lng', objForm.lng || coords?.[1] || '');
      formData.append('type', 'objects');

      if (objForm.polygonCoords?.length > 0) {
        formData.append('polygonCoords', JSON.stringify(objForm.polygonCoords));
      }

      formData.append('name', objForm.name);
      formData.append('architect', objForm.architect);
      formData.append('year', objForm.year);
      formData.append('desc', objForm.desc);
      formData.append('articleBlocks', JSON.stringify(objForm.articleBlocks || []));

      if (objForm.image instanceof File) {
        formData.append('image', objForm.image);
      }

      if (objForm.mode === 'edit' && objForm.id) {
        await updateObject(objForm.id, formData);
        toast.success('Объект обновлен.');
      } else {
        await addObject(formData);
        toast.success('Объект добавлен.');
      }

      setObjForm({
        id: null,
        mode: 'create',
        address: '',
        name: '',
        architect: '',
        year: '',
        desc: '',
        image: null,
        articleBlocks: [],
        lat: '',
        lng: '',
        polygonCoords: [],
      });
      setObjAddressSelected(false);
      objAddress.setOpen(false);
    } catch (err) {
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setObjSubmitting(false);
    }
  };

  const handleAddOrUpdateMosaic = async (e) => {
    e.preventDefault();
    if (mosaicSubmitting) return;
    if (!isMosaicReady) {
      toast.error('Пожалуйста, выберите адрес и завершите обвод.');
      return;
    }

    try {
      setMosaicSubmitting(true);
      const formData = new FormData();
      formData.append('name', mosaicForm.name);
      formData.append('author', mosaicForm.author);
      formData.append('year', mosaicForm.year);
      formData.append('location', mosaicForm.location);
      formData.append('desc', mosaicForm.desc);
      formData.append('articleBlocks', JSON.stringify(mosaicForm.articleBlocks || []));
      formData.append('type', 'mosaics');
      formData.append('lat', mosaicForm.lat || '');
      formData.append('lng', mosaicForm.lng || '');
      formData.append('isUnique', false);
      formData.append('hasCard', true);

      if (mosaicForm.polygonCoords?.length > 0) {
        formData.append('polygonCoords', JSON.stringify(mosaicForm.polygonCoords));
      }

      if (mosaicForm.image instanceof File) formData.append('image', mosaicForm.image);

      if (mosaicForm.mode === 'edit' && mosaicForm.id) {
        await updateMosaic(mosaicForm.id, formData);
        toast.success('Мозаика обновлена.');
      } else {
        await addMosaic(formData);
        toast.success('Мозаика добавлена.');
      }

      setMosaicForm({
        id: null,
        mode: 'create',
        name: '',
        author: '',
        year: '',
        location: '',
        desc: '',
        image: null,
        articleBlocks: [],
        lat: '',
        lng: '',
        polygonCoords: [],
      });
      setMosaicAddressSelected(false);
      mosaicAddress.setOpen(false);
    } catch (err) {
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setMosaicSubmitting(false);
    }
  };

  const handleAddOrUpdateArchitect = async (e) => {
    e.preventDefault();
    if (archSubmitting) return;
    try {
      setArchSubmitting(true);
      const formData = new FormData();
      formData.append('name', archForm.name);
      formData.append('years', archForm.years);
      formData.append('bio', archForm.bio);
      formData.append('articleBlocks', JSON.stringify(archForm.articleBlocks || []));
      formData.append('type', 'architects');
      if (archForm.image instanceof File) formData.append('image', archForm.image);

      if (archForm.mode === 'edit' && archForm.id) {
        await updateArchitect(archForm.id, formData);
        toast.success('Архитектор обновлен.');
      } else {
        await addArchitect(formData);
        toast.success('Архитектор добавлен.');
      }

      setArchForm({ id: null, mode: 'create', name: '', years: '', bio: '', image: null, articleBlocks: [] });
      setArchPreviewUrl('');
    } catch (err) {
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setArchSubmitting(false);
    }
  };

  const startEditObject = (obj) => {
    setActiveTab('objects');
    setObjAddressSelected(true);
    objAddress.setOpen(false);
    setObjForm({
      id: obj.id,
      mode: 'edit',
      address: obj.address || '',
      name: obj.name || '',
      architect: obj.architect || '',
      year: obj.year || '',
      desc: obj.desc || '',
      image: null,
      articleBlocks: obj.articleBlocks || [],
      lat: obj.lat || '',
      lng: obj.lng || '',
      polygonCoords: obj.polygonCoords || [],
    });
    scrollToForm(objFormRef);
  };

  const cancelEditObject = () => {
    setObjAddressSelected(false);
    objAddress.setOpen(false);
    setObjForm({
      id: null,
      mode: 'create',
      address: '',
      name: '',
      architect: '',
      year: '',
      desc: '',
      image: null,
      articleBlocks: [],
      lat: '',
      lng: '',
      polygonCoords: [],
    });
  };

  const startEditMosaic = (mosaic) => {
    setActiveTab('mosaics');
    setMosaicAddressSelected(true);
    mosaicAddress.setOpen(false);
    setMosaicForm({
      id: mosaic.id,
      mode: 'edit',
      name: mosaic.name || '',
      author: mosaic.author || '',
      year: mosaic.year || '',
      location: mosaic.location || '',
      desc: mosaic.desc || '',
      image: null,
      articleBlocks: mosaic.articleBlocks || [],
      lat: mosaic.lat || '',
      lng: mosaic.lng || '',
      polygonCoords: mosaic.polygonCoords || [],
    });
    scrollToForm(mosaicFormRef);
  };

  const cancelEditMosaic = () => {
    setMosaicAddressSelected(false);
    mosaicAddress.setOpen(false);
    setMosaicForm({
      id: null,
      mode: 'create',
      name: '',
      author: '',
      year: '',
      location: '',
      desc: '',
      image: null,
      articleBlocks: [],
      lat: '',
      lng: '',
      polygonCoords: [],
    });
  };

  const startEditArchitect = (arch) => {
    setActiveTab('architects');
    setArchForm({
      id: arch.id,
      mode: 'edit',
      name: arch.name || '',
      years: arch.years || '',
      bio: arch.bio || '',
      image: null,
      articleBlocks: arch.articleBlocks || [],
    });
    scrollToForm(archFormRef);
  };

  const cancelEditArchitect = () => {
    setArchForm({ id: null, mode: 'create', name: '', years: '', bio: '', image: null, articleBlocks: [] });
    setArchPreviewUrl('');
  };

  return (
    <main className="admin-page">
      <div className="container admin-container">
        <div className="admin-panel">
          <h2 className="admin-title">Административная панель</h2>

          <div className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === 'objects' ? 'active' : ''}`}
              onClick={() => setActiveTab('objects')}
            >
              Объекты
            </button>
            <button
              className={`admin-tab ${activeTab === 'architects' ? 'active' : ''}`}
              onClick={() => setActiveTab('architects')}
            >
              Архитекторы
            </button>
            <button
              className={`admin-tab ${activeTab === 'mosaics' ? 'active' : ''}`}
              onClick={() => setActiveTab('mosaics')}
            >
              Мозаики
            </button>
          </div>

          <div className="admin-layout">
            <div className="admin-left">
              <ObjectsSection
                active={activeTab === 'objects'}
                rootRef={objFormRef}
                objForm={objForm}
                objAddressSuggestions={objAddress.suggestions}
                objActiveIndex={objAddress.activeIndex}
                objAddressOpen={objAddress.open}
                objAddressLoading={objAddressLoading}
                isObjReady={isObjReady}
                isSubmitting={objSubmitting}
                objects={objects}
                articleBlocks={objForm.articleBlocks}
                onArticleChange={(next) => setObjForm((prev) => ({ ...prev, articleBlocks: next }))}
                onFieldChange={handleObjFieldChange}
                onAddressChange={objAddress.handleInputChange}
                onImageChange={(e) => setObjForm((prev) => ({ ...prev, image: e.target.files[0] }))}
                onSuggestionKeyDown={objAddress.handleSuggestionKeyDown}
                onAddressKeyDown={(e) =>
                  objAddress.handleAddressKeyDown(e, objAddressLoading, objAddress.open)
                }
                onSelectSuggestion={objAddress.handleSelectSuggestion}
                onAddressFocus={objAddress.handleFocus}
                onAddressBlur={objAddress.handleBlur}
                onSubmit={handleAddOrUpdateObject}
                onCancelEdit={cancelEditObject}
                onEditObject={startEditObject}
                onDeleteObject={deleteObject}
              />

              <ArchitectsSection
                active={activeTab === 'architects'}
                rootRef={archFormRef}
                archForm={archForm}
                architects={architects}
                isSubmitting={archSubmitting}
                articleBlocks={archForm.articleBlocks}
                onArticleChange={(next) => setArchForm((prev) => ({ ...prev, articleBlocks: next }))}
                onArchInputChange={handleArchInputChange}
                onArchImageChange={(e) => setArchForm((prev) => ({ ...prev, image: e.target.files[0] }))}
                onSubmit={handleAddOrUpdateArchitect}
                onCancelEdit={cancelEditArchitect}
                onEditArchitect={startEditArchitect}
                onDeleteArchitect={deleteArchitect}
              />

              <MosaicsSection
                active={activeTab === 'mosaics'}
                rootRef={mosaicFormRef}
                mosaicForm={mosaicForm}
                mosaicAddressSuggestions={mosaicAddress.suggestions}
                mosaicActiveIndex={mosaicAddress.activeIndex}
                mosaicAddressOpen={mosaicAddress.open}
                mosaicAddressLoading={mosaicAddressLoading}
                isMosaicReady={isMosaicReady}
                isSubmitting={mosaicSubmitting}
                mosaics={mosaics}
                articleBlocks={mosaicForm.articleBlocks}
                onArticleChange={(next) => setMosaicForm((prev) => ({ ...prev, articleBlocks: next }))}
                onFieldChange={handleMosaicFieldChange}
                onAddressChange={mosaicAddress.handleInputChange}
                onImageChange={(e) => setMosaicForm((prev) => ({ ...prev, image: e.target.files[0] }))}
                onSuggestionKeyDown={mosaicAddress.handleSuggestionKeyDown}
                onAddressKeyDown={(e) =>
                  mosaicAddress.handleAddressKeyDown(e, mosaicAddressLoading, mosaicAddress.open)
                }
                onSelectSuggestion={mosaicAddress.handleSelectSuggestion}
                onAddressFocus={mosaicAddress.handleFocus}
                onAddressBlur={mosaicAddress.handleBlur}
                onSubmit={handleAddOrUpdateMosaic}
                onCancelEdit={cancelEditMosaic}
                onEditMosaic={startEditMosaic}
                onDeleteMosaic={deleteMosaic}
              />
            </div>

            <div className="admin-right">
              {activeTab === 'objects' && (
                <AdminDrawMap
                  center={getObjectCenter()}
                  address={objForm.address}
                  polygonCoords={objForm.polygonCoords}
                  onPolygonChange={handleObjectPolygonChange}
                  onResolve={handleObjectResolve}
                  onResolveStart={() => setObjResolveLoading(true)}
                  onResolveEnd={() => setObjResolveLoading(false)}
                  resolveEnabled={objAddress.stage === 'house'}
                />
              )}

              {activeTab === 'mosaics' && (
                <AdminDrawMap
                  center={getMosaicCenter()}
                  address={mosaicForm.location}
                  polygonCoords={mosaicForm.polygonCoords}
                  onPolygonChange={handleMosaicPolygonChange}
                  onResolve={handleMosaicResolve}
                  onResolveStart={() => setMosaicResolveLoading(true)}
                  onResolveEnd={() => setMosaicResolveLoading(false)}
                  resolveEnabled={mosaicAddress.stage === 'house'}
                />
              )}

              {activeTab === 'architects' && (
                <div className="admin-image-preview">
                  {archPreviewUrl ? (
                    <img src={archPreviewUrl} alt="Превью" />
                  ) : (
                    <div className="admin-image-empty">Фото не выбрано</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
