# Design System

---

## Style

* **Modern**
* **Minimal**
* **Professional**

---

## Typography

* **Primary Font:** Inter, sans-serif
* **Headings:** Inter SemiBold (600) / Bold (700)
* **Body:** Inter Regular (400) / Medium (500)
* **Code / Monospace:** JetBrains Mono (for tech tags, code snippets, and API keys)

---

## Color Palette

### Base Colors

* **Primary:** `#6366F1` (Indigo 500 - Main brand color, active CTA buttons, active state highlights)


* **Primary Hover:** `#4F46E5` (Indigo 600 - Hover states for primary buttons and active elements)
* **Background:** `#F8FAFC` (Slate 50 - Page background fill)
* **Surface / Card Background:** `#FFFFFF` (Pure White - Clean contrast against slate background)
* **Border:** `#E2E8F0` (Slate 200 - Subtle card and container borders)

### Text Colors

* **Text Primary:** `#0F172A` (Slate 900 - Headings, main title labels, primary copy)
* **Text Secondary:** `#475569` (Slate 600 - Body descriptions, subtitle copy)
* **Text Muted:** `#64748B` (Slate 500 - Form helpers, inactive tabs, timestamps)

### Status & Accents

* **Success / Live Indicator:** `#10B981` (Emerald 500 - "Live Now" badges, verified user ticks)


* **Warning:** `#F59E0B` (Amber 500 - Pending join requests, pending approvals)
* **Destructive / Error:** `#EF4444` (Red 500 - End meeting actions, reject request buttons, field validation errors)
* **Badge Accent (Alma Mater):** `#8B5CF6` (Purple 500 - Shared college / alumni match tag)

---

## Buttons

### 1. Primary Button

* **Background:** `#6366F1`
* **Text:** `#FFFFFF` (Medium, 14px)
* **Border Radius:** `8px` (`rounded-lg`)
* **Padding:** `10px 18px` (`px-4 py-2.5`)
* **Hover State:** Background `#4F46E5` with `transition-all duration-150`
* **Usage:** "Start Live Room", "Request to Join", "Save Profile"

### 2. Secondary Button

* **Background:** `#FFFFFF`
* **Text:** `#0F172A` (Medium, 14px)
* **Border:** `1px solid #CBD5E1` (`border-slate-300`)
* **Border Radius:** `8px` (`rounded-lg`)
* **Padding:** `10px 18px` (`px-4 py-2.5`)
* **Hover State:** Background `#F1F5F9` (`slate-100`)
* **Usage:** "View Profile", "Filter", "Cancel"

### 3. Destructive Button

* **Background:** `#EF4444`
* **Text:** `#FFFFFF` (Medium, 14px)
* **Border Radius:** `8px` (`rounded-lg`)
* **Padding:** `10px 18px` (`px-4 py-2.5`)
* **Hover State:** Background `#DC2626`
* **Usage:** "Leave Room", "End Live Session", "Reject Candidate"

---

## Cards & Containers

* **Border Radius:** `12px` (`rounded-xl`)
* **Background:** `#FFFFFF`
* **Border:** `1px solid #E2E8F0`
* **Shadow:** `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` (`shadow-sm`)
* **Hover Shadow:** `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` (`hover:shadow-md`)
* **Padding:** `20px` (`p-5`)
* **Usage:** Room cards, Mentor profile cards, Request queue list items

---

## Badges & Tags

* **Border Radius:** `9999px` (`rounded-full`)
* **Padding:** `4px 10px` (`px-2.5 py-1`)
* **Typography:** Inter Medium, `12px`
* **Variants:**
* **Live Badge:** Green fill `#D1FAE5`, text `#065F46`, includes pulsing green dot (`#10B981`)
* **Verified Alumni Badge:** Indigo fill `#E0E7FF`, text `#3730A3`
* **Skill Tag:** Slate fill `#F1F5F9`, text `#334155`



---

## UX Requirements

* **Mobile Responsive:** Layouts must fluidly collapse into a single-column layout on mobile viewports (<768px), maintaining touch-friendly hit areas ($\ge 44px$) for buttons.
* **Loading States:** Skeleton UI placeholders (`animate-pulse`) for video feed cards and profile loading; spinning indicators on buttons during API submit actions.
* **Empty States:** Clear illustrations or icons with friendly messaging when no live rooms are active or when search query yields 0 results.
* **Error States:** Contextual inline error messages below form fields in `#EF4444` text; persistent toast notifications for websocket disconnects or video connection drops.
* **Accessible Forms:** Explicit `<label>` elements for all inputs, high-contrast text ratios ($\ge 4.5:1$), and visible ring outline focus states (`focus:ring-2 focus:ring-indigo-500`) for keyboard navigation.