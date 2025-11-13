# Holy Child Custom Framing App

A Next.js web application for creating custom framed photos for Holy Child College of Education's 80th Anniversary. Users can upload photos, select frames, adjust positioning, and download high-quality framed images.

## Features

- **Photo Upload**: Upload portrait photos (JPEG/PNG)
- **Frame Selection**: Choose from Classic (circular) or Anniversary (rectangular) frames
- **Interactive Preview**: Pan, zoom, and resize photos to fit frames perfectly
- **High-Quality Output**: Generate 1200x1500 PNG composites
- **Mobile Money Payment**: Collect payment details for processing
- **Download Ready**: Instant download of framed photos

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Image Processing**: HTML5 Canvas API
- **State Management**: localStorage for client-side persistence

## Project Flow

### 1. Home Page (`app/page.tsx`)
- Displays Holy Child logo and promotional content
- "Start Framing" button navigates to upload page

### 2. Upload Photo (`app/uploadpic/page.tsx`)
- User uploads a portrait photo
- Photo stored as base64 in localStorage
- "Select Frame" navigates to frame selection

### 3. Select Frame (`app/frames/page.tsx`)
- Choose between Classic or Anniversary frames
- Preview modal with interactive image adjustment (pan/zoom/touch)
- "Make Payment" generates composite and stores order data

### 4. Payment (`app/payment/page.tsx`)
- Order summary (GHC 20.00)
- Collect user details: name, mobile money, network, email
- Confirm payment navigates to confirmation

### 5. Order Confirmation (`app/orderconfirmation/page.tsx`)
- Display final framed photo
- Download link for PNG composite image

## Getting Started

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Build and Deploy

Build for production:

```bash
npm run build
npm start
```

Deploy on Vercel or any Node.js hosting platform.

## Key Components

- `InteractiveImage`: Custom component for photo manipulation
- `Header`: Reusable navigation header with back button
- `ButtonComponent`: Styled link button

## Image Assets

- `/public/holychildlogo.png`: College logo
- `/public/pic1.svg`: Classic frame design
- `/public/pic2.svg`: Anniversary frame design
- `/public/poster.svg`: Sample framed poster
