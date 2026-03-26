
-- 1. Rename "Neighborhood Groups Directory" to "Neighborhood Connector Site" and merge descriptions
UPDATE public.tools
SET name = 'Neighborhood Connector Site',
    summary = 'Connect neighbors through shared interests, local groups, and community resources',
    description = 'A welcoming, content-first site that helps neighbors find local groups, gatherings, and low-pressure ways to connect. Serves as a digital front porch pointing people toward real-life community connection and resource sharing.'
WHERE id = '509aadbc-4521-4f3a-87e3-cefbea414581';

-- 2. Re-parent the "Neighborhood Connector Site" prompt to the kept tool
UPDATE public.prompts
SET parent_tool_id = '509aadbc-4521-4f3a-87e3-cefbea414581'
WHERE id = '19780b02-b616-4994-9678-26bde6868531';

-- 3. Delete any bookmarks referencing the old tool
DELETE FROM public.library_bookmarks
WHERE item_id = '8a138a60-b09c-4cdd-9cd9-6883c05557aa';

-- 4. Delete any embeddings referencing the old tool
DELETE FROM public.library_embeddings
WHERE item_id = '8a138a60-b09c-4cdd-9cd9-6883c05557aa';

-- 5. Delete the old "Neighborhood Connector Site" tool
DELETE FROM public.tools
WHERE id = '8a138a60-b09c-4cdd-9cd9-6883c05557aa';
