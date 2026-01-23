"use client";

import React, { useState, useMemo, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import Header from '../components/Header';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const FRAMES = [
    { id: 'frame-1', title: 'Classic', src: '/pic1.svg' },
    { id: 'frame-2', title: 'Anniversary', src: '/pic2.svg' },
];

export type TransformState = {
    scale: number;
    offset: { x: number; y: number };
    displayedW: number;
    displayedH: number;
    baseScale: number;
    containerW: number;
    containerH: number;
};

export type PersistOrderOptions = {
    frameId: string;
    finalComposite: string;
    uploadData: string | null;
    transform: TransformState;
    alertFn?: (message: string) => void;
};

export async function createComposite(
    frameSrc: string,
    uploadDataUrl?: string | null,
    transform?: TransformState,
    options?: { isCircularFrame?: boolean }
) {
    if (!uploadDataUrl) return null;

    const isCircularFrame = options?.isCircularFrame ?? false;

    // canvas size — further reduced for Vercel compatibility and to avoid localStorage quota issues
    const width = 500;
    const height = 625;
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

        if (isCircularFrame) {
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
            // For rectangular frames, use the user's adjusted position
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

    return canvas.toDataURL('image/png', 0.8);
}

export function persistOrderDetails({ frameId, finalComposite, uploadData, transform, alertFn }: PersistOrderOptions): boolean {
    let storedComposite: string | null = null;

    if (finalComposite) {
        // Try to store the composite image; if quota is exceeded, fall back to storing only metadata
        try {
            localStorage.setItem('hc_final', finalComposite);
            storedComposite = finalComposite;
        } catch (storageErr) {
            console.warn('Failed to store hc_final in localStorage (likely quota exceeded). Proceeding without cached final image.', storageErr);
        }
    }

    const orderDetails = {
        frameId,
        compositeImage: storedComposite,
        originalUpload: uploadData,
        transform,
        timestamp: Date.now(),
        isProcessed: true,
    };

    try {
        localStorage.setItem('hc_order', JSON.stringify(orderDetails));
    } catch (orderErr) {
        console.error('Failed to store order details in localStorage:', orderErr);
        if (alertFn) {
            alertFn('Your browser storage is full. Please clear some space (e.g. site data) and try again.');
        }
        return false;
    }

    return true;
}

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
    getState: () => TransformState;
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

        // canvas size — further reduced for Vercel compatibility and to avoid localStorage quota issues
        const width = 500;
        const height = 625;
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

        return canvas.toDataURL('image/png', 0.8);
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-linear-to-b from-gray-50 to-white">
            <Header label="Select Frame" href="/uploadpic" />

            {/* Desktop Layout */}
            <div className="hidden lg:flex flex-1 overflow-hidden">
                <div className="max-w-6xl mx-auto px-8 py-6 w-full">
                    <div className="grid grid-cols-2 gap-10 items-center h-full">
                        {/* Left Side - Frame Selection */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                {FRAMES.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelected(f.id)}
                                        className={`p-5 bg-white border-2 ${selected === f.id ? 'border-[#7C3F33] shadow-lg' : 'border-gray-200'} rounded-lg hover:border-[#7C3F33] transition-all`}
                                    >
                                        <div className="w-full h-48 relative">
                                            <Image src={f.src} alt={f.title} fill style={{ objectFit: 'contain' }} />
                                        </div>
                                        <p className="mt-3 text-base font-medium text-gray-900">{f.title}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Side - Preview Area */}
                        <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 h-full max-h-[calc(100vh-100px)]">
                            {showPreview ? (
                                <div className="w-full max-w-md">
                                    <h3 className="text-center text-xl font-semibold mb-6">Preview</h3>
                                    <div className="w-full h-72 bg-white flex items-center justify-center mb-5 rounded-lg shadow-sm">
                                        <div className="w-56 h-68 relative flex items-center justify-center">
                                            {isGenerating ? (
                                                <div className="text-base text-gray-500">Generating preview...</div>
                                            ) : uploadData ? (
                                                <>
                                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                                        <Image src={current.src} alt={current.title} fill style={{ objectFit: 'cover' }} />
                                                    </div>

                                                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                        <InteractiveImage
                                                            ref={interactiveRef}
                                                            src={uploadData}
                                                            width={current.id === 'frame-1' ? 180 : 180}
                                                            height={current.id === 'frame-1' ? 180 : 220}
                                                            isCircular={current.id === 'frame-1'}
                                                            preserveAspectRatio={false}
                                                            externalScale={imageScale}
                                                            onScaleChange={setImageScale}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-base text-gray-500">No preview available</div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Scale Slider */}
                                    <div className="mb-5">
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

                                                    // Try to store the composite image; if quota is exceeded, fall back to storing only metadata
                                                    let storedComposite: string | null = null;
                                                    try {
                                                        localStorage.setItem('hc_final', finalComposite);
                                                        storedComposite = finalComposite;
                                                    } catch (storageErr) {
                                                        console.warn('Failed to store hc_final in localStorage (likely quota exceeded). Proceeding without cached final image.', storageErr);
                                                    }
                                                    
                                                    const orderDetails = {
                                                        frameId: selected || current.id,
                                                        compositeImage: storedComposite,
                                                        originalUpload: uploadData,
                                                        transform: state,
                                                        timestamp: Date.now(),
                                                        isProcessed: true
                                                    };
                                                    
                                                    try {
                                                        localStorage.setItem('hc_order', JSON.stringify(orderDetails));
                                                    } catch (orderErr) {
                                                        console.error('Failed to store order details in localStorage:', orderErr);
                                                        alert('Your browser storage is full. Please clear some space (e.g. site data) and try again.');
                                                        setIsGenerating(false);
                                                        return;
                                                    }

                                                    setIsGenerating(false);
                                                    router.push('/payment');

                                                } catch (err) {
                                                    console.error('Error creating final image:', err);
                                                    setIsGenerating(false);
                                                    alert('An error occurred. Please try again. Error: ' + (err as Error).message);
                                                }
                                            }}
                                            className="px-6 py-2 bg-[#7C3F33] text-white rounded-full text-sm font-medium hover:bg-[#6A352B] transition-colors"
                                        >
                                            Make Payment
                                        </button>
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="text-4xl text-gray-300 mb-3">📷</div>
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Preview Your Frame</h3>
                                    <p className="text-sm text-gray-500 mb-6">Select a frame and click preview to see how your photo will look</p>
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
                                        className={`px-10 py-3 rounded-full text-lg font-medium ${selected && uploadData ? 'bg-[#7C3F33] text-white hover:bg-[#6A352B]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} transition-colors`}
                                    >
                                        Preview
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tablet Layout (md to lg) */}
            <div className="hidden md:flex lg:hidden flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {/* Section Title */}
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-gray-800">Choose a Frame Style</h2>
                        <p className="text-sm text-gray-500 mt-1">Select the perfect frame for your photo</p>
                    </div>

                    {/* Frame Grid for Tablet - Side by Side */}
                    <div className="grid grid-cols-2 gap-5 mb-6">
                        {FRAMES.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setSelected(f.id)}
                                className={`relative p-4 bg-white border-2 rounded-xl transition-all duration-200 ${
                                    selected === f.id 
                                        ? 'border-[#7C3F33] shadow-lg ring-2 ring-[#7C3F33]/20' 
                                        : 'border-gray-200 hover:border-[#7C3F33]/50 hover:shadow-md'
                                }`}
                            >
                                {/* Selected Indicator */}
                                {selected === f.id && (
                                    <div className="absolute top-3 right-3 w-6 h-6 bg-[#7C3F33] rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className="w-full h-56 relative mb-3">
                                    <Image src={f.src} alt={f.title} fill style={{ objectFit: 'contain' }} />
                                </div>
                                <p className="text-base font-medium text-gray-800">{f.title}</p>
                            </button>
                        ))}
                    </div>

                    {/* Preview Button for Tablet */}
                    <div className="flex justify-center pb-4">
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
                            className={`px-10 py-3.5 rounded-full text-base font-semibold shadow-md transition-all duration-200 ${
                                selected && uploadData 
                                    ? 'bg-[#7C3F33] text-white hover:bg-[#6A352B] active:scale-95' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            Preview Frame
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <main className="md:hidden flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4">
                    {/* Section Title */}
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-gray-800">Choose a Frame</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Tap to select your favorite style</p>
                    </div>

                    {/* Frame Grid - 2 columns on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                        {FRAMES.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setSelected(f.id)}
                                className={`relative p-3 bg-white border-2 rounded-xl transition-all duration-200 ${
                                    selected === f.id 
                                        ? 'border-[#7C3F33] shadow-lg ring-2 ring-[#7C3F33]/20' 
                                        : 'border-gray-200 active:scale-95'
                                }`}
                            >
                                {/* Selected Check Badge */}
                                {selected === f.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#7C3F33] rounded-full flex items-center justify-center z-10">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                                <div className="w-full aspect-4/5 relative mb-2">
                                    <Image src={f.src} alt={f.title} fill style={{ objectFit: 'contain' }} />
                                </div>
                                <p className={`text-sm font-medium text-center ${selected === f.id ? 'text-[#7C3F33]' : 'text-gray-700'}`}>
                                    {f.title}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="shrink-0 px-4 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
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
                        className={`w-full py-3.5 rounded-full text-base font-semibold transition-all duration-200 ${
                            selected && uploadData 
                                ? 'bg-[#7C3F33] text-white active:bg-[#6A352B] active:scale-[0.98]' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {selected ? 'Preview Frame' : 'Select a Frame'}
                    </button>
                </div>
            </main>

            {/* Mobile & Tablet Preview Modal */}
            {showPreview && (
                <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Adjust Your Photo</h3>
                            <button 
                                onClick={() => setShowPreview(false)} 
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {/* Preview Container */}
                            <div className="w-full aspect-4/5 bg-linear-to-b from-gray-50 to-gray-100 rounded-xl flex items-center justify-center mb-5 relative overflow-hidden">
                                <div className="w-[85%] h-[90%] relative flex items-center justify-center">
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-3 border-[#7C3F33] border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm text-gray-500">Loading preview...</span>
                                        </div>
                                    ) : uploadData ? (
                                        <>
                                            {/* Frame Overlay */}
                                            <div className="absolute inset-0 z-0 pointer-events-none">
                                                <Image src={current.src} alt={current.title} fill style={{ objectFit: 'contain' }} />
                                            </div>

                                            {/* Interactive Image Layer */}
                                            <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                <InteractiveImage
                                                    ref={interactiveRef}
                                                    src={uploadData}
                                                    width={current.id === 'frame-1' ? 180 : 180}
                                                    height={current.id === 'frame-1' ? 180 : 225}
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

                            {/* Instructions */}
                            <div className="bg-[#7C3F33]/5 rounded-lg px-4 py-3 mb-5">
                                <p className="text-xs text-[#7C3F33] text-center font-medium">
                                    👆 Drag to position • Pinch to zoom
                                </p>
                            </div>
                            
                            {/* Scale Slider */}
                            <div className="mb-2">
                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                    Photo Size
                                </label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setImageScale(Math.max(0.2, imageScale - 0.2))}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
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
                                    <button 
                                        onClick={() => setImageScale(Math.min(6, imageScale + 0.2))}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer - Fixed */}
                        <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowPreview(false)} 
                                    className="flex-1 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                >
                                    Back
                                </button>
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

                                            // Try to store the composite image; if quota is exceeded, fall back to storing only metadata
                                            let storedComposite: string | null = null;
                                            try {
                                                localStorage.setItem('hc_final', finalComposite);
                                                storedComposite = finalComposite;
                                            } catch (storageErr) {
                                                console.warn('Failed to store hc_final in localStorage (likely quota exceeded). Proceeding without cached final image.', storageErr);
                                            }
                                            
                                            const orderDetails = {
                                                frameId: selected || current.id,
                                                compositeImage: storedComposite,
                                                originalUpload: uploadData,
                                                transform: state,
                                                timestamp: Date.now(),
                                                isProcessed: true
                                            };
                                            
                                            try {
                                                localStorage.setItem('hc_order', JSON.stringify(orderDetails));
                                            } catch (orderErr) {
                                                console.error('Failed to store order details in localStorage:', orderErr);
                                                alert('Your browser storage is full. Please clear some space (e.g. site data) and try again.');
                                                setIsGenerating(false);
                                                return;
                                            }

                                            setIsGenerating(false);
                                            router.push('/payment');

                                        } catch (err) {
                                            console.error('Error creating final image:', err);
                                            setIsGenerating(false);
                                            alert('An error occurred. Please try again. Error: ' + (err as Error).message);
                                        }
                                    }}
                                    disabled={isGenerating}
                                    className="flex-2 py-3 bg-[#7C3F33] text-white rounded-full font-semibold hover:bg-[#6A352B] active:bg-[#5A2F25] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isGenerating ? 'Processing...' : 'Continue to Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
