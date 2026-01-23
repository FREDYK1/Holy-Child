"use client";

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Image from 'next/image';

const STORAGE_KEY = 'hc_upload';

export default function UploadPhotoPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  function processFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      try { localStorage.setItem(STORAGE_KEY, result); } catch { /* ignore */ }
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleAreaClick() {
    inputRef.current?.click();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-white to-[#fef5f2]">
      <Header label="Upload Photo" href="/" step={1} totalSteps={4} />

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Side - Upload Area */}
        <div className="flex-1 flex items-center justify-center px-12 py-8">
          <div className="w-full max-w-lg">
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative w-full bg-white border-2 border-dashed rounded-2xl overflow-hidden aspect-[3/4] flex items-center justify-center cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-xl ${
                isDragging 
                  ? 'border-[#7C3F33] bg-[#7C3F33]/5 scale-[1.02]' 
                  : preview 
                    ? 'border-[#7C3F33]/30' 
                    : 'border-gray-200 hover:border-[#7C3F33]/50'
              }`}
              aria-label="Upload portrait photo"
            >
              {preview ? (
                <>
                  {/* Preview image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Uploaded portrait preview" className="absolute inset-0 w-full h-full object-cover" />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="font-medium">Change Photo</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative z-10 flex flex-col items-center text-center p-8">
                  {/* Upload Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-[#7C3F33] to-[#6A352B] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Drop your photo here</h3>
                  <p className="text-gray-500 mb-4">or click to browse</p>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Supports JPG, PNG</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Instructions */}
        <div className="w-[420px] bg-white border-l border-gray-100 flex flex-col justify-center px-10 py-8">
          <div className="space-y-8">
            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                Prepare Your Photo
              </h2>
              <p className="text-gray-500 leading-relaxed">
                Upload a clear, high-resolution portrait photo for the best framing results.
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Photo Tips</h3>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#7C3F33]/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Good Lighting</h4>
                  <p className="text-sm text-gray-500">Natural light works best</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#7C3F33]/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Face Centered</h4>
                  <p className="text-sm text-gray-500">Keep your face in the middle</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#7C3F33]/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">High Quality</h4>
                  <p className="text-sm text-gray-500">Use the highest resolution available</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link 
                href="/frames" 
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  preview 
                    ? 'bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white shadow-lg shadow-[#7C3F33]/30 hover:shadow-xl hover:-translate-y-0.5' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                onClick={(e) => !preview && e.preventDefault()}
              >
                Continue to Frames
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <main className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Instructions Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Your Photo</h2>
            <p className="text-sm text-gray-500">
              Choose a clear portrait photo with good lighting
            </p>
          </div>

          {/* Upload Area */}
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
            className={`relative w-full aspect-[3/4] bg-white border-2 border-dashed rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200 ${
              preview ? 'border-[#7C3F33]/30' : 'border-gray-200 active:border-[#7C3F33] active:bg-[#7C3F33]/5'
            }`}
            aria-label="Upload portrait photo"
          >
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Uploaded portrait preview" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Change photo overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent py-4 px-4">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Tap to change photo</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#7C3F33] to-[#6A352B] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Tap to Upload</h3>
                <p className="text-sm text-gray-400">JPG or PNG format</p>
              </div>
            )}
          </div>

          {/* Quick Tips */}
          {!preview && (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 shrink-0">
                <span className="text-[#7C3F33]">💡</span>
                <span className="text-xs text-gray-600">Good lighting</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 shrink-0">
                <span className="text-[#7C3F33]">🎯</span>
                <span className="text-xs text-gray-600">Face centered</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 shrink-0">
                <span className="text-[#7C3F33]">📸</span>
                <span className="text-xs text-gray-600">High quality</span>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Action */}
        <div className="shrink-0 px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <Link 
            href="/frames" 
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold transition-all duration-200 ${
              preview 
                ? 'bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white shadow-lg active:scale-[0.98]' 
                : 'bg-gray-100 text-gray-400'
            }`}
            onClick={(e) => !preview && e.preventDefault()}
          >
            {preview ? (
              <>
                Continue to Frames
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              'Upload a photo to continue'
            )}
          </Link>
        </div>
      </main>
    </div>
  );
}