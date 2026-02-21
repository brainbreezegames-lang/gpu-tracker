import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  /** JSON-LD structured data object */
  structuredData?: object;
}

const BASE_URL = 'https://gpu-tracker.dev';

/**
 * Dynamically updates <head> meta tags for each page.
 * Called at the top of every page component.
 */
export function SEOHead({ title, description, canonical, ogTitle, ogDescription, structuredData }: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Description
    setMeta('name', 'description', description);

    // Canonical
    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = `${BASE_URL}${canonical}`;
    }

    // OG
    setMeta('property', 'og:title',       ogTitle       || title);
    setMeta('property', 'og:description', ogDescription || description);
    if (canonical) setMeta('property', 'og:url', `${BASE_URL}${canonical}`);

    // Twitter
    setMeta('name', 'twitter:title',       ogTitle       || title);
    setMeta('name', 'twitter:description', ogDescription || description);

    // Structured data
    if (structuredData) {
      let script = document.querySelector<HTMLScriptElement>('script[data-seo="dynamic"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo', 'dynamic');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, canonical, ogTitle, ogDescription, structuredData]);

  return null;
}

function setMeta(attr: string, name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
