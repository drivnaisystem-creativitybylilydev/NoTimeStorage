# SEO & LLM Optimization Guide

This document describes the SEO and LLM (AI search) optimizations implemented for NoTime Storage and how to maintain them.

## Implemented Features

### 1. Metadata (`app/layout.tsx`)

- **Title**: "NoTime Storage — College & Student Storage | Door-to-Door Pickup & Delivery"
- **Description**: Keyword-rich description mentioning college storage, dorm pickup, climate-controlled storage, and campuses
- **Keywords**: college storage, student storage, dorm storage, summer storage, campus storage, move-out storage, college move out, student move in
- **Open Graph**: For social sharing (Facebook, LinkedIn, etc.)
- **Twitter Card**: For Twitter/X previews
- **Robots**: `index: true`, `follow: true` for search engines
- **metadataBase**: `https://notimestorage.co` for correct canonical URLs

### 2. Sitemap (`app/sitemap.ts`)

- Dynamic sitemap at `/sitemap.xml`
- Includes: `/`, `/contact`, `/privacy`, `/terms`, `/auth/signup`, `/auth/login`
- Priorities and change frequencies set for each page type

### 3. Robots (`app/robots.ts`)

- Allows all crawlers on public pages
- Disallows: `/admin/`, `/dashboard/`, `/api/`, `/auth/callback`, `/auth/update-password`
- Sitemap URL: `https://notimestorage.co/sitemap.xml`
- Host: `https://notimestorage.co`

### 4. JSON-LD Structured Data

**Organization** (in `app/layout.tsx`):

- Company name, URL, logo, description
- `areaServed`: List of 12 campuses

**FAQPage** (in `app/page.tsx`):

- All FAQ questions and answers in schema.org format
- Helps Google show FAQ rich results and improves AI/LLM understanding

### 5. llms.txt (`public/llms.txt`)

- Plain-text summary for AI crawlers (ChatGPT, Claude, Perplexity, etc.)
- Served at `https://notimestorage.co/llms.txt`
- Contains: what we do, key facts, schools served, common Q&A

## Target Keywords

- college storage
- student storage
- dorm storage
- summer storage
- campus storage
- move-out storage
- college move out
- student move in

## Recommendations

### Ongoing

1. **Add page-specific metadata** for `/contact`, `/privacy`, `/terms` (e.g. `generateMetadata` or `metadata` export)
2. **Submit sitemap** in Google Search Console: `https://notimestorage.co/sitemap.xml`
3. **Monitor** Search Console for indexing status and queries
4. **Add more content** (blog, school-specific landing pages) to target long-tail keywords

### When Adding New Schools

- Update `areaServed` in Organization JSON-LD (`app/layout.tsx`)
- Update FAQ answer for "Which schools do you currently serve?" and `FAQ_ITEMS` in `app/page.tsx`
- Update `public/llms.txt` schools list

### AI Crawler Notes

- `robots.txt` does not block GPTBot, Claude-Web, or PerplexityBot on public pages
- `llms.txt` provides a concise, structured summary for LLMs
- FAQ schema and clear headings help AI systems extract accurate answers
