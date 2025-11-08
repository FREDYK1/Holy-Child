import React from 'react';
import Link from 'next/link';

const ButtonComponent = ({ href = '/uploadpic', children = 'Get Started' }) => {
  return (
    <Link href={href} className="inline-block px-6 py-2 rounded-full bg-[#7C3F33] text-white font-semibold">
      {children}
    </Link>
  );
};

export default ButtonComponent;