import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import About from './pages/About';
import DetectDisease from './pages/DetectDisease';
import DiseaseLibrary from './pages/DiseaseLibrary';
import Home from './pages/Home';
import Results from './pages/Results';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAF7] text-[#1C2A21]">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detect" element={<DetectDisease />} />
          <Route path="/results" element={<Results />} />
          <Route path="/library" element={<DiseaseLibrary />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
