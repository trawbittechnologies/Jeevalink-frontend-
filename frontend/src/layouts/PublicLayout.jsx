import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Toast from '../components/Toast.jsx';
import BloodHeroAssistant from '../components/BloodHeroAssistant.jsx';

export default function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Toast />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BloodHeroAssistant />
    </div>
  );
}
