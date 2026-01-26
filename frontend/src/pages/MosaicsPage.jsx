import { useMosaics } from '../hooks/useMosaics';
import Gallery from '../components/Gallery';
import LoadingGallery from '../components/LoadingGallery';
import Banner from '../components/Banner';

export default function MosaicsPage() {
  const { mosaics, loading } = useMosaics();

  if (loading) {
    return (
      <div className="container">
        <LoadingGallery title="МОЗАИКИ" />
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <Gallery items={mosaics} type="mosaic" title="МОЗАИКИ" />
      </div>
    </>
  );
}
