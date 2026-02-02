
# Manual Commitments Box

## Overview
Add a simple "Commitments" to-do list box for logged-in users where they can manually add text items and check them off. When a commitment is completed, the user earns a serviceberry.

## User Experience
1. A compact commitments box (shown for logged-in users only)
2. Simple text input field with a submit button to add new items
3. Each item shows as a checkbox-style row
4. Clicking the circle/checkbox marks it complete and awards 10 serviceberries
5. Option to delete items
6. Completed items show with strikethrough styling

## Location
The commitments box will be enhanced directly in the existing `CommitmentsList` component, which already appears on the Profile page. We will add a manual entry input at the top.

---

## Technical Implementation

### 1. Modify CommitmentsList Component
**File:** `src/components/CommitmentsList.tsx`

Add the following functionality:

**New state and input handling:**
- Add `newCommitmentText` state for the input field
- Add `isAdding` state to show loading during submission

**New "Add Commitment" input section:**
- Simple text input with placeholder "Add a commitment..."
- Submit button (or Enter key to submit)
- Input clears after successful add

**Insert logic:**
- Insert into `commitments` table with:
  - `user_id`: current user's ID
  - `commitment_text`: the entered text
  - `status`: "active"
  - `source_chat_context`: null (manual entry has no chat context)
- Do NOT award serviceberries on creation (only on completion, per existing logic)

**Updated empty state:**
- Change the empty state message from "When you make commitments during chat sessions..." to something that encourages manual entry

### 2. UI Layout Changes
The updated component structure:

```text
+---------------------------------------+
|  Commitments                          |
+---------------------------------------+
| [  Add a commitment...          ] [+] |
+---------------------------------------+
| Active (2)                            |
|  o  Call neighbor about garden        |
|  o  Research block party permits      |
+---------------------------------------+
| Completed (1)                         |
|  [check] Post flyer at coffee shop    |
+---------------------------------------+
```

### 3. Database Interaction
Using the existing `commitments` table - no schema changes needed:
- `commitment_text` (required): The to-do item text
- `user_id` (required): Owner of the commitment  
- `status`: "active" or "completed"
- `source_chat_context`: null for manual entries
- `completed_at`: timestamp when completed

### 4. Serviceberry Awards
The existing completion logic already awards 10 serviceberries via:
```typescript
await supabase.rpc("award_serviceberries", {
  p_user_id: user.id,
  p_amount: 10,
  p_reason: "commitment_completed",
  p_reference_id: commitment.id
});
```

No changes needed here - manual completions will work the same way.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/CommitmentsList.tsx` | Add input field for manual commitment entry, update empty state text |

## No Database Changes Required
The existing `commitments` table already supports this use case - `source_chat_context` is nullable, so manual entries simply leave it null.
