import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface CitySearchProps {
  className?: string;
}

const CitySearch: React.FC<CitySearchProps> = ({ className }) => {
  const navigate = useNavigate();

  // Organize cities into 4 sections
  const cityData = {
    'Andhra Pradesh - Coastal': [
      'Visakhapatnam Properties',
      'Vijayawada Properties',
      'Guntur Properties',
      'Nellore Properties',
      'Rajahmundry Properties',
      'Kakinada Properties',
      'Machilipatnam Properties',
      'Eluru Properties'
    ],
    'Andhra Pradesh - Inland': [
      'Kurnool Properties',
      'Tirupati Properties',
      'Anantapur Properties',
      'Chittoor Properties',
      'Ongole Properties',
      'Kadapa Properties',
      'Vizianagaram Properties'
    ],
    'Telangana - Central': [
      'Hyderabad Properties',
      'Warangal Properties',
      'Nizamabad Properties',
      'Karimnagar Properties',
      'Mahbubnagar Properties',
      'Nalgonda Properties',
      'Siddipet Properties',
      'Medak Properties'
    ],
    'Telangana - Districts': [
      'Khammam Properties',
      'Adilabad Properties',
      'Suryapet Properties',
      'Miryalaguda Properties',
      'Jagtial Properties',
      'Mancherial Properties',
      'Wanaparthy Properties'
    ]
  };

  const handleCityClick = async (city: string) => {
    const cityName = city.replace(' Properties', '');

    // Navigate to buy page with city filter
    navigate(`/buy?city=${encodeURIComponent(cityName)}`);

    // Scroll to top with slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <section className={`py-16 bg-[#0A2351] text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Search Properties by City</h2>
          <p className="text-[#CBD5E1] text-lg">Find Your Dream Home in Your Favorite City</p>
        </div>

        {/* City Region Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(cityData).map(([region, cities]) => (
            <div
              key={region}
              className="rounded-2xl p-6 bg-white/5 backdrop-blur-md hover:bg-[#0ca5e9]/10 transition-all border border-white/10 shadow-md"
            >
              <h3 className="font-bold text-xl mb-4 text-[#0ca5e9] border-b border-[#0ca5e9]/30 pb-2">
                {region}
              </h3>
              <ul className="space-y-3">
                {cities.map((city, index) => (
                  <li key={index}>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCityClick(city);
                      }}
                      className="text-slate-300 hover:text-[#0ca5e9] transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-2 h-2 bg-[#0ca5e9] rounded-full mr-3 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                      {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Extra Info Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-8 max-w-4xl mx-auto border border-white/10 shadow-lg">
            <h3 className="text-2xl font-semibold mb-6 text-[#0ca5e9]">
              Why Choose Properties in AP & Telangana?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0ca5e9] mb-1">500+</div>
                <div className="text-gray-300">Verified Properties</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0ca5e9] mb-1">50+</div>
                <div className="text-gray-300">Cities Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#0ca5e9] mb-1">24/7</div>
                <div className="text-gray-300">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

  );
};

export default CitySearch;