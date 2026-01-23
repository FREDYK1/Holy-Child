import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Header = ({ label = 'Upload Photo', href = '/' }) => {
  return (
  <header className="w-full bg-gradient-to-r from-[#7C3F33] via-[#B86B5F] to-[#C97B6F] py-3 flex-shrink-0">
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative flex items-center justify-center">
          <Link href={href} className="absolute left-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black text-white">
            <Image src="/back.png" alt="Back" width={18} height={18} />
          </Link>

          <h1 className="text-base font-semibold text-white">{label}</h1>
        </div>
      </div>
    </header>
  )
}

export default Header