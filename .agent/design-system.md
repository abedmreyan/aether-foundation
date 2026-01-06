# Design System

Design guidelines and patterns for the Aether Foundation CRM.

---

## Color Palette

### Primary Colors
| Name | Hex | Use |
|------|-----|-----|
| Primary | `#3B82F6` | Main actions, links |
| Primary Dark | `#2563EB` | Hover states |
| Primary Light | `#93C5FD` | Backgrounds |

### Status Colors
| Name | Hex | Use |
|------|-----|-----|
| Success | `#22C55E` | Confirmations, completed |
| Warning | `#F59E0B` | Cautions, pending |
| Error | `#EF4444` | Errors, deletions |
| Info | `#3B82F6` | Information |

### Neutral Colors
| Name | Hex | Use |
|------|-----|-----|
| Gray 900 | `#111827` | Text primary |
| Gray 700 | `#374151` | Text secondary |
| Gray 500 | `#6B7280` | Text muted |
| Gray 200 | `#E5E7EB` | Borders |
| Gray 100 | `#F3F4F6` | Backgrounds |
| White | `#FFFFFF` | Cards, modals |

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Scale
| Name | Size | Weight | Use |
|------|------|--------|-----|
| H1 | 24px | 700 | Page titles |
| H2 | 20px | 600 | Section headers |
| H3 | 16px | 600 | Card headers |
| Body | 14px | 400 | Body text |
| Small | 12px | 400 | Labels, captions |

---

## Spacing

Base unit: `4px`

| Name | Value | Use |
|------|-------|-----|
| xs | 4px | Tight spacing |
| sm | 8px | Between related items |
| md | 16px | Standard gaps |
| lg | 24px | Section spacing |
| xl | 32px | Large sections |

---

## Components

### Buttons
| Variant | Use |
|---------|-----|
| Primary | Main actions |
| Secondary | Alternative actions |
| Ghost | Tertiary actions |
| Danger | Destructive actions |

### Cards
- White background
- 8px border radius
- Subtle shadow
- 16px padding

### Modals
- Centered overlay
- White card
- Close button top-right
- Actions bottom-right

---

## Layout Patterns

### Dashboard Layout
```
┌─────────────────────────────────────────┐
│ TopBar (user, company, settings)        │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │     Main Content Area        │
│ (nav)    │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

### Pipeline View (Kanban)
```
┌──────────┬──────────┬──────────┬────────┐
│  Stage 1 │  Stage 2 │  Stage 3 │ Stage 4│
│  ┌────┐  │  ┌────┐  │          │        │
│  │card│  │  │card│  │          │        │
│  └────┘  │  └────┘  │          │        │
│  ┌────┐  │          │          │        │
│  │card│  │          │          │        │
│  └────┘  │          │          │        │
└──────────┴──────────┴──────────┴────────┘
```

---

## Accessibility

- Minimum contrast ratio: 4.5:1
- Focus indicators on all interactive elements
- Keyboard navigation support
- Screen reader labels
