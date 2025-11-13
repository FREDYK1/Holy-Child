import Image from 'next/image';
import ButtonComponent from './components/buttoncomponent';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8 py-12">
        {/* Logo */}
        <div className="mt-5">
          <Image
            src="/holychildlogo.png"
            alt="Holy Child College logo"
            width={140}
            height={140}
            priority
          />
        </div>

        {/* Headline */}
        <h1 className="mt-6 text-[#7A3B33] font-serif text-3xl md:text-4xl leading-tight">
          <span className="block">Create Lasting Memories</span>
          <span className="block mt-1 text-2xl">with</span>
          <span className="block mt-1 text-2xl">Custom Frames</span>
        </h1>

        {/* Description */}
        <p className="mt-4 text-sm md:text-base text-gray-700 px-4">
          Design unique frames for Holy Child College of Education&apos;s 80th Anniversary. Preserve your cherished moments in style and honor a legacy.
        </p>

        {/* Poster / framed image placeholder */}
        <div className="w-56 md:w-64 bg-[#6a3f36] p-4 rounded-sm shadow-lg">
          <div className="bg-white rounded-sm p-2 flex items-center justify-center">
            <Image
              src="/poster.svg"
              alt="Sample framed poster"
              width={220}
              height={220}
              className="object-cover"
            />
          </div>
        </div>
        <div className="w-full flex justify-center">
          <ButtonComponent href="/uploadpic">Start Framing</ButtonComponent>
        </div>
      </div>
    </main>
  );
}
