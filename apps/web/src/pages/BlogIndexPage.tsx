import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Search, Clock, Tag, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import SEO from '../components/seo/SEO';
import { blogPosts } from '../data/blogPosts';

export default function BlogIndexPage() {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const allTags = Array.from(new Set(blogPosts.flatMap((p) => p.tags)));

  const filtered = blogPosts.filter((post) => {
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesQuery && matchesTag;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <SEO
        title="HookSwing Blog — Webhook Tips, ngrok Alternatives & Developer Tools"
        description="Guides, comparisons, and best practices for webhook testing, debugging, and development. Learn about ngrok alternatives, Stripe webhooks, and more."
        keywords="webhook blog, ngrok alternatives, webhook testing, developer tools, Stripe webhooks"
        canonical="https://hookswing.com/blog"
      />

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">HookSwing Blog</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Guides, comparisons, and best practices for webhook testing, debugging, and development.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedTag ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTag === tag ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((post) => (
            <article
              key={post.slug}
              className="bg-slate-900 rounded-xl border border-slate-800 p-6 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                <span>{post.date}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTime}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
                >
                  Read <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p>No articles found matching your search.</p>
          </div>
        )}
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
