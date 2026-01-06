# Templates Directory

Templates for AI agents to scaffold new files quickly.

## Available Templates

| Template | Use For | Copy To |
|----------|---------|---------|
| `component.tsx` | New UI component | `components/<type>/` |
| `service.ts` | New service module | `services/` |
| `type.ts` | New type definition | `types/` |

## Usage

1. Copy the appropriate template to its destination
2. Replace placeholder names (e.g., "ComponentName", "TypeName")
3. Implement your logic
4. Export from the folder's `index.ts`
5. Run `npm run build`

## Template Sections

Each template includes:
- Type definitions at the top
- Main implementation
- Reminder comments at the bottom
