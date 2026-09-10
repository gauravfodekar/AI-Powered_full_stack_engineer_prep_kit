import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'PrepKit AI - AI-Powered Interview Preparation Kit Generator',
  description: 'Generate hyper-personalized, role-specific technical interview kits with company intelligence, question banks, and daily study schedules.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen bg-slate-50">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
              <p>© {new Date().getFullYear()} PrepKit AI. Full-Stack Interview Preparation Kit Generator.</p>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Gemini Flash Powered
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
                  Zero Hallucination
                </span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

