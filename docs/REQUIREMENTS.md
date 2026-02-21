# Family Video Gallery Web App — PRD

## 1. Overview

### Product Vision
A private, static, family video gallery that enables intuitive browsing, filtering, and viewing of personal videos hosted on YouTube (unlisted/public), optimized for family use across TV, mobile, and desktop.

---

## 2. Core Principles

### Design Philosophy
- Clean, minimal UI
- Content-first (thumbnails > text)
- Low cognitive load
- Consistent interaction patterns

### Visual Design
- Base: white + grayscale
- Accent: sea blue
- Soft shadows, rounded corners

---

## 3. Architecture

### Stack
- Frontend: SvelteKit (static export)
- Hosting: GitHub Pages
- Data: JSON via Python pipeline
- Video: YouTube (unlisted/public)

---

## 4. Data Model

{
  "id": "youtube_id",
  "title": "string",
  "description": "string",
  "videoDate": "YYYY-MM-DD",
  "uploadDate": "YYYY-MM-DD",
  "views": 123,
  "duration": "mm:ss",
  "thumbnail": "url",
  "collections": ["string"],
  "people": ["string"],
  "location": "string",
  "tags": ["string"]
}

---

## 5. Features

### Filtering
- Collections (single)
- People (multi AND)
- Location (single)
- Tags (clickable)
- Search

### Sorting
- Video Date (default)
- Title

---

## 6. Screens

### Grid
- Responsive density
- Year separators
- Clickable tags

### Sidebar
- Sort, Collections, People, Places
- Drawer on mobile

### Detail
- Embedded video (click-to-play)
- Metadata (dates, avatars, location)
- Next/Prev navigation

---

## 7. Responsive

- Mobile: 1 column
- Tablet: 2–3 columns
- Desktop: sidebar visible

---

## 8. MVP

- Grid
- Sidebar filters
- Detail view
- Metadata system
- Search

---

## 9. Future

- Related videos
- Keyboard navigation
- Swipe gestures
