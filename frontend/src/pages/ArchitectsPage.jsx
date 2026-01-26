import { useArchitects } from '../hooks/useArchitects';
import Gallery from '../components/Gallery';
import LoadingGallery from '../components/LoadingGallery';
import Banner from '../components/Banner';

export default function ArchitectsPage() {
  const { architects, loading } = useArchitects();

  if (loading) {
    return (
      <div className="container">
        <LoadingGallery title="АРХИТЕКТОРЫ" />
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <Gallery items={architects} type="architect" title="АРХИТЕКТОРЫ" />
      </div>
    </>
  );
}
