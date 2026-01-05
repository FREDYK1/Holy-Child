# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Tooling & Commands

### Install & run locally
- Install dependencies: `npm install`
- Start dev server (Next.js App Router, port 3000 by default): `npm run dev`
  - App entry: `app/page.tsx`

### Linting
- Run ESLint with the Next.js config: `npm run lint`
  - Config: `eslint.config.mjs` (extends `eslint-config-next` core web vitals + TypeScript rules).

### Build & production run
- Build for production: `npm run build`
- Start production server: `npm start`
  - Uses `next.config.ts` (currently minimal) and `tailwind.config.cjs`.

### Tests
- There are currently **no** test scripts defined in `package.json` and no test files in the repo. If tests are added later, prefer wiring them through an npm script (e.g. `npm test`) so future agents can run them consistently.

### Environment variables & external services
- Paystack API routes in `app/api/paystack/*/route.ts` require:
  - `PAYSTACK_SECRET_KEY` – secret key used in the `Authorization` header.
  - `NEXT_PUBLIC_BASE_URL` – used to build the Paystack callback URL for `/orderconfirmation`.
- EmailJS usage in `app/orderconfirmation/OrderConfirmationClient.tsx` is currently configured with hard-coded keys/IDs via `emailjs.init()` and `emailjs.send()`. Changes here must stay in sync with the EmailJS dashboard configuration.

## High-level architecture

### Framework & core layout
- The app is a **Next.js 16 App Router** project using **TypeScript** with `allowJs: true` (see `tsconfig.json`).
- Global layout: `app/layout.tsx`
  - Imports `app/globals.css` (Tailwind 4 via `@import "tailwindcss";`).
  - Sets basic metadata and favicon (`/holychildlogo.png`).
  - Wraps all routes in a minimal `<html><body>` shell.
- Tailwind configuration: `tailwind.config.cjs`
  - Scans `app/**/*.{js,ts,jsx,tsx}` and `components/**/*.{js,ts,jsx,tsx}`.
  - Defines project-specific colors (`primaryBrown`, `posterBrown`) and a `serif` font family alias.

### User journey & state flow
The application is effectively a **single-page funnel** implemented as multiple App Router pages. User state flows entirely through **`localStorage`** keys rather than a backend database.

1. **Landing page – `/` (`app/page.tsx`)**
   - Marketing/hero page for the Holy Child 80th Anniversary framing offering.
   - Uses `ButtonComponent` from `app/components/buttoncomponent.jsx` to link into the flow (`/uploadpic`).

2. **Upload photo – `/uploadpic` (`app/uploadpic/page.tsx`)**
   - Client component that:
     - Prompts for a portrait image file.
     - Reads the file via `FileReader` and stores the base64 data URL under `localStorage` key **`hc_upload`**.
     - Shows a visual preview (desktop + mobile layouts) using the uploaded image.
   - Navigation:
     - CTA links to `/frames` without any server involvement. From this point on, downstream pages assume `hc_upload` is present.
   - Shared UI:
     - Uses `Header` from `app/components/Header.jsx` for consistent top navigation and back button.

3. **Frame selection & interactive editing – `/frames` (`app/frames/page.tsx`)**
   - Client page responsible for **core image manipulation** and **initial composite generation**.
   - Defines `FRAMES` (frame presets) referencing assets in `public/`:
     - `frame-1` → `/pic1.svg` (classic circular layout).
     - `frame-2` → `/pic2.svg` (rectangular/anniversary layout).
   - Loads the uploaded photo from `localStorage` key **`hc_upload`**.

   **InteractiveImage component (inline in `frames/page.tsx`)**
   - A custom, ref-exposed component that encapsulates all **pan/zoom/transform logic** for the user’s image:
     - Handles mouse/touch pointer events, wheel zoom, and two-finger pinch gestures.
     - Tracks
       - `scale`
       - `offset` ({ x, y } in screen pixels relative to the center)
       - `displayedW`, `displayedH`, `baseScale`, and container size.
     - Exposes a `getState()` method through `useImperativeHandle`, which returns a canonical **transform object**:
       ```ts path=null start=null
       {
         scale,
         offset: { x, y },
         displayedW,
         displayedH,
         baseScale,
         containerW,
         containerH,
       }
       ```
   - This transform object shape is relied on later by both the compositing functions and the order confirmation page. If you modify it, you must update:
     - `createComposite` in `app/frames/page.tsx`
     - `createComposite` in `app/payment/page.tsx` (if used)
     - `createComposite` in `app/orderconfirmation/OrderConfirmationClient.tsx`
     - Any code that reads `orderData.transform` from `localStorage`.

   **Compositing in `/frames`**
   - `createComposite(frameSrc, uploadDataUrl, transform?)` builds an offscreen `<canvas>` (currently 600×750) and:
     1. Fetches the frame SVG and draws it as a background.
     2. Draws the user image based on the transform (if provided) or a default cover layout.
     3. Returns a PNG data URL.
   - The **“Make Payment”** action:
     - Uses `interactiveRef.getState()` to capture the current transform.
     - Calls `createComposite` to generate the composite.
     - Writes to `localStorage`:
       - **`hc_final`** – final composite PNG data URL.
       - **`hc_order`** – JSON blob containing:
         - `frameId`
         - `compositeImage`
         - `originalUpload` / `upload`
         - `transform` (the object from `InteractiveImage`)
         - `timestamp`, `isProcessed`
     - Navigates to `/payment` via `router.push`.

4. **Payment – `/payment` (`app/payment/page.tsx`)**
   - Client page that:
     - Reads `hc_order` from `localStorage` (for potential future use).
     - Collects **customer name and email** only (no card or MoMo logic here; handled entirely by Paystack).
     - Validates email with a simple regex.
     - Stores customer data in `localStorage` under **`hc_customer`**.
   - Payment initiation:
     - Calls `POST /api/paystack/init` with `{ email }`.
     - Expects a JSON response with `authorization_url` from Paystack.
     - Redirects the browser to the Paystack checkout by setting `window.location.href`.
   - Amount and currency are fixed in the API route (currently 20 GHS in pesewas).

5. **Order confirmation & download – `/orderconfirmation`**
   - Server entry: `app/orderconfirmation/page.tsx` wraps `OrderConfirmationClient` in a `Suspense` boundary.
   - Client logic in `app/orderconfirmation/OrderConfirmationClient.tsx` is the **central hub** for:
     - Verifying payment.
     - Ensuring a high-resolution composite exists.
     - Sending confirmation emails.
     - Rendering the final framed image and enabling download.

   **Data loading & selection**
   - Reads from `localStorage` on mount:
     - `hc_order` → `orderData` (includes frameId, transform, uploads, compositeImage).
     - `hc_customer` → `customerData` (fullName, email).
   - Re-resolves the frame preset (`FRAMES`) using `orderData.frameId`.
   - Extracts `originalUpload` and `transform` for use in both preview and compositing.

   **Payment verification & composite generation**
   - Obtains `reference` from the query string via `useSearchParams()`.
   - In a `useEffect`:
     1. Posts to `POST /api/paystack/verify` with `{ reference }`.
     2. If verification is successful:
        - Checks `localStorage.hc_final`.
        - If missing, recomputes the composite using its own `createComposite` (1200×1500 canvas) and stores it in both `hc_final` and `hc_order.compositeImage`.
        - Sends a confirmation email via EmailJS (if customer data exists and `emailSent` is still false).
     3. If verification fails:
        - Alerts the user and redirects back to `/payment`.

   **Rendering & download mechanism**
   - Uses a `div` referenced by `captureRef` that visually combines:
     - The frame image as a CSS `backgroundImage` (using `selectedFrame.src`).
     - The original uploaded photo drawn as an `<img>` overlay whose style mirrors the stored `transform` (scale, offset, container dimensions, and circular vs rectangular mask).
   - Download flow (desktop and mobile):
     - `html2canvas(captureRef, { backgroundColor: null, scale: 4, useCORS: true })` captures the composed DOM region.
     - Converts the resulting canvas to PNG and triggers a download via an `<a>` element with `download="framed-photo.png"`.
   - This means **the DOM representation and the transform object must stay in sync**: if you change how transform is interpreted in `/frames`, you must adjust the styles here accordingly.

### Shared UI components
- `app/components/Header.jsx`
  - Gradient top bar with centered label and a left-aligned back button.
  - Used by all inner pages (`/uploadpic`, `/frames`, `/payment`, `/orderconfirmation`) to ensure consistent navigation.
- `app/components/buttoncomponent.jsx`
  - Simple styled `Link` wrapper used on the home page (and suitable for other CTA buttons).
- `app/components/HomePage.jsx`
  - Standalone logo-only component; currently not wired into `app/page.tsx` but can be used if you refactor the landing page.

### Key coupling points to be aware of
- **LocalStorage contract**
  - `hc_upload` (raw upload data URL) → produced at `/uploadpic`, consumed at `/frames`.
  - `hc_order` (order JSON with transform + frame selection) → produced at `/frames`, read at `/payment` and `/orderconfirmation`.
  - `hc_final` (final composite PNG) → produced at `/frames` or recomputed at `/orderconfirmation`.
  - `hc_customer` (name + email) → produced at `/payment`, consumed at `/orderconfirmation` when sending the confirmation email.
- **Transform object shape**
  - The structure returned by `InteractiveImage.getState()` is written directly into `hc_order.transform` and reused across multiple modules for both compositing and DOM positioning. Any schema changes here will ripple across the pipeline.
- **External services**
  - Paystack routes rely on environment variables and correct callback URLs.
  - EmailJS usage is tightly coupled to the specific service ID, template ID, and public key hard-coded into `OrderConfirmationClient`.

Keeping these relationships in mind will help future changes (e.g. adding new frame types, changing the canvas size, or swapping payment providers) stay coherent across pages and prevent subtle breakage in the end-to-end flow.