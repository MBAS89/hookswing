import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">HookSwing</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/docs" className="text-slate-300 hover:text-white text-sm transition-colors">Docs</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-6">Contact Us</h1>

        <p className="leading-relaxed text-lg mb-10">
          Have a question, feedback, or need help? We're here for you. Reach out and we'll get back as soon as possible.
        </p>

        <div className="space-y-6">
          <div className="flex items-start gap-4 bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Email</h3>
              <p className="text-slate-400 mb-2">For general inquiries and support</p>
              <a href="mailto:support@hookswing.com" className="text-emerald-400 hover:underline">support@hookswing.com</a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Business Inquiries</h3>
              <p className="text-slate-400 mb-2">For partnerships and enterprise sales</p>
              <a href="mailto:support@nuyvo.com" className="text-emerald-400 hover:underline">support@nuyvo.com</a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Phone</h3>
              <p className="text-slate-400 mb-2">Monday – Friday, 9am – 5pm MST</p>
              <a href="tel:+15053583854" className="text-emerald-400 hover:underline">+1 (505) 358-3854</a>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Address</h3>
              <p className="text-slate-400">
                Nuyvo LLC<br />
                1209 MOUNTAIN ROAD PL NE STE N<br />
                ALBUQUERQUE, BERNALILLO COUNTY, NM 87110 USA
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-slate-900 rounded-xl border border-slate-800">
          <h3 className="text-white font-semibold mb-2">Open Source</h3>
          <p className="text-slate-400 mb-3">
            Found a bug in the CLI? Have a feature idea? The CLI is open source on GitHub.
          </p>
          <a href="https://github.com/MBAS89/hookswing-cli" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-2">
            github.com/MBAS89/hookswing-cli →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            © 2026 HookSwing · A <a href="https://nuyvo.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">Nuyvo LLC</a> platform
          </p>
        </div>
      </footer>
    </div>
  );
}
