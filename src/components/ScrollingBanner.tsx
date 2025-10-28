import React from 'react';

const ScrollingBanner: React.FC = () => {
  const messages = [
    "🏠 We're hiring Real Estate Agents – minimum graduate degree required. Join our startup to help redefine India's property market.",
    "🌱 We plant 1 tree for every property sold through our platform - Building a greener future together.",
    "📚 Complete training and mentorship provided – no prior experience needed.",
    "💼 Competitive commission structure with clear growth paths.",
    "📞 Apply now: careers@homeandown.com"
  ];


  return (
    <div className="scrolling-banner bg-[#162e5a] text-white py-3 overflow-hidden relative shadow-md border-b-2 border-white/20 w-full z-50">
      <div className="scrolling-content">
        {/* First set of messages */}
        {messages.map((message, index) => (
          <span key={`first-${index}`} className="scrolling-message">
            {message}
          </span>
        ))}
        {/* Duplicate set for seamless loop */}
        {messages.map((message, index) => (
          <span key={`second-${index}`} className="scrolling-message">
            {message}
          </span>
        ))}
      </div>

      {/* Decorative elements */}
      {/* <div className="absolute top-2 left-4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
      <div className="absolute bottom-2 right-8 w-2 h-2 bg-white/25 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-white/35 rounded-full animate-pulse delay-500"></div>
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white/25 rounded-full animate-pulse delay-1500"></div> */}
    </div>
  );
};

export default ScrollingBanner;