/**
 * Structured data for search engines. `<` is escaped so CMS text can never
 * close the script tag (the approach the Next.js JSON-LD guide recommends).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
