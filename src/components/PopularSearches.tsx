import React from 'react';
import { Link } from 'react-router-dom';
import Commercial from '../assets/commercial.jpg';
import Villas from '../assets/villas.jpg';
import IndependentHouse from '../assets/independent-house.jpg';
import StandaloneApartments from '../assets/standalone-apartments.jpg';
import GatedApartments from '../assets/gated-apartments.jpg';
import LandsFarmhouse from '../assets/lands-farmhouse.jpg';






interface SearchCategory {
  title: string;
  image: string;
  link: string;
}

const PopularSearches: React.FC = () => {
  const categories: SearchCategory[] = [
    {
      title: 'Commercial Properties',
      image: Commercial,
      link: '/buy?propertyType=commercial'
    },
    {
      title: 'Villas',
      image: Villas,
      link: '/buy?propertyType=villa'
    },
    {
      title: 'Independent Houses',
      image: IndependentHouse,
      link: '/buy?propertyType=independent_house'
    },
    {
      title: 'Standalone Apartments',
      image: StandaloneApartments,
      link: '/buy?propertyType=standalone_apartment'
    },
    {
      title: 'Gated Apartments',
      image: GatedApartments,
      link: '/buy?propertyType=gated_apartment'
    },
    {
      title: 'Lands & Farm Houses',
      image: LandsFarmhouse,
      link: '/buy?propertyType=land,farm_house,plot'
    }
  ];

  const handleCategoryClick = () => {
    // Scroll to top with slight delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">
          Popular Searches Nearby
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <div key={index} className="group transition-transform transform hover:-translate-y-1">
              <Link
                to={category.link}
                onClick={handleCategoryClick}
                className="block"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-xl border border-gray-100 group-hover:shadow-2xl transition-all duration-300">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#162e5a]/80 via-[#162e5a]/30 to-transparent flex items-end rounded-2xl">
                    <h3 className="text-2xl font-bold text-white p-6 drop-shadow-md">
                      {category.title}
                    </h3>
                  </div>
                  <div className="absolute top-4 right-4 w-10 h-10 bg-[#0ca5e9] rounded-full opacity-0 group-hover:opacity-100 transition duration-300"></div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>

  );
};

export default PopularSearches;