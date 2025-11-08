"use client";

import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';

type Transform = { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW?: number; containerH?: number };
type Order = { frameId: string; upload?: string | null; originalUpload?: string | null; transform?: Transform; compositeImage?: string } | null;

export default function PaymentPage() {
  const [fullName, setFullName] = useState('');
  const [momo, setMomo] = useState('');
  const [network, setNetwork] = useState('');
  const [email, setEmail] = useState('');
  const order = useMemo<Order>(() => {
    try {
      const raw = localStorage.getItem('hc_order');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const router = useRouter();

  async function createComposite(frameSrc: string, uploadData?: string | null, transform?: { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW?: number; containerH?: number } | null) {
    // create a canvas and draw upload then frame overlay
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // draw background white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // draw uploaded image if present
    if (uploadData) {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new window.Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = uploadData;
      });

      if (transform && typeof transform.scale === 'number') {
        // Use provided transform to position the image exactly like the preview
        const { scale, offset, displayedW, displayedH, containerW = 300, containerH = 400 } = transform;
        const canvasScaleX = width / containerW;
        const canvasScaleY = height / containerH;
        const dw = displayedW * scale * canvasScaleX;
        const dh = displayedH * scale * canvasScaleY;
        const centerX = width / 2 + offset.x * canvasScaleX;
        const centerY = height / 2 + offset.y * canvasScaleY;
        const ix = centerX - dw / 2;
        const iy = centerY - dh / 2;
        ctx.drawImage(img, ix, iy, dw, dh);
      } else {
        // cover the canvas
        const ratio = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const iw = img.naturalWidth * ratio;
        const ih = img.naturalHeight * ratio;
        const ix = (width - iw) / 2;
        const iy = (height - ih) / 2;
        ctx.drawImage(img, ix, iy, iw, ih);
      }
    }

    // draw frame overlay
    const frameImg = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new window.Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = frameSrc;
    });
    ctx.drawImage(frameImg, 0, 0, width, height);

    return canvas.toDataURL('image/png');
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    // generate composite and store
    try {
      // If the preview flow already generated a final composite, reuse it.
      const existing = localStorage.getItem('hc_final');
      if (existing) {
        // ensure order contains compositeImage
        try {
          const raw = localStorage.getItem('hc_order');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!parsed.compositeImage) {
              parsed.compositeImage = existing;
              localStorage.setItem('hc_order', JSON.stringify(parsed));
            }
          }
        } catch {}
      } else {
        const frameId = order?.frameId || 'frame-1';
        // Use the same frame assets as the frames page
        const frame = frameId === 'frame-2' ? '/pic2.svg' : '/pic1.svg';
  const upload = order?.originalUpload ?? order?.upload ?? null;
  const transform = order?.transform ?? null;
        const composite = await createComposite(frame, upload, transform);
        if (composite) {
          localStorage.setItem('hc_final', composite);
          try {
            const raw = localStorage.getItem('hc_order');
            if (raw) {
              const parsed = JSON.parse(raw);
              parsed.compositeImage = composite;
              localStorage.setItem('hc_order', JSON.stringify(parsed));
            }
          } catch {}
        }
      }
    } catch {
      // ignore
    }

    // navigate to confirmation
    router.push('/orderconfirmation');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header label="Payment" href="/frames" />

      <main className="max-w-md mx-auto px-6 py-6">
        <div className="mb-6 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between">
            <span>Framed Photo</span>
            <span>GHC 20.00</span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <label className="block text-sm">Full Name:</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />

            <label className="block text-sm mt-3">Momo Number:</label>
            <input value={momo} onChange={(e) => setMomo(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />

            <label className="block text-sm mt-3">Network:</label>
            <input value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />

            <label className="block text-sm mt-3">Email:</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />
          </div>

          <div className="flex justify-center">
            <button className="px-6 py-2 bg-[#7C3F33] text-white rounded-full">Confirm Payment</button>
          </div>
        </form>
      </main>
    </div>
  );
}
