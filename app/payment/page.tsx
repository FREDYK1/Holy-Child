"use client";

import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';

type Transform = { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW?: number; containerH?: number };
type Order = { frameId: string; upload?: string | null; originalUpload?: string | null; transform?: Transform; compositeImage?: string } | null;

export default function PaymentPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);

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
        setIsLoading(false);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : String(error)));
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-white to-[#fef5f2]">
      <Header label="Payment" href="/frames" step={3} totalSteps={4} />

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 py-8 w-full flex items-center">
          <div className="grid grid-cols-2 gap-14 items-start w-full">
            {/* Left Side - Order Summary */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>Order Summary</h2>
                <p className="text-gray-500">Review your order details</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                {/* Order Item */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                  <div className="w-16 h-20 bg-gradient-to-br from-[#7C3F33]/10 to-[#7C3F33]/5 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Custom Framed Photo</h3>
                    <p className="text-sm text-gray-500">80th Anniversary Edition</p>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">GHC 20.00</span>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-5">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-[#7C3F33]">GHC 20.00</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Secure Payment</h4>
                  <p className="text-sm text-green-600">Powered by Paystack</p>
                </div>
              </div>
            </div>

            {/* Right Side - Payment Form */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
              
              <form onSubmit={handleConfirm} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
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
                    className="input-field"
                    placeholder="Enter your email address"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-2">We&apos;ll send your order confirmation here</p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white rounded-xl text-lg font-semibold shadow-lg shadow-[#7C3F33]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Payment
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <main className="lg:hidden flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Order Summary Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-12 h-14 bg-gradient-to-br from-[#7C3F33]/10 to-[#7C3F33]/5 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Framed Photo</p>
                <p className="text-xs text-gray-500">80th Anniversary</p>
              </div>
              <span className="font-semibold text-gray-900">GHC 20.00</span>
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-[#7C3F33]">GHC 20.00</span>
            </div>
          </div>

          {/* Customer Form */}
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Your Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-green-700">Secure payment via Paystack</span>
            </div>
          </form>
        </div>

        {/* Fixed Bottom Action */}
        <div className="shrink-0 px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
