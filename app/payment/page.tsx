"use client";

import React, { useState } from 'react';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const [fullName, setFullName] = useState('');
  const [momo, setMomo] = useState('');
  const [network, setNetwork] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    // In a real app validate and process payment here.
    router.push('/orderconfirmation');
  }

  return (
    <div className="min-h-screen bg-white">
      <Header label="Payment" href="/frames" />

      <main className="max-w-md mx-auto px-6 py-6">
        <div className="mb-6 bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between">
            <span>Framed Photo</span>
            <span>GHC 20.00</span>
          </div>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <label className="block text-sm">Full Name:</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />

            <label className="block text-sm mt-3">Momo Number:</label>
            <input value={momo} onChange={(e) => setMomo(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />

            <label className="block text-sm mt-3">Network:</label>
            <input value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />

            <label className="block text-sm mt-3">Email:</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />
          </div>

          <div className="flex justify-center">
            <button className="px-6 py-2 bg-[#7C3F33] text-white rounded-full">Confirm Payment</button>
          </div>
        </form>
      </main>
    </div>
  );
}
