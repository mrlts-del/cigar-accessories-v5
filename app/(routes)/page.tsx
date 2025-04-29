export default async function HomePage() {
  // TODO: Fetch and display featured products
  // const featuredProducts: Product[] = await prisma.product.findMany({
  //   where: {
  //     // Add criteria for featured products if applicable,
  //     // otherwise fetch a limited number or based on some flag.
  //     // For now, let's assume fetching the first 4 products as an example.
  //     // Adjust this logic based on how "featured" is actually determined.
  //   },
  //   take: 4, // Example limit
  //   orderBy: {
  //     createdAt: 'desc', // Example ordering
  //   },
  // });

  // TODO: Fetch and display new arrivals
  // const newArrivals: Product[] = await prisma.product.findMany({
  //   take: 4, // Example limit for new arrivals
  //   orderBy: {
  //     createdAt: 'desc', // Order by creation date for new arrivals
  //   },
  // });

  // TODO: Fetch and display billboard data
  // const billboard = {
  //   id: 'example-billboard-1',
  //   label: 'Summer Collection',
  //   imageUrl: '/images/billboard-summer.jpg', // Replace with actual image path
  //   // Added dummy dates to satisfy Billboard component type
  //   createdAt: new Date(),
  //   updatedAt: new Date(),
  // };

  return (
    <div className="space-y-10 pb-10 bg-gray-900 text-gray-100"> {/* Overall dark theme container */}
      {/* Hero Section */}
      <section className="relative h-[1000px] bg-black flex items-center justify-center text-center overflow-hidden"> {/* Dark background for video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://res.cloudinary.com/dvumjbuwj/video/upload/v1741597553/SmokeBackground_emdqlg.mp4"
        >
          Your browser does not support the video tag.
        </video>
        <div className="z-10 relative"> {/* Ensure content is above video */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Premium Cigar Accessories for Enthusiast
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Elevate your cigar experience with our collection
          </p>
          <a href="#product-showcase"> {/* Anchor link */}
            <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-full transition duration-300">
              Explore Collection
            </button>
          </a>
        </div>
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-12 bg-gray-800"> {/* Slightly lighter dark background */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Column 1 */}
            <div className="flex flex-col items-center">
              <div className="text-amber-500 text-4xl mb-4">🔒</div> {/* Placeholder Icon */}
              <h3 className="text-lg font-semibold text-white mb-2">Secure Checkout</h3>
              <p className="text-gray-300">Your information is protected by SSL encryption.</p>
            </div>
            {/* Column 2 */}
            <div className="flex flex-col items-center">
              <div className="text-amber-500 text-4xl mb-4">💳</div> {/* Placeholder Icon */}
              <h3 className="text-lg font-semibold text-white mb-2">Accepted Payments</h3>
              <p className="text-gray-300">Visa, MasterCard, Apple Pay, LinePay, JKO Pay</p>
            </div>
            {/* Column 3 */}
            <div className="flex flex-col items-center">
              <div className="text-amber-500 text-4xl mb-4">🚚</div> {/* Placeholder Icon */}
              <h3 className="text-lg font-semibold text-white mb-2">Free Shipping</h3>
              <p className="text-gray-300">Free shipping on all orders above 3000</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section id="product-showcase" className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Product Showcase</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Product Card Placeholders (6 times) */}
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
                  Placeholder Image
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Placeholder Product Name</h3>
                  <p className="text-gray-300 text-sm mb-4">Short placeholder description.</p>
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 text-lg font-bold">$XX.XX</span>
                    <button className="bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-4 rounded-full transition duration-300">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Lounge Promotion Section */}
      <section className="py-16 bg-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Experience Our Exclusive Lounge - Opening Soon
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <div className="flex flex-col items-center justify-center md:flex-row md:space-x-8">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition duration-300 mb-8 md:mb-0">
              Join Our LINE Community
            </button>
            {/* Placeholder for QR code */}
            <div className="w-32 h-32 bg-gray-700 flex items-center justify-center text-gray-400 rounded-lg">
              QR Code Placeholder
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Cigar Enthusiast Blog</h2>
          <p className="text-center text-gray-300 mb-12">Insights and Tips</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Blog Article Previews (3 times) */}
            {[
              "The Ultimate Cigar Selection Guide",
              "Mastering the Art of Cigar Cutting",
              "Essential Humidor Maintenance"
            ].map((title, index) => (
              <div key={index} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center text-gray-400">
                  Placeholder Image
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
                  <button className="bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-4 rounded-full transition duration-300">
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}