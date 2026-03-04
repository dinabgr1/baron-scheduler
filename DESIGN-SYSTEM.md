# Baron Scheduler Design System

## Color Palette (from aircraft 4X-DZJ)
- **Background**: #eef0f4 (light gray-blue)
- **Cards**: #ffffff (white, border: rgba(0,0,0,0.06), shadow: 0 1px 3px rgba(0,0,0,0.04))
- **Gold accent**: #c9a961 (primary accent — buttons "הזמן טיסה", active nav, fuel bar, "Baron 58")
- **Gold text on light bg**: #a0833a
- **Red accent**: #c23030 (secondary — pending status, 100h warning bar, "B" in BARON logo, "היום" marker)
- **Green**: emerald-400/500 (confirmed status)
- **Text primary**: #1e2432
- **Text muted**: rgba(30,36,50,0.4)
- **Text dim**: rgba(30,36,50,0.2)

## Fonts
- **Body**: DM Sans (Google Fonts) — import: `DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700`
- **Numbers/technical**: DM Mono — import: `DM+Mono:wght@400;500`

## Components
- **Nav glass**: bg rgba(255,255,255,0.85), backdrop-filter blur(24px) saturate(180%), border-bottom rgba(0,0,0,0.06)
- **Cards**: white bg, rounded-xl (mobile) / rounded-2xl (desktop), subtle border + shadow
- **Status badges**: 
  - מאושר (confirmed): emerald text + emerald/8 bg
  - ממתין (pending): red-500 text + red-500/8 bg
- **Buttons**: gold-bg (#c9a961) with dark text (#1e2432)
- **Logo**: "BARON" with red "B" (#c23030), rest dark text
- **Accent stripe**: gradient from red to gold under hero

## Layout
- RTL Hebrew
- Mobile-first responsive
- Desktop: max-w-[1060px] centered
- Mobile: full-width with px-4 padding
- Desktop nav: top bar with tabs
- Mobile nav: bottom bar with icons + labels
- Hero: 4X-DZJ photo at `/4x-dzj-hero.jpg` with gradient fade to #eef0f4

## Reference
See DESIGN-REFERENCE.html for the full working demo
