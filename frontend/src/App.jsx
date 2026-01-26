import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import ObjectsPage from './pages/ObjectsPage';
import ArchitectsPage from './pages/ArchitectsPage';
import MosaicsPage from './pages/MosaicsPage';
import DetailsPage from './pages/DetailsPage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import { Toaster } from 'react-hot-toast';

import './styles/global.css';
import './styles/components.css';

function App() {

  return (
    <Router>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/objects" element={<ObjectsPage />} />
          <Route path="/objects/:id" element={<DetailsPage type="object" />} />
          <Route path="/architects" element={<ArchitectsPage />} />
          <Route path="/architects/:id" element={<DetailsPage type="architect" />} />
          <Route path="/mosaics" element={<MosaicsPage />} />
          <Route path="/mosaics/:id" element={<DetailsPage type="mosaic" />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <Toaster
        position="top-center"
        gutter={12}
        toastOptions={{
          duration: 2000,
          className: 'toast toast--info',
          success: { className: 'toast toast--success' },
          error: { className: 'toast toast--error' },
        }}
      />
      <Footer />
    </Router>
  );
}

export default App;
