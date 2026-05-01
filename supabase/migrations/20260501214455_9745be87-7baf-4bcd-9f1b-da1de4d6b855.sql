UPDATE public.tools
SET description = 'AI-assisted coding, essentially a wrapper on Claude and other models. Relatively expensive if you''re only prototyping, but great for moving all the way from idea to production.'
WHERE id = '3be35a3d-f3ee-4a84-b635-77f9cefac1ee';

INSERT INTO public.tools (name, description, url, tool_category, sort_order) VALUES
('Claude Code', 'AI-assisted coding, good for prototypes as well as complex, long-term builds. Requires some effort and additional services move projects into real-world use.', 'https://www.anthropic.com/claude-code', 'tech_for_building', 50),
('MCP Servers', 'Lets your apps and data talk to AI assistants directly. The RT MCP server gives your AI tool live access to the Studio library and network updates.', 'https://modelcontextprotocol.io', 'tech_for_building', 50),
('Vercel', 'Cloud hosting service, one option for where apps actually get deployed.', 'https://vercel.com', 'tech_for_building', 50);