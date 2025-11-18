import React, { Suspense } from 'react';
import OrderConfirmationClient from './OrderConfirmationClient';

export const dynamic = 'force-dynamic';

export default function OrderConfirmationPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<OrderConfirmationClient />
		</Suspense>
	);
}
