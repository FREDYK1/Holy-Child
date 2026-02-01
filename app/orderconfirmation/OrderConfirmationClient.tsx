"use client";

import React, { useMemo, useRef, useEffect, useState } from 'react';
import Header from '../components/Header';
import html2canvas from 'html2canvas';
import { useSearchParams } from 'next/navigation';
import emailjs from '@emailjs/browser';
import Link from 'next/link';

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
	const [isDownloading, setIsDownloading] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);

	// Use state instead of useMemo to avoid hydration mismatch
	// localStorage is only available on the client
	const [orderData, setOrderData] = useState<Record<string, unknown> | null>(null);
	const [customerData, setCustomerData] = useState<Record<string, unknown> | null>(null);

	// Load data from localStorage after hydration
	useEffect(() => {
		try {
			const orderRaw = localStorage.getItem('hc_order');
			const customerRaw = localStorage.getItem('hc_customer');
			setOrderData(orderRaw ? JSON.parse(orderRaw) : null);
			setCustomerData(customerRaw ? JSON.parse(customerRaw) : null);
		} catch {
			setOrderData(null);
			setCustomerData(null);
		}
		setIsHydrated(true);
	}, []);

	const selectedFrame = useMemo(() => {
		if (orderData?.frameId) {
			return FRAMES.find(f => f.id === orderData.frameId as string) || FRAMES[0];
		}
		return FRAMES[0];
	}, [orderData]);

	const originalUpload = useMemo(() => {
		return (orderData?.originalUpload as string) || null;
	}, [orderData]);

	const compositeImage = useMemo(() => {
		return (orderData?.compositeImage as string) || null;
	}, [orderData]);

	const transform = useMemo(() => {
		return (orderData?.transform as { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW?: number; containerH?: number }) || null;
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

			console.log('Sending email to:', customerEmail);
			
			const response = await emailjs.send(
				'service_ry3psxb',
				'template_hqdxev9',
				templateParams
			);

			console.log('EmailJS response:', response);
			setEmailSent(true);
			console.log('Confirmation email sent successfully');
		} catch (error: unknown) {
			// EmailJS failures should not break the order flow; log a warning with as much detail as we can
			const emailError = error as { text?: string; status?: number; message?: string };
			console.warn('EmailJS: failed to send confirmation email', {
				text: emailError?.text,
				status: emailError?.status,
				message: emailError?.message || String(error),
			});
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
						}

						// Send confirmation email
						if (customerData?.email && customerData?.fullName && !emailSent) {
							await sendConfirmationEmail(customerData.email as string, customerData.fullName as string, reference);
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

	const handleDownload = async () => {
		setIsDownloading(true);
		try {
			// Prefer the exact composite PNG generated on the frames page if available
			if (compositeImage) {
				const link = document.createElement('a');
				link.download = 'holy-child-framed-photo.png';
				link.href = compositeImage;
				link.click();
				return;
			}

			// Fallback: capture the DOM region if we don't have a stored composite
			if (!captureRef.current) return;
			const canvas = await html2canvas(captureRef.current, {
				backgroundColor: null,
				scale: 4,
				useCORS: true,
			});
			const link = document.createElement('a');
			link.download = 'holy-child-framed-photo.png';
			link.href = canvas.toDataURL('image/png');
			link.click();
		} catch (error) {
			console.error('Screenshot failed:', error);
			alert('Failed to generate download. Please try again.');
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-white to-[#fef5f2]">
			<Header label="Order Complete" href="/" step={4} totalSteps={4} />

			{!isHydrated ? (
				// Loading state - shows same structure on server and client until hydrated
				<div className="flex-1 flex items-center justify-center">
					<div className="w-8 h-8 border-2 border-[#7C3F33]/30 border-t-[#7C3F33] rounded-full animate-spin" />
				</div>
			) : (
			<>
			{/* Desktop Layout */}
			<div className="hidden lg:flex flex-1 overflow-hidden">
				<div className="max-w-5xl mx-auto px-8 py-8 w-full flex items-center">
					<div className="grid grid-cols-2 gap-14 items-center w-full">
						{/* Left Side - Photo Preview */}
						<div className="flex flex-col items-center">
							<div className="relative bg-white rounded-2xl p-6 shadow-xl">
								{/* Decorative elements */}
								<div className="absolute -top-4 -right-4 w-20 h-20 bg-[#7C3F33]/10 rounded-full blur-2xl" />
								<div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#B86B5F]/10 rounded-full blur-2xl" />
								
								{compositeImage || (originalUpload && transform) ? (
									<div 
										ref={captureRef} 
className={`relative rounded-lg overflow-hidden max-w-full ${selectedFrame.id === 'frame-2' ? 'w-56' : 'w-80'}`}
										style={compositeImage && transform ? undefined : {
											width: `${transform?.containerW ?? 256}px`,
											height: `${transform?.containerH ?? 320}px`,
										}}
									>
										{compositeImage ? (
											/* Exact composite from frames page */
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={compositeImage}
												alt="Framed Photo"
												className="w-full h-auto object-contain"
											/>
										) : (
											<div className="absolute inset-0 flex items-center justify-center" style={{
												backgroundImage: `url(${selectedFrame.src})`,
												backgroundSize: 'cover',
												backgroundPosition: 'center',
											}}>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={originalUpload as string}
													alt="Your Photo"
													style={{
														position: 'absolute',
														left: '50%',
														top: '50%',
														transform: `translate(calc(-50% + ${transform!.offset.x}px), calc(-50% + ${transform!.offset.y}px)) scale(${transform!.scale})`,
														transformOrigin: 'center center',
														width: `${transform!.containerW}px`,
														height: `${transform!.containerH}px`,
														borderRadius: selectedFrame.id === 'frame-1' ? '50%' : undefined,
														objectFit: 'cover',
														...(selectedFrame.id === 'frame-1' && {
															maxWidth: '180px',
															maxHeight: '180px',
															aspectRatio: '1',
														}),
													}}
												/>
											</div>
										)}
									</div>
								) : (
									<div className="w-64 h-80 bg-gray-100 rounded-lg flex items-center justify-center">
										<p className="text-gray-400">Preview not available</p>
									</div>
								)}
							</div>
						</div>

						{/* Right Side - Order Details */}
						<div className="space-y-6">
							{/* Success Icon */}
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
								<svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
								</svg>
							</div>

							<div>
								<h1 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
									Thank You For Your Order!
								</h1>
								<p className="text-gray-500 leading-relaxed">
									Your custom framed photo has been successfully processed and is now ready for download.
								</p>
							</div>
							
							{emailSent && (
								<div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
									<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
										<svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
									</div>
									<div>
										<p className="font-medium text-green-800">Confirmation email sent!</p>
										<p className="text-sm text-green-600">{customerData?.email as string}</p>
									</div>
								</div>
							)}

							{/* Action Buttons */}
							<div className="space-y-3 pt-4">
								{originalUpload && transform ? (
									<>
										<button
											onClick={handleDownload}
											disabled={isDownloading}
											className="w-full py-4 bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white rounded-xl text-lg font-semibold shadow-lg shadow-[#7C3F33]/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
										>
											{isDownloading ? (
												<>
													<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
													Preparing Download...
												</>
											) : (
												<>
													<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
													</svg>
													Download Your Photo
												</>
											)}
										</button>
										<Link
											href="/"
											className="w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
										>
											<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
											</svg>
											Back to Home
										</Link>
									</>
								) : (
									<div className="p-4 bg-red-50 rounded-xl border border-red-100">
										<p className="text-red-600">Unable to load your photo. Please try again from the beginning.</p>
										<Link href="/" className="mt-3 inline-block text-red-700 font-medium underline">
											Start Over
										</Link>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Layout */}
			<main className="lg:hidden flex-1 flex flex-col overflow-hidden">
				<div className="flex-1 overflow-y-auto px-5 py-6 text-center">
					{/* Success Animation */}
					<div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-5 animate-in scale-in">
						<svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>

					<h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
						Order Complete!
					</h2>
					<p className="text-gray-500 mb-6">
						Your framed photo is ready for download
					</p>

					{/* Photo Preview */}
					<div className="relative mx-auto w-fit mb-6">
						<div className="absolute -inset-4 bg-gradient-to-br from-[#7C3F33]/20 to-[#B86B5F]/10 rounded-2xl blur-xl" />
						{compositeImage || (originalUpload && transform) ? (
							<div 
								ref={captureRef} 
								className={`relative rounded-xl overflow-hidden shadow-lg max-w-full ${selectedFrame.id === 'frame-2' ? 'w-56' : 'w-64'}`}
								style={compositeImage && transform ? undefined : {
									width: `${transform?.containerW ?? 192}px`,
									height: `${transform?.containerH ?? 240}px`,
								}}
							>
								{compositeImage ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={compositeImage}
											alt="Framed Photo"
											className="w-full h-auto object-contain"
										/>
									) : (
										<div className="absolute inset-0 flex items-center justify-center" style={{
											backgroundImage: `url(${selectedFrame.src})`,
											backgroundSize: 'cover',
											backgroundPosition: 'center',
										}}>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={originalUpload as string}
												alt="Your Photo"
												style={{
													position: 'absolute',
													left: '50%',
													top: '50%',
													transform: `translate(calc(-50% + ${transform!.offset.x}px), calc(-50% + ${transform!.offset.y}px)) scale(${transform!.scale})`,
													transformOrigin: 'center center',
													width: `${transform!.containerW}px`,
													height: `${transform!.containerH}px`,
													borderRadius: selectedFrame.id === 'frame-1' ? '50%' : undefined,
													objectFit: 'cover',
													...(selectedFrame.id === 'frame-1' && {
														maxWidth: '150px',
														maxHeight: '150px',
														aspectRatio: '1',
													}),
												}}
											/>
										</div>
									)}
							</div>
						) : (
							<div className="relative w-48 h-60 bg-gray-100 rounded-xl flex items-center justify-center">
								<p className="text-gray-400 text-sm">Preview unavailable</p>
							</div>
						)}
					</div>

					{/* Email Confirmation */}
					{emailSent && (
						<div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-xl mb-4 mx-auto max-w-xs">
							<svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
							<p className="text-sm text-green-700">Email sent to {customerData?.email as string}</p>
						</div>
					)}
				</div>

				{/* Fixed Bottom Actions */}
				<div className="shrink-0 px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] space-y-3">
					{originalUpload && transform ? (
						<>
							<button
								onClick={handleDownload}
								disabled={isDownloading}
								className="w-full py-4 bg-gradient-to-r from-[#7C3F33] to-[#6A352B] text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
							>
								{isDownloading ? (
									<>
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Preparing...
									</>
								) : (
									<>
										<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
										</svg>
										Download Photo
									</>
								)}
							</button>
							<Link
								href="/"
								className="w-full py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
							>
								Back to Home
							</Link>
						</>
					) : (
						<Link
							href="/"
							className="w-full py-4 bg-[#7C3F33] text-white rounded-xl font-semibold flex items-center justify-center"
						>
							Start Over
						</Link>
					)}
				</div>
			</main>
			</>
			)}
		</div>
	);
}