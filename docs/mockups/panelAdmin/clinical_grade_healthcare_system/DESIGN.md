---
name: Clinical Grade Healthcare System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#40474f'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707881'
  outline-variant: '#c0c7d1'
  surface-tint: '#006399'
  primary: '#00507d'
  on-primary: '#ffffff'
  primary-container: '#0369a1'
  on-primary-container: '#cbe4ff'
  inverse-primary: '#94ccff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#3d4e58'
  on-tertiary: '#ffffff'
  tertiary-container: '#556670'
  on-tertiary-container: '#d2e3ef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#94ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004b74'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#d3e5f1'
  tertiary-fixed-dim: '#b7c9d5'
  on-tertiary-fixed: '#0c1e26'
  on-tertiary-fixed-variant: '#384953'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  title-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  metric-display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.03em
  metric-sub:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  gutter-compact: 0.5rem
  gutter-default: 0.75rem
  gutter-spacious: 1rem
  margin-screen: 1rem
---

## Brand & Style

This design system is engineered for high-acuity clinical environments, operational hospital command desks, EHR/EMR workflows, and institutional healthcare management. The emotional baseline is absolute trust, uncompromising clarity, and calm precision under pressure.

### Design Style: Institutional Clinical Precision
The style draws from modern Swiss typography and utilitarian institutional interfaces:
- **Zero Decorative Noise**: Strictly zero non-functional illustrations, playful emojis, or generic hero photography. Every visual asset must communicate actionable diagnostic, demographic, or operational status.
- **High Information Density**: Compact vertical heights, dense modular grids, and clear structural lines allow clinicians and triage managers to process multi-parameter patient charts and operational bottlenecks without scrolling friction.
- **Visual Ergonomics**: Light slate backgrounds prevent monitor glare across 12-hour nursing shifts while maintaining WCAG AAA compliant text contrast ratios.

## Colors

The palette is tuned specifically for optical clarity, low fatigue, and intuitive institutional categorization.

### Surface and Ground Tokens
- **Canvas Base (`#F8FAFC`)**: Ultra-soft slate ground for primary application window panes and layouts.
- **Surface Elevation 0 (`#FFFFFF`)**: Pure white cards, datagrids, and active focus panels to define actionable workspaces.
- **Surface Elevation 1 (`#F1F5F9`)**: Secondary grouped containers, table headers, alternating grid rows, and disabled field backdrops.
- **Border Crisp (`#CBD5E1`)**: Hairline boundary token used for inputs, column splitters, and card outlines. Subordinate interior dividers use `#E2E8F0`.

### Action & Identification Tones
- **Primary Navy Accent (`#0369A1`)**: High-authority interactions, primary confirmation buttons, page headers, active navigational anchors, and vital stat focus. Interactive hover: `#075985`; active press: `#0C4A6E`.
- **Supportive Light Blue (`#0EA5E9`)**: Informational highlights, table row selections, focused input halos, and secondary operational flags.
- **Soft Triage Wash (`#E0F2FE`)**: Tint for informational chips, subtle active item badges, and table selection highlights.
- **Text & Contrast Hierarchy**:
  - **Primary (`#0F172A`)**: Critical telemetry, clinical notes, patient names, active values.
  - **Muted/Metadata (`#475569`)**: Timestamps, unit denominators (e.g., `mg/dL`, `bpm`), table column headers.
  - **Disabled/Placeholder (`#94A3B8`)**: Input hints and inactive toggles.

### Clinical Telemetry & Triage (Functional)
- **Critical / Emergency (`#DC2626` / wash `#FEF2F2`)**: Code blue, severe triage, lethal drug interaction warnings.
- **Cautionary / Warning (`#D97706` / wash `#FFFBEB`)**: Pending lab validations, elevated vitals, allergy notifications.
- **Stable / Verified (`#16A34A` / wash `#F0FDF4`)**: Normal ranges, verified patient identity, discharged state.

## Typography

Inter was selected for its exceptional legibility at compact sizes, robust x-height, and superior open-type tabular figures indispensable for numeric telemetry.

### Typographic Rules
- **Tabular Numerics**: All numeric indicators, blood panel results, timestamps, dosages, and patient record IDs must strictly enforce `font-feature-settings: "tnum" 1, "cv05" 1`. This prevents layout shifts across dynamic data streams and vertically aligns decimal points across data tables.
- **All-Caps Restraint**: Restrict uppercase transformations to `label-sm` metadata flags, table headers, and status tokens (e.g., `STAT`, `PRN`, `NPO`, `ICU`).
- **Hierarchy Discretion**: Headlines are intentionally scaled down (capping at 24px on desktop) to optimize vertical viewport utility. Prominence is communicated via font weight (`600`/`700`) and value-to-label proximity rather than sheer font size.

## Layout & Spacing

The layout model relies on a dense, utilitarian 12-column grid anchored by a collapsible multi-tier master sidebar and context panel.

### Spatial Rhythm
- **4px/8px Atomic Scale**: All margins, paddings, and column heights align to a 4px grid (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 12px, `space-base` = 16px).
- **Component Compactness**: Interactive table rows must adhere to a strict 36px (compact) or 44px (standard) height to maximize visible clinical metrics above the fold.
- **Split View Patterns**: In patient chart modes, use a fixed left-hand rail for identity and vital baseline (320px), a fluid center pane for charting/orders, and a collapsible right-hand utility tray (360px) for lab logs and history.

### Form Factors & Breakpoints
- **Desktop Primary (≥1440px)**: 12 columns, 16px gutters. Triple-pane interfaces display concurrently without modal truncation.
- **Tablet / Clinical Cart (1024px - 1439px)**: 12 columns, 12px gutters. Right utility pane folds into a sliding drawer; vital signs bar remains persistent.
- **Mobile Handheld (≤1023px)**: Single column fluid view, 8px margins. Sticky bottom bar for critical actions (e.g., "Add Dose", "Escalate Triage"). Tabular data collapses into stacked labeled cards.

## Elevation & Depth

To preserve institutional authority and reduce visual ambiguity, visual hierarchy relies on crisp borders and distinct surface tones rather than heavy atmospheric shadows.

### Elevation Principles
- **Plane Definition (Flat Precision)**: Surfaces sit on a 1px perimeter outline (`#CBD5E1`). Depth is achieved through backdrop shifting (`#F8FAFC` canvas beneath `#FFFFFF` surfaces), not exaggerated shadows.
- **Layer 0 (Base Grid & Canvas)**: `#F8FAFC`. Zero shadow.
- **Layer 1 (Cards, Tables, Panels)**: `#FFFFFF` filled surface with a 1px solid `#E2E8F0` border. Shadow is microscopic: `0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Layer 2 (Dropdowns, Popovers, Flyout Context Menus)**: `#FFFFFF` surface, 1px solid `#CBD5E1` border with a crisp containment shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Modals, High-Alert Dialogues)**: `#FFFFFF` surface, 1px solid `#94A3B8` border with a high-contrast backing shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.16), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`. Modal backdrops use an institutional slate wash: `rgba(15, 23, 42, 0.60)`.

## Shapes

The geometric signature is controlled, disciplined, and clinical. Elements feature subtle 4px corner radii (`roundedness: 1`), conveying modern digital craftsmanship while maintaining the structural stability of classic medical instruments.

- **Base Components (Inputs, Buttons, Cards, Tooltips)**: 4px (`0.25rem`). Maintains sharp grid alignments across adjacent fields.
- **Badges and Status Chips**: 2px or 4px (`rounded-sm`). Strictly avoid full circular pill geometries for clinical data chips to preserve horizontal space and maintain tabular cohesion.
- **Segmented Controls & Tab Containers**: 4px exterior container with 2px interior indicator tabs.

## Components

### Buttons
- **Primary Action**: Solid `#0369A1` background, `#FFFFFF` text, 1px solid `#0284C7`. 36px height (`space-md` horizontal padding). Hover: `#075985`. Focus ring: 2px `#0EA5E9` with 2px offset.
- **Secondary Action**: Solid `#FFFFFF` background, `#0369A1` text, 1px solid `#CBD5E1`. Hover: `#F8FAFC`, border `#94A3B8`.
- **Destructive/Emergency**: Solid `#DC2626` background, `#FFFFFF` text, 1px solid `#B91C1C`.
- **Icon Utility Button**: 32x32px or 36x36px square with 1px solid `#E2E8F0` border, `#475569` icon color.

### Form Inputs & Selectors
- **Input Fields**: 36px height, `#FFFFFF` ground, 1px solid `#CBD5E1` border, `#0F172A` text, 13px font size. Placeholder: `#94A3B8`.
- **Focus State**: 1px solid `#0284C7` border with a 2px outer glow of `#E0F2FE`. No fuzzy shadows.
- **Labels & Units**: Top-aligned 11px uppercase label (`#475569`, weight 600). Integrated trailing unit indicator (e.g., `mg`, `mL/hr`) locked to the right margin in `#64748B`.

### Data Tables (Clinical Grids)
- **Header Row**: 32px height, `#F1F5F9` background, `#475569` text, 11px uppercase, bold (`600`), 1px solid `#CBD5E1` bottom border.
- **Body Rows**: 36px height (compact telemetry) or 44px (patient listings), `#FFFFFF` ground with alternating `#F8FAFC` striping for complex registries. 1px solid `#E2E8F0` row dividers. Hover row state: `#F0F9FF` with a 2px `#0284C7` indicator on the far left edge.
- **Numeric Alignment**: Text columns left-aligned; all numeric lab readings, dosages, and metrics strictly right-aligned with `tabular-nums`.

### Status Badges & Triage Tags
- **Informational / Blue**: `#E0F2FE` background, `#0369A1` text, 1px solid `#BAE6FD`.
- **Critical / Stat**: `#FEF2F2` background, `#991B1B` text, 1px solid `#FECACA`.
- **Cautionary**: `#FFFBEB` background, `#92400E` text, 1px solid `#FDE68A`.
- **Normal / Confirmed**: `#F0FDF4` background, `#166534` text, 1px solid `#BBF7D0`.
- **Geometry**: Compact padding (2px vertical, 6px horizontal), 11px font size, weight 600.

### Checkboxes & Radios
- **Checkbox**: 16x16px square, 2px border radius, 1px solid `#94A3B8`. Checked state: solid `#0369A1` with an invariant white check icon.
- **Radio**: 16x16px circle, 1px solid `#94A3B8`. Selected state: `#FFFFFF` fill with an internal 6px solid `#0369A1` center pip.

### Metric Callout Tiles
- **Structure**: Surface `#FFFFFF`, 1px solid `#CBD5E1` border, 12px padding.
- **Layout**: Top row carries micro-label (`11px`, bold uppercase `#64748B`) and trend icon; center features the metric in `32px` bold tabular font; bottom row displays reference range baseline (e.g., `Ref: 70 - 99 mg/dL`).