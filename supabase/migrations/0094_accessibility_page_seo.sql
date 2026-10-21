-- Migration: 0094_accessibility_page_seo.sql
-- Adds the missing /accessibility page to page_seo so its title and description
-- are customizable in Admin -> Page SEO, matching the other static pages.

insert into public.page_seo (path, meta_title, meta_description) values
  ('/accessibility', 'Accessibility Statement | Masaar Holidays',
    'Read the Masaar Holidays accessibility statement outlining our commitment to digital accessibility for all Umrah and Hajj pilgrims.')
on conflict (path) do update set
  meta_title = excluded.meta_title,
  meta_description = excluded.meta_description;
