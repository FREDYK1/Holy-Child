import React from 'react';
import Image  from 'next/image';

const HomePage = () => {
  return (
    <div className="home">
        <Image

        src="/holychildlogo.png"
        alt="Holychild Logo"
        width={200}
        height={200}
      />
    </div>
  );
};

export default HomePage;