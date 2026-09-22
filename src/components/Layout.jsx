import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import Popup from './Popup';
import FloatingSocial from './FloatingSocial';
import { EnquiryProvider } from './EnquiryModal';

export default function Layout() {
  return (
    <EnquiryProvider>
      <div className="site">
        <PageTransition />
        <Navbar />
        <main className="main">
          <Outlet />
        </main>
        <Footer />
        <Popup />
        <FloatingSocial />
      </div>
    </EnquiryProvider>
  );
}