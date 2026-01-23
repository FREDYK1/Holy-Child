"use client";

import React, { useMemo, useRef, useEffect, useState } from 'react';
import Header from '../components/Header';
import html2canvas from 'html2canvas';
import { useSearchParams } from 'next/navigation';
import emailjs from '@emailjs/browser';

const FRAMES = [
    { id: 'frame-1', title: 'Classic', src: '/pic1.svg' },
    { id: 'frame-2', title: 'Anniversary', src: '/pic2.svg' },
];

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

export default function OrderConfirmationPage() {
	const captureRef = useRef<HTMLDivElement>(null);
	const [emailSent, setEmailSent] = useState(false);

	const orderData = useMemo(() => {
		try {
			const data = localStorage.getItem('hc_order');
			return data ? JSON.parse(data) : null;
		} catch {
			return null;
		}
	}, []);

	const customerData = useMemo(() => {
		try {
			const data = localStorage.getItem('hc_customer');
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

	const searchParams = useSearchParams();
	const reference = searchParams.get('reference');

	const sendConfirmationEmail = async (customerEmail: string, customerName: string, orderReference: string) => {
		try {
			// Initialize EmailJS
			emailjs.init('bkSCUAjvx_wObUDy2');

			const templateParams = {
				to_email: customerEmail,
				to_name: customerName,
				order_reference: orderReference,
				frame_type: selectedFrame.title,
				order_total: 'GHC 20.00',
				message: 'Thank you for your order! Your custom framed photo has been processed successfully.'
			};

			await emailjs.send(
				'service_ry3psxb',
				'template_hqdxev9',
				templateParams
			);

			setEmailSent(true);
			console.log('Confirmation email sent successfully');
		} catch (error) {
			console.error('Failed to send confirmation email:', error);
		}
	};

	useEffect(() => {
		if (reference && orderData) {
			fetch('/api/paystack/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reference }),
			}).then(res => res.json()).then(async (data) => {
				if (data.success) {
					// generate composite
					try {
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
							const frameId = orderData?.frameId || 'frame-1';
							const frame = frameId === 'frame-2' ? '/pic2.svg' : '/pic1.svg';
							const upload = orderData?.originalUpload ?? orderData?.upload ?? null;
							const transform = orderData?.transform ?? null;
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

						// Send confirmation email
						if (customerData?.email && customerData?.fullName && !emailSent) {
							await sendConfirmationEmail(customerData.email, customerData.fullName, reference);
						}
					} catch (error) {
						console.error('Error generating composite:', error);
					}
				} else {
					alert('Payment verification failed. Please try again.');
					// redirect to payment
					window.location.href = '/payment';
				}
			}).catch(error => {
				console.error('Verification error:', error);
				alert('Error verifying payment.');
			});
		}
	}, [reference, orderData, customerData, emailSent, selectedFrame.title]);

	return (
		<div className="h-full flex flex-col overflow-hidden bg-white">
			<Header label="Order Confirmation" href="/" />

			{/* Desktop Layout */}
			<div className="hidden lg:flex flex-1 overflow-hidden">
				<div className="max-w-5xl mx-auto px-8 py-6 w-full flex items-center">
					<div className="grid grid-cols-2 gap-14 items-center w-full">
						{/* Left Side - Photo Preview */}
						<div className="flex flex-col items-center">
							<div className="w-full max-w-md h-72 bg-gray-50 flex items-center justify-center mb-6 rounded-lg">
								{originalUpload && transform ? (
									<div ref={captureRef} className="w-56 h-68 relative" style={{ backgroundImage: `url(${selectedFrame.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
						</div>

						{/* Right Side - Order Details */}
						<div className="text-center lg:text-left">
							<h1 className="text-3xl font-bold text-gray-900 mb-5">Thank You For Your Order!</h1>
							<p className="text-base text-gray-600 mb-5 leading-relaxed">
								Your custom framed photo has been successfully processed and is now ready for download.
							</p>
							
							{emailSent && (
								<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-5">
									<p className="text-green-700 font-medium">
										✓ Order confirmation email sent to {customerData?.email}
									</p>
								</div>
							)}

							<div className="space-y-4">
								{originalUpload && transform ? (
									<>
										<button
											onClick={async () => {
												if (!captureRef.current) return;
												try {
													const canvas = await html2canvas(captureRef.current, {
														backgroundColor: null,
														scale: 4,
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
											className="w-full lg:w-auto px-7 py-3 bg-[#7C3F33] text-white rounded-lg text-lg font-semibold hover:bg-[#6A352B] transition-colors"
										>
											Download Your Photo
										</button>
										<p className="text-sm text-gray-500">
											Click the button above to save your framed photo
										</p>
									</>
								) : (
									<div className="text-red-500 text-lg">
										Unable to load your photo. Please try again from the previous step.
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Layout */}
			<main className="lg:hidden flex-1 flex flex-col overflow-hidden px-5 py-4 text-center">
				<div className="w-full h-60 bg-gray-50 flex items-center justify-center mb-5 flex-shrink-0">
					{originalUpload && transform ? (
						<div ref={captureRef} className="w-48 h-56 relative" style={{ backgroundImage: `url(${selectedFrame.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
											maxWidth: '150px',
											maxHeight: '150px',
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
				<p className="mt-2 text-sm text-gray-600">
					Your custom framed photo has been successfully processed and is now ready for download.
				</p>
				{emailSent && (
					<p className="mt-2 text-sm text-green-600">
						✓ Order confirmation email sent to {customerData?.email}
					</p>
				)}

				<div className="mt-5 space-y-4 flex-shrink-0">
					{originalUpload && transform ? (
						<>
							<button
								onClick={async () => {
									if (!captureRef.current) return;
									try {
										const canvas = await html2canvas(captureRef.current, {
											backgroundColor: null,
											scale: 4,
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
								Click the button above to save your framed photo
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