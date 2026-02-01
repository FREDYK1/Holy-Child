import Image from 'next/image';
import ButtonComponent from './components/buttoncomponent';

export default function Home() {
  return (
    <main className="h-full overflow-hidden bg-gradient-to-br from-[#fdf8f6] via-white to-[#fef5f2]">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#7C3F33]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#B86B5F]/5 rounded-full blur-3xl" />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-full relative">
        {/* Left Side - Content */}
        <div className="flex-1 flex items-center justify-center px-12 relative z-10">
          <div className="max-w-xl space-y-8">
            {/* Logo with glow effect */}
            <div className="flex justify-start">
              <div className="relative">
                <div className="absolute inset-0 bg-[#7C3F33]/20 rounded-full blur-2xl scale-150" />
                <Image
                  src="/holychildlogo.png"
                  alt="Holy Child College logo"
                  width={140}
                  height={140}
                  priority
                  className="relative z-10 drop-shadow-lg"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C3F33]/10 rounded-full">
              <span className="w-2 h-2 bg-[#7C3F33] rounded-full animate-pulse-subtle" />
              <span className="text-sm font-medium text-[#7C3F33]">80th Anniversary Celebration</span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                Create <span className="text-[#7C3F33]">Lasting</span>
                <br />Memories
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-md">
                Design unique commemorative frames to celebrate Holy Child College of Education&apos;s milestone anniversary.
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Easy to Use</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant Download</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Premium Quality</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <ButtonComponent href="/uploadpic" size="large">Start Creating</ButtonComponent>
            </div>
          </div>
        </div>

        {/* Right Side - Frame Preview */}
        <div className="flex-1 bg-gradient-to-br from-[#7C3F33] via-[#8B4A3D] to-[#6A352B] flex items-center justify-center relative overflow-hidden">
          {/* Decorative patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-white/30 rounded-full" />
            <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/20 rounded-full" />
            <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-white/20 rounded-full" />
          </div>
          pass
          
          {/* Frame showcase */}
          <div className="relative z-10 animate-float">
            <div className="absolute inset-0 bg-white/10 rounded-2xl blur-2xl scale-110" />
            <div className="relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-2xl">
              <Image
                src="/poster.svg"
                alt="Sample framed poster"
                width={320}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-20 right-20 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <span className="text-white text-sm font-medium">✨ Premium Frames</span>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden h-full flex flex-col overflow-y-auto relative">
        {/* Hero Section */}
        <div className="relative pt-8 pb-6 px-6 text-center bg-gradient-to-b from-[#7C3F33] via-[#8B4A3D] to-[#9E564A]">
          {/* Decorative circles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -left-20 w-40 h-40 border border-white/10 rounded-full" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 border border-white/10 rounded-full" />
          </div>
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-full p-3 shadow-lg">
                <Image
                  src="/holychildlogo.png"
                  alt="Holy Child College logo"
                  width={80}
                  height={80}
                  priority
                />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-subtle" />
              <span className="text-xs font-medium text-white">80th Anniversary</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-bold text-white leading-tight mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
              Create Lasting
              <br />Memories
            </h1>
            <p className="text-sm text-white/80 max-w-xs mx-auto">
              Design unique commemorative frames for the milestone celebration
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center gap-6">
          {/* Frame Preview */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#7C3F33]/10 rounded-2xl blur-xl scale-105" />
            <div className="relative bg-gradient-to-br from-[#7C3F33] to-[#6A352B] p-4 rounded-2xl shadow-xl">
              <Image
                src="/poster.svg"
                alt="Sample framed poster"
                width={180}
                height={225}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Features */}
          <div className="flex justify-center gap-6 text-xs text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#7C3F33]/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span>Quick</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#7C3F33]/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Quality</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-[#7C3F33]/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-[#7C3F33]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span>Download</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="w-full max-w-xs">
            <ButtonComponent href="/uploadpic" className="w-full justify-center">Start Creating</ButtonComponent>
          </div>
        </div>
      </div>
    </main>
  );
}
