"use client";

import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import Header from '../components/Header';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const FRAMES = [
    { id: 'frame-1', title: 'Classic', src: '/pic1.svg' },
    { id: 'frame-2', title: 'Anniversary', src: '/pic2.svg' },
];

const InteractiveImage = forwardRef(function InteractiveImage(
    { src, width, height, isCircular, preserveAspectRatio, onChange, externalScale, onScaleChange }: {
        src: string;
        width: number;
        height: number;
        isCircular?: boolean;
        preserveAspectRatio?: boolean;
        onChange?: (s: { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number }) => void;
        externalScale?: number;
        onScaleChange?: (scale: number) => void;
    },
    ref
) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(externalScale || 1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const lastPointer = useRef<{ x: number; y: number } | null>(null);
    const lastDist = useRef<number | null>(null);
    const lastScaleRef = useRef<number>(1);
    const lastOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const lastMidpoint = useRef<{ x: number; y: number } | null>(null);
    const [displayed, setDisplayed] = useState({ displayedW: 0, displayedH: 0, baseScale: 1 });

    const onImgLoad = () => {
        const img = imgRef.current;
        if (!img) return;
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;
        const baseScale = Math.max(width / naturalW, height / naturalH);
        const displayedW = naturalW * baseScale;
        const displayedH = naturalH * baseScale;
        setDisplayed({ displayedW, displayedH, baseScale });
        if (onChange) onChange({ scale, offset, displayedW, displayedH, baseScale });
    };

    const getState = useCallback(
        () => ({
            scale,
            offset,
            displayedW: displayed.displayedW,
            displayedH: displayed.displayedH,
            baseScale: displayed.baseScale,
            containerW: width,
            containerH: height,
        }),
        [scale, offset, displayed, width, height]
    );

    function handlePointerDown(e: React.PointerEvent) {
        (e.target as Element).setPointerCapture(e.pointerId);
        lastPointer.current = { x: e.clientX, y: e.clientY };
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (!lastPointer.current) return;
        const dx = e.clientX - lastPointer.current.x;
        const dy = e.clientY - lastPointer.current.y;
        lastPointer.current = { x: e.clientX, y: e.clientY };
        setOffset((o) => {
            const next = { x: o.x + dx, y: o.y + dy };
            if (onChange) onChange({ scale, offset: next, displayedW: displayed.displayedW, displayedH: displayed.displayedH, baseScale: displayed.baseScale });
            return next;
        });
    }

    function handlePointerUp(e: React.PointerEvent) {
        try {
            (e.target as Element).releasePointerCapture(e.pointerId);
        } catch {}
        lastPointer.current = null;
    }

    function handleTouchStart(e: React.TouchEvent) {
        if (e.touches.length === 2) {
            const t0 = e.touches[0];
            const t1 = e.touches[1];
            const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
            lastDist.current = d;
            // store midpoint and snapshot of scale/offset so we can compute centered zoom
            lastMidpoint.current = { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
            lastScaleRef.current = scale;
            lastOffsetRef.current = { ...offset };
        }
    }

    function handleTouchMove(e: React.TouchEvent) {
        if (e.touches.length === 2 && lastDist.current && lastMidpoint.current) {
            const t0 = e.touches[0];
            const t1 = e.touches[1];
            const d = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
            const factor = d / lastDist.current;

            // compute midpoint and convert to container-relative coordinates (relative to center)
            const mid = { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
            const container = containerRef.current?.getBoundingClientRect();
            if (!container) return;
            const center = { x: container.left + container.width / 2, y: container.top + container.height / 2 };
            const pRel = { x: mid.x - center.x, y: mid.y - center.y };

            const newScale = Math.max(0.2, Math.min(6, lastScaleRef.current * factor));

            // offset adjustment so the point under the midpoint stays fixed while scaling
            const deltaFactor = 1 - newScale / lastScaleRef.current;
            const newOffset = {
                x: lastOffsetRef.current.x + deltaFactor * pRel.x,
                y: lastOffsetRef.current.y + deltaFactor * pRel.y,
            };

            setScale(newScale);
            setOffset(newOffset);
            if (onScaleChange) onScaleChange(newScale);
            if (onChange) onChange({ scale: newScale, offset: newOffset, displayedW: displayed.displayedW, displayedH: displayed.displayedH, baseScale: displayed.baseScale });
        }
    }

    function handleTouchEnd(e: React.TouchEvent) {
        if (e.touches.length < 2) {
            lastDist.current = null;
            lastMidpoint.current = null;
            lastScaleRef.current = scale;
            lastOffsetRef.current = { ...offset };
        }
    }

    function handleWheel(e: React.WheelEvent) {
        e.preventDefault();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.max(0.2, Math.min(6, scale + delta));
        setScale(newScale);
        if (onScaleChange) onScaleChange(newScale);
    }

    // Update scale when external scale changes
    React.useEffect(() => {
        if (externalScale !== undefined && externalScale !== scale) {
            setScale(externalScale);
        }
    }, [externalScale]);

    useImperativeHandle(ref, () => ({ getState }));

    return (
        <div
            ref={containerRef}
            style={{ width, height }}
            className="relative overflow-hidden touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                ref={imgRef}
                src={src}
                alt="uploaded"
                onLoad={onImgLoad}
                draggable={false}
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                    transformOrigin: 'center center',
                    touchAction: 'none',
                    userSelect: 'none',
                    // For non-circular containers, force the image element to match the interactive container
                    // so the visible area is a rectangle of the requested width/height (preserves vertical rectangle for frame-2)
                    width: isCircular ? '180px' : `${width}px`,
                    height: isCircular ? '180px' : `${height}px`,
                    borderRadius: isCircular ? '50%' : undefined,
                    objectFit: isCircular ? 'cover' : preserveAspectRatio ? 'contain' : 'cover',
                    ...(isCircular && {
                        maxWidth: '180px',
                        maxHeight: '180px',
                        aspectRatio: '1',
                    })
                }}
            />
        </div>
    );
});

type InteractiveHandle = {
    getState: () => { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW: number; containerH: number };
};

export default function FramesPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [imageScale, setImageScale] = useState(1);
    const interactiveRef = useRef<InteractiveHandle | null>(null);
    const uploadData = useMemo(() => {
        try {
            return localStorage.getItem('hc_upload');
        } catch {
            return null;
        }
    }, []);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const current = FRAMES.find((f) => f.id === selected) || FRAMES[0];

    async function createComposite(
        frameSrc: string,
        uploadDataUrl?: string | null,
        transform?: { scale: number; offset: { x: number; y: number }; displayedW: number; displayedH: number; baseScale: number; containerW: number; containerH: number }
    ) {
        if (!uploadDataUrl) return null;

        // canvas size — further reduced for Vercel compatibility
        const width = 600;
        const height = 750;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // load frame image using fetch for better compatibility
        const frameResponse = await fetch(frameSrc);
        if (!frameResponse.ok) {
            throw new Error(`Failed to fetch frame: ${frameResponse.status}`);
        }
        const frameBlob = await frameResponse.blob();
        const frameImg = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new window.Image();
            i.onload = () => res(i);
            i.onerror = (e) => {
                console.error('Frame image load error:', e);
                rej(e);
            };
            i.src = URL.createObjectURL(frameBlob);
        });

        const userImg = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new window.Image();
            i.onload = () => res(i);
            i.onerror = (e) => {
                console.error('User image load error:', e);
                rej(e);
            };
            i.src = uploadDataUrl;
        });

        // draw the frame first as the background layer
        ctx.drawImage(frameImg, 0, 0, width, height);

        // draw the uploaded image on top of the frame
        if (transform && transform.containerW && transform.containerH) {
            // use interactive transform to position/scale the photo
            const { scale, offset, displayedW, displayedH, containerW, containerH } = transform;
            const canvasScaleX = width / containerW;
            const canvasScaleY = height / containerH;
            const dw = displayedW * scale * canvasScaleX;
            const dh = displayedH * scale * canvasScaleY;
            const centerX = width / 2 + offset.x * canvasScaleX;
            const centerY = height / 2 + offset.y * canvasScaleY;
            const ix = centerX - dw / 2;
            const iy = centerY - dh / 2;

            if (current.id === 'frame-1') {
                // Apply circular clipping for frame-1 using the user's adjusted position
                ctx.save();
                ctx.beginPath();
                const circleX = width / 2;
                const circleY = height / 2;
                const circleRadius = Math.min(width, height) * 0.25;
                ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(userImg, ix, iy, dw, dh);
                ctx.restore();
            } else {
                // For frame-2 and others, use the user's adjusted position
                ctx.drawImage(userImg, ix, iy, dw, dh);
            }
        } else {
            // default: fill the canvas with the photo (cover sizing)
            const ratio = Math.max(width / userImg.naturalWidth, height / userImg.naturalHeight);
            const iw = userImg.naturalWidth * ratio;
            const ih = userImg.naturalHeight * ratio;
            const ix = (width - iw) / 2;
            const iy = (height - ih) / 2;
            ctx.drawImage(userImg, ix, iy, iw, ih);
        }

        return canvas.toDataURL('image/png');
    }

    return (
        <div className="min-h-screen bg-white">
            <Header label="Select Frame" href="/uploadpic" />

            {/* Desktop Layout */}
            <div className="hidden lg:block min-h-[calc(100vh-80px)]">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="grid grid-cols-2 gap-12 items-center">
                        {/* Left Side - Frame Selection */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                {FRAMES.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelected(f.id)}
                                        className={`p-6 bg-white border-2 ${selected === f.id ? 'border-[#7C3F33] shadow-lg' : 'border-gray-200'} rounded-lg hover:border-[#7C3F33] transition-all`}
                                    >
                                        <div className="w-full h-64 relative">
                                            <Image src={f.src} alt={f.title} fill style={{ objectFit: 'contain' }} />
                                        </div>
                                        <p className="mt-4 text-lg font-medium text-gray-900">{f.title}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Preview Area */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-12 min-h-[600px]">
                            {showPreview ? (
                                <div className="w-full max-w-md">
                                    <h3 className="text-center text-2xl font-semibold mb-8">Preview</h3>
                                    <div className="w-full h-96 bg-white flex items-center justify-center mb-6 rounded-lg shadow-sm">
                                        <div className="w-64 h-80 relative flex items-center justify-center">
                                            {isGenerating ? (
                                                <div className="text-lg text-gray-500">Generating preview...</div>
                                            ) : uploadData ? (
                                                <>
                                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                                        <Image src={current.src} alt={current.title} fill style={{ objectFit: 'cover' }} />
                                                    </div>

                                                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                        <InteractiveImage
                                                            ref={interactiveRef}
                                                            src={uploadData}
                                                            width={current.id === 'frame-1' ? 200 : 200}
                                                            height={current.id === 'frame-1' ? 200 : 250}
                                                            isCircular={current.id === 'frame-1'}
                                                            preserveAspectRatio={false}
                                                            externalScale={imageScale}
                                                            onScaleChange={setImageScale}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-lg text-gray-500">No preview available</div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Scale Slider */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                            Adjust Photo Size
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500">Small</span>
                                            <input
                                                type="range"
                                                min="0.2"
                                                max="6"
                                                step="0.1"
                                                value={imageScale}
                                                onChange={(e) => setImageScale(parseFloat(e.target.value))}
                                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                                style={{
                                                    background: `linear-gradient(to right, #7C3F33 0%, #7C3F33 ${((imageScale - 0.2) / (6 - 0.2)) * 100}%, #e5e7eb ${((imageScale - 0.2) / (6 - 0.2)) * 100}%, #e5e7eb 100%)`
                                                }}
                                            />
                                            <span className="text-xs text-gray-500">Large</span>
                                        </div>
                                        <div className="text-center mt-1">
                                            <span className="text-xs text-gray-600">{Math.round(imageScale * 100)}%</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (!interactiveRef.current?.getState) {
                                                        alert('Unable to process image. Please try again.');
                                                        return;
                                                    }

                                                    setIsGenerating(true);
                                                    const state = interactiveRef.current.getState();
                                                    const finalComposite = await createComposite(current.src, uploadData, state);
                                                    
                                                    if (!finalComposite) {
                                                        alert('Failed to generate final image. Please try again.');
                                                        setIsGenerating(false);
                                                        return;
                                                    }

                                                    localStorage.setItem('hc_final', finalComposite);
                                                    
                                                    const orderDetails = {
                                                        frameId: selected || current.id,
                                                        compositeImage: finalComposite,
                                                        originalUpload: uploadData,
                                                        transform: state,
                                                        timestamp: Date.now(),
                                                        isProcessed: true
                                                    };
                                                    
                                                    localStorage.setItem('hc_order', JSON.stringify(orderDetails));
                                                    setIsGenerating(false);
                                                    router.push('/payment');

                                                } catch (err) {
                                                    console.error('Error creating final image:', err);
                                                    setIsGenerating(false);
                                                    alert('An error occurred. Please try again. Error: ' + (err as Error).message);
                                                }
                                            }}
                                            className="px-8 py-3 bg-[#7C3F33] text-white rounded-full text-lg font-medium hover:bg-[#6A352B] transition-colors"
                                        >
                                            Make Payment
                                        </button>
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="px-6 py-3 border border-gray-300 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="text-6xl text-gray-300 mb-4">📷</div>
                                    <h3 className="text-2xl font-semibold text-gray-600 mb-2">Preview Your Frame</h3>
                                    <p className="text-gray-500 mb-8">Select a frame and click preview to see how your photo will look</p>
                                    <button
                                        onClick={async () => {
                                            if (!selected || !uploadData) return;
                                            setPreviewSrc(null);
                                            setIsGenerating(true);
                                            setShowPreview(true);
                                            try {
                                                const src = await createComposite(current.src, uploadData);
                                                if (src) setPreviewSrc(src);
                                            } catch (err) {
                                                console.error('createComposite failed', err);
                                            } finally {
                                                setIsGenerating(false);
                                            }
                                        }}
                                        disabled={!selected || !uploadData}
                                        className={`px-12 py-4 rounded-full text-lg font-medium ${selected && uploadData ? 'bg-[#7C3F33] text-white hover:bg-[#6A352B]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} transition-colors`}
                                    >
                                        Preview
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <main className="lg:hidden max-w-md mx-auto px-6 py-6">
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
                            onClick={async () => {
                                if (!selected || !uploadData) return;
                                setPreviewSrc(null);
                                setIsGenerating(true);
                                setShowPreview(true);
                                try {
                                    const src = await createComposite(current.src, uploadData);
                                    if (src) setPreviewSrc(src);
                                } catch (err) {
                                    console.error('createComposite failed', err);
                                } finally {
                                    setIsGenerating(false);
                                }
                            }}
                            disabled={!selected || !uploadData}
                            className={`px-8 py-2 rounded-full text-white ${selected && uploadData ? 'bg-[#7C3F33]' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                            Preview
                        </button>
                    </div>
                </div>
            </main>

            {/* Mobile Preview Modal */}
            {showPreview && (
                <div className="lg:hidden fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
                        <h3 className="text-center text-xl font-semibold mb-4">Preview</h3>
                        <div className="w-full h-80 bg-gray-50 flex items-center justify-center mb-4">
                            <div className="w-56 h-72 relative flex items-center justify-center">
                                {isGenerating ? (
                                    <div className="text-sm text-gray-500">Generating preview...</div>
                                ) : uploadData ? (
                                    <>
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <Image src={current.src} alt={current.title} fill style={{ objectFit: 'cover' }} />
                                        </div>

                                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                                            <InteractiveImage
                                                ref={interactiveRef}
                                                src={uploadData}
                                                width={current.id === 'frame-1' ? 200 : 200}
                                                height={current.id === 'frame-1' ? 200 : 250}
                                                isCircular={current.id === 'frame-1'}
                                                preserveAspectRatio={false}
                                                externalScale={imageScale}
                                                onScaleChange={setImageScale}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-sm text-gray-500">No preview available</div>
                                )}
                            </div>
                        </div>
                        
                        {/* Scale Slider */}
                        <div className="mb-4 px-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Adjust Photo Size
                            </label>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">Small</span>
                                <input
                                    type="range"
                                    min="0.2"
                                    max="6"
                                    step="0.1"
                                    value={imageScale}
                                    onChange={(e) => setImageScale(parseFloat(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                        background: `linear-gradient(to right, #7C3F33 0%, #7C3F33 ${((imageScale - 0.2) / (6 - 0.2)) * 100}%, #e5e7eb ${((imageScale - 0.2) / (6 - 0.2)) * 100}%, #e5e7eb 100%)`
                                    }}
                                />
                                <span className="text-xs text-gray-500">Large</span>
                            </div>
                            <div className="text-center mt-1">
                                <span className="text-xs text-gray-600">{Math.round(imageScale * 100)}%</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={async () => {
                                    try {
                                        if (!interactiveRef.current?.getState) {
                                            alert('Unable to process image. Please try again.');
                                            return;
                                        }

                                        setIsGenerating(true);
                                        const state = interactiveRef.current.getState();
                                        const finalComposite = await createComposite(current.src, uploadData, state);
                                        
                                        if (!finalComposite) {
                                            alert('Failed to generate final image. Please try again.');
                                            setIsGenerating(false);
                                            return;
                                        }

                                        localStorage.setItem('hc_final', finalComposite);
                                        
                                        const orderDetails = {
                                            frameId: selected || current.id,
                                            compositeImage: finalComposite,
                                            originalUpload: uploadData,
                                            transform: state,
                                            timestamp: Date.now(),
                                            isProcessed: true
                                        };
                                        
                                        localStorage.setItem('hc_order', JSON.stringify(orderDetails));
                                        setIsGenerating(false);
                                        router.push('/payment');

                                    } catch (err) {
                                        console.error('Error creating final image:', err);
                                        setIsGenerating(false);
                                        alert('An error occurred. Please try again. Error: ' + (err as Error).message);
                                    }
                                }}
                                className="px-6 py-2 bg-[#7C3F33] text-white rounded-full"
                            >
                                Make Payment
                            </button>
                            <button onClick={() => setShowPreview(false)} className="px-4 py-2 border rounded">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
