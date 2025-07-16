# Architecture & Component Design

## Component Hierarchy

```
App
├── Layout
│   └── Main Editor View
│       ├── PromptletInput
│       ├── Editor
│       │   ├── RichTextEditor (ContentEditable)
│       │   ├── SelectionButton
│       │   ├── PatchTooltip
│       │   └── PatchPreview
│       └── Settings Modal
│           └── APIKeyManager
```

## Core Components

### 1. PromptletInput
- Initial prompt input field
- Submit button to generate document
- Loading state during generation
- Props: `onSubmit`, `isLoading`

### 2. Editor
- Main document container
- Handles text selection events
- Manages patch overlays
- Props: `document`, `patches`, `onPatchRequest`

### 3. RichTextEditor (ContentEditable)
- Simple contentEditable div for document editing
- Handles text input and selection
- No complex formatting toolbar
- Props: `content`, `onUpdate`, `onSelectionUpdate`

### 4. SelectionButton
- Appears when text is selected
- Shows "Edit" button to trigger AI patch
- Props: `selection`, `onEdit`

### 5. PatchTooltip
- Modal for entering patch prompts
- Appears when edit button is clicked
- Props: `selection`, `onClose`, `onGeneratePatch`

### 6. PatchPreview
- Displays patch text with accept/reject buttons
- Shows diff indicators
- Props: `patch`, `onAccept`, `onReject`

## State Management

### Document Store
```typescript
interface DocumentState {
  content: string
  promptlet: string
  patches: Patch[]
  history: DocumentVersion[]
}
```

### Patch Store
```typescript
interface PatchState {
  activePatch: Patch | null
  pendingPatches: Patch[]
  appliedPatches: Patch[]
}
```

## Data Flow
1. User enters Promptlet → LangChain generates document
2. Document rendered → User selects text
3. Selection → Patch prompt → LangChain generates patch
4. Patch preview → User accepts/rejects
5. Final document → LangChain regenerates Promptlet