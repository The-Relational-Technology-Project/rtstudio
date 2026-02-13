

# Upload 20 New Stories to the Library

## Performance Assessment

The Library currently has **23 stories** and will grow to **43** after this upload. Here's why performance will remain strong:

- **Data volume is modest**: 43 stories (plus prompts and tools) is well under the 1,000-row default query limit. No pagination needed.
- **Fetching is efficient**: Stories, prompts, and tools are fetched in parallel via `Promise.all`, so the three queries run simultaneously.
- **Rendering is lightweight**: The grid uses `line-clamp` on card summaries (120 chars), so long `full_story_text` content is only loaded into the DOM when a user clicks "View" to open the detail dialog.
- **No changes needed** to the Library page code for this volume.

## Data Upload Plan

Insert all 20 stories as individual rows into the `stories` table with:
- **title**: Story title
- **story_text**: A ~120-character summary for the card view
- **attribution**: Source/reference noted in the document
- **full_story_text**: The complete story text formatted in HTML paragraphs

### Stories to Insert

| # | Title | Attribution |
|---|-------|-------------|
| 1 | Nate Tubbs and The Island, Chicago | Parish Collective / parishcollective.org |
| 2 | Savannah Kruger and The Neighborhood Accelerator, Boulder | Supernuclear Substack / supernuclear.substack.com |
| 3 | The Yes House, Granite Falls, Minnesota | theyeshouse.org / Department of Public Transformation |
| 4 | Jesse Evers and Highside Workshop, Brooklyn | jesseevers.com / CoAuthored |
| 5 | The Bushwick Collective, Brooklyn | Referenced in Jesse Evers' guide / multiple sources |
| 6 | Bradley Street Bicycle Co-op, New Haven | Referenced in Jesse Evers' guide / bsbc.co |
| 7 | Grow Food Northampton, Massachusetts | Referenced in Jesse Evers' guide / growfoodnorthampton.org |
| 8 | vTaiwan and Digital Democracy | Radical xChange paper / CivicHall article on vTaiwan |
| 9 | Trade School, New York to Everywhere | tradeschool.coop |
| 10 | East Bay Permanent Real Estate Cooperative, Oakland | ebprec.org / Sustainable Economies Law Center |
| 11 | Boston Ujima Project | JRF paper / ujimaboston.com |
| 12 | Cool Block | coolblock.org / Empowerment Institute |
| 13 | Camerados and Public Living Rooms | camerados.org / Atlas of the Future |
| 14 | Repair Cafe | repaircafe.org / multiple sources |
| 15 | Porchfest, Ithaca to Everywhere | porchfest.org |
| 16 | City Repair and Intersection Painting, Portland | cityrepair.org / communitecture.net |
| 17 | Flatpack Democracy, Frome, England | Multiple sources / Peter Macfadyen |
| 18 | NeighborCircles, Lawrence, Massachusetts | Lawrence CommunityWorks / lawrencecommunityworks.org |
| 19 | Edmonton's Community League System | Edmonton Federation of Community Leagues / ABCD Institute |
| 20 | Living Room Conversations | livingroomconversations.org / Joan Blades |

## Technical Details

- Each story will be inserted via SQL `INSERT INTO public.stories (title, story_text, attribution, full_story_text)` with HTML-formatted full text using `<p>` tags for paragraphs
- The `story_text` field will contain a concise summary (first ~120 characters of the narrative) for card display
- No code changes are required -- the existing Library page will automatically display all new stories

