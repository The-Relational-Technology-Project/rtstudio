

# Studio Builder Experience - Implementation Plan

## Overview

Transform Studio from shared password access to a personalized builder platform with:
- Individual accounts via magic link authentication
- Rich builder profiles that inform AI interactions
- Private neighborhood vision boards with PDF export
- Free-text commitment tracking from chat sessions
- "Serviceberries" engagement rewards

---

## Phase 1: Database Foundation

### 1.1 New Tables

```sql
-- Builder profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  neighborhood TEXT,
  neighborhood_description TEXT,
  dreams TEXT,
  tech_familiarity TEXT,              -- 'new', 'learning', 'comfortable', 'experienced'
  ai_coding_experience TEXT,          -- 'never', 'a_little', 'regular', 'daily'
  profile_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Vision board pins (private to user)
CREATE TABLE public.vision_board_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commitments (formed in chat, tracked in profile)
CREATE TABLE public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  commitment_text TEXT NOT NULL,
  source_chat_context TEXT,
  status TEXT DEFAULT 'active',       -- 'active', 'completed', 'cleared'
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Serviceberries (engagement points)
CREATE TABLE public.serviceberries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 RLS Policies

All new tables use user-only access patterns:

```sql
-- Profiles: users can only read/update their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Vision board pins: strictly private
ALTER TABLE public.vision_board_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own pins" ON vision_board_pins FOR ALL USING (auth.uid() = user_id);

-- Commitments: user-only
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own commitments" ON commitments FOR ALL USING (auth.uid() = user_id);

-- Serviceberries: read own, insert via function
ALTER TABLE public.serviceberries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own serviceberries" ON serviceberries FOR SELECT USING (auth.uid() = user_id);
```

### 1.3 Database Triggers

```sql
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Serviceberries awarding function
CREATE OR REPLACE FUNCTION public.award_serviceberries(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO serviceberries (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.4 Storage Bucket

```sql
-- Vision board images (private bucket with user-scoped paths)
INSERT INTO storage.buckets (id, name, public) VALUES ('vision-boards', 'vision-boards', false);

-- RLS: Users can only manage their own images
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vision-boards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own images" ON storage.objects
  FOR SELECT USING (bucket_id = 'vision-boards' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'vision-boards' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Phase 2: Magic Link Authentication

### 2.1 Auth Configuration

- Enable email provider with magic links
- Enable auto-confirm (users don't need to verify email separately)
- Set redirect URL to `window.location.origin`

### 2.2 New Auth Page

Replace `src/pages/Auth.tsx` with magic link flow:

**UI Components:**
- Email input field
- "Send Magic Link" button
- Success state: "Check your email for a login link"
- Loading and error states

**Key Code Pattern:**
```typescript
const handleMagicLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (!error) {
    setShowSuccessMessage(true);
  }
};
```

### 2.3 Auth State Management

Create new `src/contexts/AuthContext.tsx`:

```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

**Features:**
- Set up `onAuthStateChange` listener BEFORE `getSession()`
- Auto-fetch profile when user signs in
- Expose user and profile to entire app

### 2.4 Protected Routes

Create `src/components/ProtectedRoute.tsx`:
- Check for authenticated user
- Redirect to `/auth` if not logged in
- Show loading spinner during auth check

**Update `App.tsx`:**
- Wrap protected routes (`/`, `/library`, `/profile`) in ProtectedRoute
- Keep `/auth` as public route

---

## Phase 3: Profile Onboarding

### 3.1 Onboarding Flow Component

Create `src/components/ProfileOnboarding.tsx`:

**Multi-step flow (4 steps):**

1. **Welcome**
   - "Welcome to Studio! Let's set up your builder profile."
   - Brief intro text
   - "Get Started" button

2. **About You**
   - Display name input
   - Neighborhood/place input
   - Optional: Short description of your neighborhood

3. **Your Dreams**
   - Text area: "What are you hoping to build or create for your community?"
   - Encouraging prompt about possibilities

4. **Tech Comfort**
   - Two simple selectors:
     - Tech familiarity: "New to tech" / "Learning" / "Comfortable" / "Experienced"
     - AI coding: "Never tried" / "A little" / "Regular use" / "Daily"
   - "Complete Profile" button

**On completion:**
- Mark `profile_completed = true`
- Award first serviceberries (profile setup bonus)
- Redirect to main Sidekick page

### 3.2 Profile Page

Create `src/pages/Profile.tsx`:

**Layout sections:**
1. **Header** - Display name, neighborhood, edit button
2. **About** - Dreams, tech comfort (editable)
3. **Vision Board** - Pinterest-style grid
4. **Commitments** - Active commitments list
5. **Serviceberries** - Total count with breakdown

Route: `/profile`

---

## Phase 4: Vision Board

### 4.1 Vision Board Component

Create `src/components/VisionBoard.tsx`:

**Features:**
- Grid display of uploaded images with captions
- Upload button (max 10 images suggested)
- Click to add/edit caption
- Delete functionality
- Drag-to-reorder (future enhancement: position_x, position_y)

**Upload flow:**
```typescript
const uploadImage = async (file: File) => {
  const filePath = `${user.id}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('vision-boards')
    .upload(filePath, file);
  
  if (data) {
    // Insert pin record
    await supabase.from('vision_board_pins').insert({
      user_id: user.id,
      image_url: supabase.storage.from('vision-boards').getPublicUrl(filePath).data.publicUrl,
    });
  }
};
```

### 4.2 PDF Export

Create `src/components/VisionBoardExport.tsx`:

**Implementation approach:**
- Use html2canvas + jsPDF libraries
- Render vision board to canvas
- Convert to PDF with title and attribution
- Download as "my-vision-board.pdf"

**Export button in Vision Board header:**
```typescript
const exportToPDF = async () => {
  const canvas = await html2canvas(visionBoardRef.current);
  const pdf = new jsPDF();
  pdf.text(`${profile.display_name}'s Vision Board`, 20, 20);
  pdf.addImage(canvas, 'PNG', 10, 30, 190, 0);
  pdf.save('vision-board.pdf');
};
```

---

## Phase 5: Commitments System

### 5.1 AI Tool for Commitment Detection

Add to `chat-remix/index.ts` tools array:

```javascript
{
  type: "function",
  function: {
    name: "record_commitment",
    description: "Record a commitment the user has made during conversation. Only call after user confirms they want to track this commitment.",
    parameters: {
      type: "object",
      properties: {
        commitment_text: { 
          type: "string", 
          description: "The commitment in the user's own words" 
        },
        context: { 
          type: "string", 
          description: "Brief context from the conversation about why this commitment matters" 
        }
      },
      required: ["commitment_text"],
      additionalProperties: false
    }
  }
}
```

### 5.2 Update System Prompt

Add to `chat-remix` system prompt:

```
COMMITMENT TRACKING:
When you notice the user making a commitment during conversation (e.g., "I'm going to try this at our next meeting", "I'll reach out to my neighbor about this"), gently acknowledge it and ask:
"That sounds like a commitment! Would you like me to track this for you? I can add it to your profile so you can revisit it later."

Only call the record_commitment tool AFTER they confirm.
```

### 5.3 Commitments List Component

Create `src/components/CommitmentsList.tsx`:

**Features:**
- List of active commitments
- Mark as complete button (with celebration)
- Clear/delete option
- Show source context on expand
- Empty state: "No active commitments"

**On completion:**
- Award serviceberries
- Move to completed section (or archive)

---

## Phase 6: Serviceberries System

### 6.1 Awarding Logic

Create edge function `supabase/functions/award-serviceberries/index.ts`:

```typescript
// Award points for specific actions
const BERRY_AMOUNTS = {
  profile_setup: 10,
  first_chat: 5,
  commitment_made: 5,
  commitment_completed: 10,
  library_contribution: 15,
};
```

**Trigger points:**
- Profile onboarding complete: `award_serviceberries(user_id, 10, 'profile_setup')`
- First Sidekick message: Check if this is first chat, award 5
- Commitment recorded: Award 5
- Commitment completed: Award 10
- Library contribution: Already tracked in chat-remix, award 15

### 6.2 Display Component

Create `src/components/ServiceberriesCounter.tsx`:

**Features:**
- Current total display (berry icon + count)
- Click to see breakdown modal
- Animate when new berries awarded

**Integration points:**
- TopNav: Small counter icon
- Profile page: Full breakdown section

---

## Phase 7: AI Context Enhancement

### 7.1 Update Chat Edge Function

Modify `chat-remix/index.ts`:

**Accept user context:**
```typescript
const { messages, userId } = await req.json();

// Fetch profile if authenticated
let profileContext = '';
if (userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (profile) {
    profileContext = `
BUILDER CONTEXT (personalize your responses):
- Name: ${profile.display_name || 'Builder'}
- Neighborhood: ${profile.neighborhood || 'Not specified'}
- Their dream: ${profile.dreams || 'Exploring possibilities'}
- Tech comfort: ${profile.tech_familiarity || 'Learning'}
- AI coding: ${profile.ai_coding_experience || 'Getting started'}
`;
  }
}
```

**Inject into system prompt:**
```typescript
const systemPrompt = `You are Sidekick...${profileContext}${libraryContext}`;
```

### 7.2 Update Sidekick Component

Modify `src/components/Sidekick.tsx`:

```typescript
const { user } = useAuth();

const sendMessage = async (messagesToSend: Message[]) => {
  const { data, error } = await supabase.functions.invoke("chat-remix", {
    body: { 
      messages: messagesToSend,
      userId: user?.id  // Pass authenticated user ID
    }
  });
  // ... rest of handling
};
```

---

## File Changes Summary

### New Files
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/components/ProtectedRoute.tsx` - Route protection
- `src/pages/Profile.tsx` - Builder profile page
- `src/components/ProfileOnboarding.tsx` - First-time setup
- `src/components/VisionBoard.tsx` - Image grid with upload
- `src/components/VisionBoardExport.tsx` - PDF export
- `src/components/CommitmentsList.tsx` - Commitment tracking UI
- `src/components/ServiceberriesCounter.tsx` - Points display
- `supabase/functions/award-serviceberries/index.ts` - Points logic

### Modified Files
- `src/App.tsx` - Add AuthProvider, new routes, ProtectedRoute
- `src/pages/Auth.tsx` - Replace with magic link flow
- `src/components/TopNav.tsx` - Add profile link, serviceberries counter
- `src/components/Sidekick.tsx` - Pass userId to chat function
- `supabase/functions/chat-remix/index.ts` - Add profile context, commitment tool
- `supabase/config.toml` - Configure new edge functions

### Database Changes
- Create tables: `profiles`, `vision_board_pins`, `commitments`, `serviceberries`
- Create storage bucket: `vision-boards` (private)
- Create trigger: `handle_new_user` for auto-profile creation
- Create function: `award_serviceberries`
- RLS policies for all new tables

### New Dependencies
- `html2canvas` - For PDF export
- `jspdf` - PDF generation

---

## Implementation Order

1. **Auth Foundation** (Phase 1.1-1.4 + Phase 2)
   - Database schema and RLS
   - Magic link auth flow
   - Auth context and protected routes

2. **Profile Experience** (Phase 3)
   - Onboarding flow
   - Profile page basics

3. **AI Personalization** (Phase 7)
   - Update chat-remix with profile context
   - Immediate UX improvement

4. **Vision Board** (Phase 4)
   - Image upload and display
   - PDF export

5. **Commitments** (Phase 5)
   - AI tool integration
   - Commitments UI

6. **Serviceberries** (Phase 6)
   - Award logic
   - Display component

---

## Technical Notes

- All vision board data is strictly private (user-only RLS)
- PDF export happens client-side (no server storage of exports)
- Commitments are free-text with optional chat context
- Serviceberries are append-only (no subtraction)
- Magic links auto-confirm, no email verification step needed
- Profile data injected server-side in edge function (secure)

