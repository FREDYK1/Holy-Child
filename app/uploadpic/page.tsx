"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Image from 'next/image';

const STORAGE_KEY = 'hc_upload';

export default function UploadPhotoPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // persist as data URL so other pages can access it
  try { localStorage.setItem(STORAGE_KEY, result); } catch { /* ignore */ }
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleAreaClick() {
    inputRef.current?.click();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header component */}
      <Header label="Upload Photo" href="/" />

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Instructions */}
        <div className="flex-1 flex items-center justify-center bg-white px-12">
          <div className="max-w-lg">
            <h2 className="text-4xl font-semibold text-gray-900 mb-6">Prepare Your Photo</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Upload a clear, high-resolution portrait photo of yourself. Make sure your face is well-lit and centered for the best framing results. Only JPEG or PNG formats are supported.
            </p>
            
            <div className="mt-8">
              <Link href="/frames" className="bg-[#7C3F33] text-white px-12 py-4 rounded-full text-lg font-medium shadow-sm inline-block hover:bg-[#6A352B] transition-colors">
                Select Frame
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Upload Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-50 px-12">
          <div className="w-full max-w-md">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden
            />

            <div
              role="button"
              tabIndex={0}
              onClick={handleAreaClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAreaClick(); }}
              className="relative w-full bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden aspect-3/4 flex items-center justify-center cursor-pointer hover:border-[#7A3B33] transition-colors"
              aria-label="Upload portrait photo"
            >
              {preview ? (
                // preview image
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Uploaded portrait preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              <div className="relative z-10 flex flex-col items-center text-center text-[#7A3B33]">
                <div className="bg-[#7A3B33] rounded-full p-6 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5a3 3 0 100 6 3 3 0 000-6z" opacity="0.9" />
                    <path d="M19 7h-1.2l-.8-1.6A2 2 0 0014.4 4H9.6a2 2 0 00-1.6.4L7.2 7H6a2 2 0 00-2 2v8a2 2 0 002 2h13a2 2 0 002-2V9a2 2 0 00-2-2zM12 17a5 5 0 110-10 5 5 0 010 10z" />
                  </svg>
                </div>
                <div className="text-xl font-medium">Tap to Upload Portrait Photo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <main className="lg:hidden max-w-md mx-auto px-6 py-6">
        <h2 className="text-2xl font-semibold">Prepare Your Photo</h2>
        <p className="mt-3 text-sm text-gray-600">
          Upload a clear, high-resolution portrait photo of yourself. Make sure your face is well-lit and centered for the best framing results. Only JPEG or PNG formats are supported.
        </p>

        <div className="mt-6">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden
          />

          <div
            role="button"
            tabIndex={0}
            onClick={handleAreaClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAreaClick(); }}
            className="relative w-full bg-gray-100 border border-gray-200 rounded-sm overflow-hidden aspect-3/4 flex items-center justify-center cursor-pointer"
            aria-label="Upload portrait photo"
          >
            {preview ? (
              // preview image
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Uploaded portrait preview" className="absolute inset-0 w-full h-full object-cover opacity-95" />
            ) : null}

            <div className="relative z-10 flex flex-col items-center text-center text-[#7A3B33]">
              <div className="bg-white/70 rounded-full p-4 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#7A3B33]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5a3 3 0 100 6 3 3 0 000-6z" opacity="0.9" />
                  <path d="M19 7h-1.2l-.8-1.6A2 2 0 0014.4 4H9.6a2 2 0 00-1.6.4L7.2 7H6a2 2 0 00-2 2v8a2 2 0 002 2h13a2 2 0 002-2V9a2 2 0 00-2-2zM12 17a5 5 0 110-10 5 5 0 010 10z" />
                </svg>
              </div>
              <div className="text-base font-medium">Tap to Upload Portrait Photo</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/frames" className="bg-[#7C3F33] text-white px-10 py-3 rounded-full text-lg font-medium shadow-sm inline-block">
            Select Frame
          </Link>
        </div>
      </main>
    </div>
  );
}