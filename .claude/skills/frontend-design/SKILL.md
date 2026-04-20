# Frontend Design Skill

Source: https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md

Create distinctive, production-grade web interfaces that reject generic "AI aesthetics." Before writing any code, establish a bold aesthetic direction.

## Design Thinking First

Before coding, answer:
- **Purpose & tone**: What feeling should this evoke? (brutalist, maximalist, retro-futuristic, refined minimalist, etc.)
- **Context**: What makes this design right for *this* product and audience?
- **Differentiation**: What makes it unforgettable rather than forgettable?

Choose a clear conceptual direction and execute it with precision.

## Visual Excellence

### Typography
- Use distinctive font choices that elevate the aesthetic — avoid Inter, Roboto, and other overused defaults
- Establish a clear type hierarchy with intentional sizing and weight contrast

### Color
- Commit to a cohesive palette with dominant colors and sharp accents
- Use CSS custom properties (`--color-*`) for all palette values
- Avoid clichéd purple gradients and generic "startup" color schemes

### Motion
- Focus animations on high-impact moments: page entry, state transitions, reveals
- Use staggered reveals for list/grid content
- Keep motion purposeful — not decorative noise

### Composition
- Employ unexpected layouts: asymmetry, overlap, unconventional grids
- Use whitespace deliberately — not just as padding
- Break out of the centered-column default

### Atmosphere
- Add depth with gradients, subtle textures, or contextual background effects
- Match atmosphere to tone: dark + grain for editorial, clean + light for product, etc.

## What to Avoid

- Generic fonts: Inter, Roboto, DM Sans (unless used with intention)
- Clichéd gradients: purple-to-blue, pink-to-orange
- Predictable layouts: hero → features → CTA cookie-cutter structure
- AI-looking aesthetics: glassy cards, neon accents, floating blobs
- Inconsistent design language across components

## Execution Standard

- All code must be **production-grade and functional**
- Match implementation complexity to your vision — maximalist designs warrant elaborate CSS; minimalist work demands precision in spacing and type
- Use CSS variables for theming
- Components must look intentional, not assembled from a UI kit
- The result should feel "genuinely designed for this context," not generated

## Output

When implementing a design, always:
1. State your chosen aesthetic direction and why it fits
2. Define the color palette and type system before building components
3. Implement with cohesive, context-specific styling throughout
