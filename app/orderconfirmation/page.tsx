import React from 'react';
import Header from '../components/Header';
import Image from 'next/image';

export default function OrderConfirmationPage() {
	return (
		<div className="min-h-screen bg-white">
			<Header label="Order Confirmation" href="/" />

			<main className="max-w-md mx-auto px-6 py-6 text-center">
				<div className="mx-auto w-48 h-64 relative mb-6">
					<Image src="/poster.svg" alt="Framed" fill style={{ objectFit: 'cover' }} />
				</div>

				<h2 className="text-xl font-semibold">Thank You For Your Order!</h2>
				<p className="mt-3 text-sm text-gray-600">Your custom framed photo has been successfully processed and is now ready for download.</p>

				<div className="mt-6">
					<a href="/poster.svg" download className="px-6 py-2 bg-[#7C3F33] text-white rounded-full inline-block">Download Your Photo</a>
				</div>
			</main>
		</div>
	);
}
