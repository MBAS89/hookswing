import { Helmet } from 'react-helmet-async';

export type SEOProps = {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonical?: string;
  noindex?: boolean;
  lang?: string;
};

const DEFAULT_OG_IMAGE = 'https://hookswing.com/og-image.png';
const SITE_NAME = 'HookSwing';

export default function SEO({
  title,
  description,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonical,
  noindex = false,
  lang = 'en',
}: SEOProps) {
  const fullTitle = title.includes('HookSwing') ? title : `${title} — HookSwing`;

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && <meta name="robots" content="index, follow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Author */}
      <meta name="author" content="Nuyvo LLC" />
    </Helmet>
  );
}
