import { useObjects } from '../hooks/useObjects';
import Gallery from '../components/Gallery';
import LoadingGallery from '../components/LoadingGallery';

export default function ObjectsPage() {
  const { objects, loading } = useObjects();

  if (loading) {
    return (
      <div className="container">
        <LoadingGallery title="ОБЪЕКТЫ" />
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <Gallery items={objects} type="object" title="ОБЪЕКТЫ" />
      </div>
    </>
  );
}
