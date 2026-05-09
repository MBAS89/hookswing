export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HookSwing',
  url: 'https://hookswing.com',
  logo: 'https://hookswing.com/favicon.svg',
  sameAs: [
    'https://github.com/MBAS89/hookswing',
  ],
  parentOrganization: {
    '@type': 'Organization',
    name: 'Nuyvo LLC',
    url: 'https://nuyvo.com',
  },
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HookSwing',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Any',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '19',
      priceCurrency: 'USD',
      priceValidUntil: '2026-12-31',
    },
    {
      '@type': 'Offer',
      name: 'Team',
      price: '49',
      priceCurrency: 'USD',
      priceValidUntil: '2026-12-31',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '500',
    bestRating: '5',
  },
  featureList: [
    'Webhook capture and inspection',
    'Real-time payload replay',
    'Team workspaces',
    'Custom subdomains',
    'Slack and Discord alerts',
    'CLI forwarding',
    'Path preservation',
    'Webhook tester with 15+ providers',
  ],
};

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function blogPostingSchema(post: {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  author: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: `https://hookswing.com/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'HookSwing',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hookswing.com/favicon.svg',
      },
    },
    image: post.image || 'https://hookswing.com/og-image.png',
  };
}

export function faqPageSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
