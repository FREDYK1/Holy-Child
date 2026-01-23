import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Header = ({ label = 'Upload Photo', href = '/', step = 1, totalSteps = 4 }) => {
  return (
    <header className="w-full bg-gradient-to-r from-[#7C3F33] via-[#9E564A] to-[#B86B5F] py-4 shrink-0 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative flex items-center justify-center">
          {/* Back Button */}
          <Link 
            href={href} 
            className="absolute left-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 group"
          >
            <svg 
              className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Title & Step Indicator */}
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-lg sm:text-xl font-semibold text-white tracking-wide">{label}</h1>
            
            {/* Step Progress */}
            <div className="flex items-center gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i + 1 === step 
                      ? 'w-6 bg-white' 
                      : i + 1 < step 
                        ? 'w-1.5 bg-white/70' 
                        : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Placeholder for symmetry */}
          <div className="absolute right-0 w-10" />
        </div>
      </div>
    </header>
  )
}

export default Header