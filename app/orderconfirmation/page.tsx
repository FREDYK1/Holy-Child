"use client";

import React, { useMemo } from 'react';
import Header from '../components/Header';
import Image from 'next/image';

const FRAMES = [
    { id: 'frame-1', title: 'Classic', src: '/pic1.svg' },
    { id: 'frame-2', title: 'Anniversary', src: '/pic2.svg' },
];

export default function OrderConfirmationPage() {
	const orderData = useMemo(() => {
		try {
			const data = localStorage.getItem('hc_order');
			return data ? JSON.parse(data) : null;
		} catch {
			return null;
		}
	}, []);

	const selectedFrame = useMemo(() => {
		if (orderData?.frameId) {
			return FRAMES.find(f => f.id === orderData.frameId) || FRAMES[0];
		}
		return FRAMES[0];
	}, [orderData]);

	const originalUpload = useMemo(() => {
		return orderData?.originalUpload || null;
	}, [orderData]);

	const transform = useMemo(() => {
		return orderData?.transform || null;
	}, [orderData]);

	return (
		<div className="min-h-screen bg-white">
			<Header label="Order Confirmation" href="/" />

			<main className="max-w-md mx-auto px-6 py-6 text-center">
				<div className="w-full h-80 bg-gray-50 flex items-center justify-center mb-6">
					{orderData?.compositeImage ? (
						<div className="w-56 h-72 relative flex items-center justify-center">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={orderData.compositeImage}
								alt="Your Framed Photo"
								className="max-w-full max-h-full object-contain"
							/>
						</div>
					) : (
						<div className="flex items-center justify-center w-full h-full bg-gray-100 rounded">
							<p className="text-gray-500">Preview not available</p>
						</div>
					)}
				</div>

				<h2 className="text-xl font-semibold">Thank You For Your Order!</h2>
				<p className="mt-3 text-sm text-gray-600">
					Your custom framed photo has been successfully processed and is now ready for download.
				</p>

				<div className="mt-6 space-y-4">
					{orderData?.compositeImage ? (
						<>
							<a 
								href={orderData.compositeImage} 
								download="framed-photo.png" 
								className="px-6 py-2 bg-[#7C3F33] text-white rounded-full inline-block hover:bg-[#6A352B] transition-colors"
							>
								Download Your Photo
							</a>
							<p className="text-xs text-gray-500">
								Click the button above to save your framed photo to your device
							</p>
						</>
					) : (
						<div className="text-red-500">
							Unable to load your photo. Please try again from the previous step.
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
