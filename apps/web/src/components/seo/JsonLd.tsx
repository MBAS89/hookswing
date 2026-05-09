import { Helmet } from 'react-helmet-async';

export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const scripts = Array.isArray(data) ? data : [data];
  return (
    <>
      {scripts.map((item, i) => (
        <Helmet key={i}>
          <script type="application/ld+json">
            {JSON.stringify(item)}
          </script>
        </Helmet>
      ))}
    </>
  );
}
