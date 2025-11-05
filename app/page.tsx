import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center" >
      <div className="my-4">
        <Image
          src="/holychildlogo.png"
          alt="Example Image"
          width={200}
          height={200}
        />
      </div>
      <div className="text-center my-4 text-[#835048] font-PlayfairDisplay">
        <div className="text-4xl md:text-6xl text-center font-semibold tracking-tight leading-tight">
          Create Lasting Memories
        </div>
        <div className="text-base md:text-lg mt-1">
          with
          </div>
        <div className="text-base md:text-lg">
          Custom Frames
          </div>
      </div>
      <div>

      </div>
      <div>

      </div>
    </div>
  );
}
