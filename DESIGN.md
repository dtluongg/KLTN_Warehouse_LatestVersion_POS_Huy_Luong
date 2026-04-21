---
tokens:
    color:
        brand:
            primary:
                value: "#0f766e"
                type: color
            primarySoft:
                value: "#ccfbf1"
                type: color
            primaryForeground:
                value: "#ffffff"
                type: color
            accent:
                value: "#f59e0b"
                type: color
            accentForeground:
                value: "#ffffff"
                type: color
        neutral:
            background:
                value: "#f8fafc"
                type: color
            foreground:
                value: "#0f172a"
                type: color
            surface:
                value: "#ffffff"
                type: color
            surfaceRaised:
                value: "#f1f5f9"
                type: color
            surfaceForeground:
                value: "#1e293b"
                type: color
            muted:
                value: "#f1f5f9"
                type: color
            mutedForeground:
                value: "#64748b"
                type: color
            border:
                value: "#e2e8f0"
                type: color
            input:
                value: "#f1f5f9"
                type: color
            ring:
                value: "#14b8a6"
                type: color
            overlay:
                value: "rgba(15, 23, 42, 0.4)"
                type: color
            glass:
                value: "rgba(255, 255, 255, 0.85)"
                type: color
        status:
            success:
                value: "#10b981"
                type: color
            info:
                value: "#3b82f6"
                type: color
            warning:
                value: "#f59e0b"
                type: color
            danger:
                value: "#ef4444"
                type: color
        feedback:
            statusDraftBackground:
                value: "#fef3c7"
                type: color
            statusDraftForeground:
                value: "#92400e"
                type: color
            statusSuccessBackground:
                value: "#d1fae5"
                type: color
            statusSuccessForeground:
                value: "#065f46"
                type: color
            statusDangerBackground:
                value: "#fee2e2"
                type: color
            statusDangerForeground:
                value: "#991b1b"
                type: color
            statusInfoBackground:
                value: "#dbeafe"
                type: color
            statusInfoForeground:
                value: "#1e40af"
                type: color
            statusNeutralBackground:
                value: "#e2e8f0"
                type: color
            statusNeutralForeground:
                value: "#334155"
                type: color
    typography:
        family:
            base:
                value: "System, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
                type: fontFamily
        size:
            caption:
                value: 12
                type: fontSize
            body:
                value: 16
                type: fontSize
            label:
                value: 14
                type: fontSize
            title:
                value: 20
                type: fontSize
            h3:
                value: 24
                type: fontSize
            h2:
                value: 30
                type: fontSize
            h1:
                value: 40
                type: fontSize
        lineHeight:
            caption:
                value: 18
                type: lineHeight
            body:
                value: 24
                type: lineHeight
            label:
                value: 20
                type: lineHeight
            title:
                value: 28
                type: lineHeight
            h3:
                value: 30
                type: lineHeight
            h2:
                value: 38
                type: lineHeight
            h1:
                value: 48
                type: lineHeight
        weight:
            regular:
                value: 400
                type: fontWeight
            medium:
                value: 500
                type: fontWeight
            semibold:
                value: 600
                type: fontWeight
            bold:
                value: 700
                type: fontWeight
    spacing:
        xxs:
            value: 2
            type: spacing
        xs:
            value: 4
            type: spacing
        sm:
            value: 8
            type: spacing
        smd:
            value: 12
            type: spacing
        md:
            value: 16
            type: spacing
        mdl:
            value: 20
            type: spacing
        lg:
            value: 24
            type: spacing
        xl:
            value: 32
            type: spacing
        xxl:
            value: 48
            type: spacing
        xxxl:
            value: 64
            type: spacing
    radius:
        sm:
            value: 6
            type: radius
        md:
            value: 10
            type: radius
        lg:
            value: 14
            type: radius
        xl:
            value: 20
            type: radius
        full:
            value: 9999
            type: radius
    elevation:
        sm:
            value: 1
            type: elevation
        md:
            value: 3
            type: elevation
        lg:
            value: 5
            type: elevation
        float:
            value: 10
            type: elevation
    shadow:
        sm:
            value:
                color: "#0f172a"
                offsetX: 0
                offsetY: 1
                blur: 2
                opacity: 0.05
            type: shadow
        md:
            value:
                color: "#0f172a"
                offsetX: 0
                offsetY: 4
                blur: 6
                opacity: 0.06
            type: shadow
        lg:
            value:
                color: "#0f172a"
                offsetX: 0
                offsetY: 10
                blur: 15
                opacity: 0.08
            type: shadow
        float:
            value:
                color: "#0f172a"
                offsetX: 0
                offsetY: 20
                blur: 25
                opacity: 0.1
            type: shadow
    motion:
        duration:
            fast:
                value: 120ms
                type: duration
            standard:
                value: 180ms
                type: duration
            slow:
                value: 240ms
                type: duration
        easing:
            standard:
                value: cubic-bezier(0.2, 0, 0, 1)
                type: cubicBezier
        interaction:
            tapScale:
                value: 0.98
                type: number
            pressedOpacity:
                value: 0.92
                type: number
    layout:
        breakpoint:
            mobile:
                value: 0
                type: breakpoint
            tablet:
                value: 768
                type: breakpoint
            desktop:
                value: 1200
                type: breakpoint
        contentWidth:
            value: 1200
            type: measure
---

# Design Intent

This product is designed as an operational workspace: clear, dependable, and fast to scan. The visual language favors neutral surfaces, teal-led actions, and restrained decoration so that inventory, orders, returns, and staff workflows stay legible under heavy daily use.

The overall feeling is clean rather than ornamental. White cards sit on a pale slate background, with thin borders and modest elevation used to separate layers without making the interface feel heavy. Teal is the primary brand color and should be reserved for the main action path, navigation emphasis, active states, and high-signal confirmations. Amber is the secondary accent for supportive highlights and attention moments, while red, blue, and green are reserved for status and feedback.

Typography is practical and compact. Headers are bold and slightly oversized to establish hierarchy quickly, while body text stays at a comfortable reading size for forms and tables. Labels are semibold and small enough to keep dense screens readable. The system should feel like a professional control panel, not a marketing site.

Spacing is consistent and moderate. The interface relies on an 8-point rhythm with enough room for touch targets, but not so much whitespace that information density drops. Forms and tables should feel efficient, with small internal gaps, clear grouping, and visible section boundaries.

Radii are soft but not exaggerated. Cards, panels, buttons, and inputs use rounded corners to keep the interface approachable, while still preserving a structured, enterprise feel. Larger radii are used for hero surfaces and floating containers; smaller radii fit compact controls and inline fields.

Elevation is subtle. Shadows are light and blurred, mainly to distinguish raised surfaces, drawers, dialogs, and floating panels from the background. The system should avoid dramatic depth cues. Instead, separation comes from border contrast, surface tone, and hierarchy.

Motion should be understated and purposeful. Transitions are short and crisp, with an emphasis on clarity over flourish. Interaction feedback should be immediate: buttons depress slightly, active items shift tone, and overlays appear without theatrical animation. The product should feel responsive and controlled.

The layout language is responsive and role-aware. Mobile experiences should remain compact and vertically stacked, while larger screens can expand into split panels, drawers, and table-heavy layouts. Navigation should always make the active section obvious, and permission states should be visible without looking punitive.

The app’s character comes from its discipline: it is a tool for real operational work, so every visual choice should reduce friction, surface status quickly, and keep attention on the task in front of the user.

# Visual Characteristics

- Primary surfaces are bright and neutral, with a faint cool undertone.
- Action colors are teal-forward, with amber used sparingly to avoid visual noise.
- Status colors are conventional and easy to decode at a glance.
- Cards, tables, and drawers form the main structural vocabulary.
- Dense data views should feel orderly, not cramped.
- Inputs, search bars, and filters should read as quiet utility controls.
- Empty states should feel calm and informative, never decorative.
- The brand presentation can be slightly more expressive on entry screens, but the working UI should stay conservative and efficient.

# Interaction Principles

1. Keep primary actions visually dominant and limited in number.
2. Use muted foreground tones for secondary controls, metadata, and inactive items.
3. Prefer borders and surface contrast before introducing extra color.
4. Preserve consistent rhythm between lists, cards, and form sections.
5. Make state changes easy to parse, especially for status chips, active navigation, and disabled permissions.

# Component Mood

Tables should feel like ledger surfaces: organized, stable, and optimized for reading. Forms should feel administrative and dependable, with clear labels, compact fields, and obvious sectioning. Navigation should be compact and functional, with active highlights that are unmistakable but restrained. Empty states should communicate absence without pulling attention away from the workflow.

# What To Protect

The most important part of this design system is its restraint. If additional features are added later, they should inherit the same calm palette, modest depth, and operational clarity. Avoid ornamental gradients, loud backgrounds, oversized shadows, and decorative motion that competes with the data.
