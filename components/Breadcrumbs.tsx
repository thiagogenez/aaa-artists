import Link from "next/link";
import { absoluteUrl, serializeJsonLd } from "@/lib/site";

export type BreadcrumbItem = { name: string; path: string };

export default function Breadcrumbs({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-widest"
          style={{ color: "var(--text-40)" }}
        >
          {items.map((item, index) => {
            const current = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden="true">/</span>}
                {current ? (
                  <span aria-current="page" style={{ color: "var(--text-60)" }}>
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="link-quiet inline-flex min-h-[44px] items-center"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      />
    </>
  );
}
