"use client";

import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';

type Transform = { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW?: number; containerH?: number };
type Order = { frameId: string; upload?: string | null; originalUpload?: string | null; transform?: Transform; compositeImage?: string } | null;

export default function PaymentPage() {
  const [fullName, setFullName] = useState('');
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
    if (!fullName) {
      alert('Please enter your full name');
      return;
    }
    if (!email) {
      alert('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Store customer data for email confirmation
    localStorage.setItem('hc_customer', JSON.stringify({
      fullName,
      email
    }));

    try {
      const res = await fetch('/api/paystack/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert('Error initializing payment: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <Header label="Payment" href="/frames" />

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 py-8 w-full flex items-center">
          <div className="grid grid-cols-2 gap-14 items-center w-full">
            {/* Left Side - Order Summary */}
            <div className="bg-gray-50 p-7 rounded-lg">
              <h2 className="text-2xl font-semibold mb-5 text-gray-900">Order Summary</h2>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-700">Framed Photo</span>
                  <span className="font-semibold text-gray-900">GHC 20.00</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xl font-semibold">
                <span>Total</span>
                <span>GHC 20.00</span>
              </div>
            </div>

            {/* Right Side - Payment Form */}
            <div className="bg-white">
              <h2 className="text-2xl font-semibold mb-5 text-gray-900">Customer Information</h2>
              <form onSubmit={handleConfirm} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-[#7C3F33] focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-[#7C3F33] focus:border-transparent"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-[#7C3F33] text-white py-3 rounded-lg text-lg font-semibold hover:bg-[#6A352B] transition-colors"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <main className="lg:hidden flex-1 flex flex-col overflow-hidden px-5 py-4">
        <div className="mb-5 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between border-t pt-2">
            <span>Framed Photo</span>
            <span>GHC 20.00</span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="flex-1 flex flex-col space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <label className="block text-sm">Full Name:</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              placeholder="Enter your full name"
              required
            />

            <label className="block text-sm mt-3">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="flex justify-center flex-shrink-0 mt-auto pb-2">
            <button className="px-8 py-3 bg-[#7C3F33] text-white rounded-full">Confirm Payment</button>
          </div>
        </form>
      </main>
    </div>
  );
}
