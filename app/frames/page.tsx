"use client";

import React, { useState } from 'react';
import Header from '../components/Header';
import Image from 'next/image';
import Link from 'next/link';

const FRAMES = [
    { id: 'frame-1', title: 'Classic', src: '/poster.svg' },
    { id: 'frame-2', title: 'Anniversary', src: '/Selection (3) 1.svg' },
];

export default function FramesPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const current = FRAMES.find((f) => f.id === selected) || FRAMES[0];

    return (
        <div className="min-h-screen bg-white">
            <Header label="Select Frame" href="/uploadpic" />

            <main className="max-w-md mx-auto px-6 py-6">
                <div className="flex flex-col items-center">
                    <div className="w-full">
                        {FRAMES.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setSelected(f.id)}
                                className={`w-full mb-6 flex items-center justify-center p-4 bg-white border ${selected === f.id ? 'border-[#7C3F33]' : 'border-gray-200'} rounded-sm shadow-sm`}
                            >
                                <div className="w-48 h-56 relative">
                                    <Image src={f.src} alt={f.title} fill style={{ objectFit: 'cover' }} />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 w-full flex justify-center">
                        <button
                            onClick={() => setShowPreview(true)}
                            disabled={!selected}
                            className={`px-8 py-2 rounded-full text-white ${selected ? 'bg-[#7C3F33]' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                            Preview
                        </button>
                    </div>
                </div>
            </main>

            {showPreview && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
                        <h3 className="text-center text-xl font-semibold mb-4">Preview</h3>
                        <div className="w-full h-80 bg-gray-50 flex items-center justify-center mb-4">
                            <div className="w-56 h-72 relative">
                                <Image src={current.src} alt={current.title} fill style={{ objectFit: 'cover' }} />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <Link href="/payment" className="px-6 py-2 bg-[#7C3F33] text-white rounded-full">Make Payment</Link>
                            <button onClick={() => setShowPreview(false)} className="px-4 py-2 border rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
