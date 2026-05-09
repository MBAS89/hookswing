import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import SEO from '../components/seo/SEO';
import JsonLd from '../components/seo/JsonLd';
import { blogPostingSchema } from '../components/seo/schemas';
import { getBlogPostBySlug, getRelatedPosts } from '../data/blogPosts';

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-2xl font-bold text-white mt-10 mb-4">
          {line.replace('## ', '')}
        </h2>
      );
      i++;
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-xl font-semibold text-white mt-8 mb-3">
          {line.replace('### ', '')}
        </h3>
      );
      i++;
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="border-slate-800 my-8" />);
      i++;
    } else if (line.startsWith('| ')) {
      // Table parsing
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter((r) => !r.replace(/\|/g, '').trim().startsWith('-'))
        .map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );
      if (rows.length > 0) {
        const headers = rows[0];
        const body = rows.slice(1);
        elements.push(
          <div key={i} className="overflow-x-auto my-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {headers.map((h, hi) => (
                    <th key={hi} className="text-left px-4 py-3 text-slate-300 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-800/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-slate-400">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    } else if (line.startsWith('```')) {
      const lang = line.replace('```', '').trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-sm font-mono text-slate-300 my-6">
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- [ ]') || lines[i].startsWith('- [x]'))) {
        items.push(lines[i].replace('- [ ] ', '').replace('- [x] ', ''));
        i++;
      }
      elements.push(
        <ul key={i} className="space-y-2 my-4">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-slate-300">
              <input type="checkbox" readOnly className="mt-1 rounded border-slate-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    } else if (line.startsWith('**[') && line.includes('→')) {
      // CTA link
      const match = line.match(/\*\*\[(.+?)\]\((.+?)\)\*\*/);
      if (match) {
        elements.push(
          <div key={i} className="my-8">
            <Link
              to={match[2]}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]"
            >
              {match[1].replace('→', '').trim()} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        );
      }
      i++;
    } else if (line.trim() === '') {
      i++;
    } else {
      // Paragraph - collect consecutive non-special lines
      const paraLines: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('##') && !lines[i].startsWith('###') && !lines[i].startsWith('---') && !lines[i].startsWith('|') && !lines[i].startsWith('```') && !lines[i].startsWith('- [')) {
        paraLines.push(lines[i]);
        i++;
      }
      const text = paraLines.join(' ');
      // Inline formatting
      const formatted = text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-sm text-emerald-400 font-mono">$1</code>');
      elements.push(
        <p
          key={i}
          className="text-slate-300 leading-relaxed my-4"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    }
  }

  return <>{elements}</>;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = getBlogPostBySlug(slug || '');
  const related = post ? getRelatedPosts(post.slug) : [];

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Article Not Found</h1>
          <p className="mb-4">The blog post you are looking for does not exist.</p>
          <Link to="/blog" className="text-emerald-400 hover:underline">Back to Blog</Link>
        </div>
      </div>
    );
  }

  const canonical = `https://hookswing.com/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        canonical={canonical}
        ogType="article"
      />
      <JsonLd data={blogPostingSchema(post)} />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="text-xl font-bold text-white">HookSwing</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/blog" className="text-slate-300 hover:text-white text-sm transition-colors">Blog</Link>
              <Link to="/docs" className="text-slate-300 hover:text-white text-sm transition-colors">Docs</Link>
              <Link to="/login" className="text-slate-300 hover:text-white text-sm transition-colors">Log In</Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center gap-1 text-slate-500 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </button>

        {/* Post header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 text-sm text-slate-500 mb-4">
            <span>{post.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readingTime}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{post.title}</h1>
          <p className="text-lg text-slate-400 leading-relaxed">{post.excerpt}</p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-invert prose-slate max-w-none">
          <MarkdownContent text={post.content} />
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Related Articles</h3>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="block bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-emerald-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-1 hover:text-emerald-400 transition-colors">
                    {r.title}
                  </h4>
                  <p className="text-sm text-slate-500">{r.excerpt.slice(0, 120)}...</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

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
