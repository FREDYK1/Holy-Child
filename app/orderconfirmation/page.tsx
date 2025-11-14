"use client";

import React, { useMemo, useRef } from 'react';
import Header from '../components/Header';
import html2canvas from 'html2canvas';

const FRAMES = [
    { id: 'frame-1', title: 'Classic', src: '/pic1.svg' },
    { id: 'frame-2', title: 'Anniversary', src: '/pic2.svg' },
];

export default function OrderConfirmationPage() {
	const captureRef = useRef<HTMLDivElement>(null);

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
					{originalUpload && transform ? (
						<div ref={captureRef} className="w-56 h-72 relative" style={{ backgroundImage: `url(${selectedFrame.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
							<div className="absolute inset-0 flex items-center justify-center">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={originalUpload}
									alt="Your Photo"
									style={{
										position: 'absolute',
										left: '50%',
										top: '50%',
										transform: `translate(calc(-50% + ${transform.offset.x}px), calc(-50% + ${transform.offset.y}px)) scale(${transform.scale})`,
										transformOrigin: 'center center',
										width: selectedFrame.id === 'frame-2' ? `${transform.containerW ?? transform.displayedW ?? 224}px` : transform.displayedW ? `${transform.displayedW}px` : 'auto',
										height: selectedFrame.id === 'frame-2' ? `${transform.containerH ?? transform.displayedH ?? 288}px` : transform.displayedH ? `${transform.displayedH}px` : 'auto',
										borderRadius: selectedFrame.id === 'frame-1' ? '50%' : undefined,
										objectFit: selectedFrame.id === 'frame-1' || selectedFrame.id === 'frame-2' ? 'cover' : 'contain',
										...(selectedFrame.id === 'frame-1' && {
											maxWidth: '180px',
											maxHeight: '180px',
											aspectRatio: '1',
										})
									}}
								/>
							</div>
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
					{originalUpload && transform ? (
						<>
							<button
								onClick={async () => {
									if (!captureRef.current) return;
									try {
										const canvas = await html2canvas(captureRef.current, {
											backgroundColor: null,
											scale: 4, // Higher resolution
											useCORS: true,
										});
										const link = document.createElement('a');
										link.download = 'framed-photo.png';
										link.href = canvas.toDataURL('image/png');
										link.click();
									} catch (error) {
										console.error('Screenshot failed:', error);
										alert('Failed to generate download. Please try again.');
									}
								}}
								className="px-6 py-2 bg-[#7C3F33] text-white rounded-full hover:bg-[#6A352B] transition-colors"
							>
								Download Your Photo
							</button>
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
