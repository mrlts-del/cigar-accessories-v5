import React from 'react';

const CigarLoungePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative aspect-square md:aspect-[2.4/1] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover absolute top-0 left-0 w-full h-full z-[-1]"
        >
          <source src="https://res.cloudinary.com/dvumjbuwj/video/upload/v1741597902/LoungePromo_nadgsz.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/40 z-[-1]" />
        <div className="h-full w-full flex flex-col justify-center items-center text-center gap-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white">
            Cigar <span className="text-gold-500">Lounge</span> Coming Soon
          </h1>
          <p className="text-lg sm:text-xl text-white/90">A Premium Experience</p>
          <div className="text-white/80 text-center max-w-lg mx-auto px-4">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <button className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-2 px-6 rounded-full mt-4">
            Join our Community
          </button>
        </div>
      </div>

      {/* LINE Community Section */}
      <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">
              Join Our <span className="text-gold-500">LINE</span> Community
            </h2>
            <p className="text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet nulla auctor, vestibulum magna sed, convallis ex.</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600 mb-4">Scan QR Code</p>
              <div className="w-32 h-32 bg-gray-200 mx-auto my-4"></div>
            </div>
            <button className="mt-6 bg-line-green hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full">
              JOIN US NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CigarLoungePage;