

# Add Neighborhood Walking Guide Story

## Content

Based on the PDF and existing story style, I'll create a story entry with:

**Title:** Outer Sunset Field Guide

**Attribution:** Josh Nesbit / outersunset.place

**Short summary (`story_text`):** A neighbor built a walking guide app for the Outer Sunset that connects local history, present-day life, and future visions — all within a few blocks of home.

**Full story (`full_story_text`):** ~3 paragraphs in `<p>` tags matching the length and tone of existing entries (Boston Ujima, Cool Block, Camerados), drawn from the PDF content. Covering: the origin from neighborhood meeting notes, the past/present/future navigation concept, and the relational outcomes of co-creating it with neighbors.

**Image:** The uploaded Outer Sunset Field Guide screenshot, copied to `public/images/gallery/outer_sunset_field_guide.png` and referenced in `image_urls`.

## Technical Steps

1. **Copy image** to `public/images/gallery/outer_sunset_field_guide.png`
2. **Database insert** via migration — a single INSERT into `stories` with title, story_text, full_story_text, attribution, and image_urls

No code changes needed — just an asset copy and a database row.

