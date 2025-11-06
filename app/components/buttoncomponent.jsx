import React from 'react'
import Link from 'next/link'

const ButtonComponent = ({ href }) => {
  const className = "bg-[#7C3F33] text-white px-10 py-3 rounded-full text-lg font-medium shadow-sm hover:opacity-95 inline-block text-center";

  if (href) {
    return (
      <Link href={href} className={className}>
        Start Framing
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className}
    >
      Start Framing
    </button>
  )
}

export default ButtonComponent;