import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Heart, Globe, Zap, Award, Calendar, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Community: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[50px]">
        <div className="container mx-auto">
          {/* Hero Section */}
          <div className="relative overflow-hidden mb-16">
            <img
              src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg"
              alt="Host your property"
              className="w-full h-[350px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#162e5a]/90 via-[#162e5a]/70 to-transparent backdrop-blur-sm flex items-center">
              <div className="max-w-3xl mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 mt-16">
                  Our Community
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-6">
                  Home & Own is more than a platform—it's a community of property owners, buyers, renters, and agents working together to transform real estate in India.
                </p>
              </div>
            </div>
          </div>

          {/* Diversity & Belonging */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6 text-center">Diversity & Belonging</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2">
                  <p className="text-gray-700 mb-4">
                    At Home & Own, we believe that everyone deserves to find a place they can call home, regardless of their background, identity, or circumstances.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Our commitment to diversity and inclusion extends to every aspect of our platform and community:
                  </p>
                  <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                    <li>Inclusive property listings that welcome all</li>
                    <li>Accessible platform design for users with disabilities</li>
                    <li>Zero tolerance for discrimination</li>
                    <li>Support for underrepresented communities</li>
                    <li>Diverse team building our platform</li>
                  </ul>
                </div>
                <div className="md:w-1/2">
                  <img
                    src="https://images.pexels.com/photos/7148384/pexels-photo-7148384.jpeg"
                    alt="Diverse community"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6 text-center">Accessibility</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-6">
                We're committed to making Home & Own accessible to everyone, including people with disabilities. Our accessibility initiatives include:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Web Accessibility
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Our website follows WCAG guidelines to ensure it's usable by people with various disabilities.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Accessible Properties
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We highlight properties with accessible features for people with mobility challenges.
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Support for All Users
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Our customer support team is trained to assist users with various accessibility needs.
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Inclusive Design
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We continuously improve our platform based on feedback from users with disabilities.
                  </p>
                </div>
              </div>

              <p className="text-gray-700">
                If you have suggestions for improving our accessibility, please <Link to="/contact" className="text-[#90C641] hover:underline">contact us</Link>. We value your feedback.
              </p>
            </div>
          </div>

          {/* Frontline Stays */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6 text-center">Frontline Stays</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2">
                  <img
                    src="https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg"
                    alt="Frontline workers"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="md:w-1/2">
                  <h3 className="text-xl font-semibold mb-4">Supporting Our Heroes</h3>
                  <p className="text-gray-700 mb-4">
                    Our Frontline Stays program connects property owners with frontline workers who need temporary housing during emergencies, natural disasters, or health crises.
                  </p>
                  <p className="text-gray-700 mb-4">
                    If you're a property owner interested in offering your space to frontline workers, or if you're a frontline worker in need of housing, please visit our <Link to="/frontline-stays" className="text-[#90C641] hover:underline">Frontline Stays page</Link> for more information.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> Property owners who participate in our Frontline Stays program receive special recognition on our platform and may qualify for reduced service fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Community Events */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6 text-center">Upcoming Community Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-[#3B5998] text-white p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Property Investment Workshop</h3>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-sm opacity-90">August 15, 2025 • 10:00 AM - 1:00 PM</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">Hyderabad Convention Center</span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Learn from expert investors about property investment strategies in the current market.
                  </p>
                  <button className="bg-[#0ca5e9] text-white px-4 py-2 rounded-lg hover:bg-[#068bc6] transition-colors text-sm font-medium w-full">
                    Register Now
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-[#3B5998] text-white p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Home Renovation Masterclass</h3>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-sm opacity-90">September 5, 2025 • 2:00 PM - 5:00 PM</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">Virtual Event (Zoom)</span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Discover budget-friendly renovation tips to increase your property's value.
                  </p>
                  <button className="bg-[#0ca5e9] text-white px-4 py-2 rounded-lg hover:bg-[#068bc6] transition-colors text-sm font-medium w-full">
                    Register Now
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-[#3B5998] text-white p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">First-Time Homebuyer Seminar</h3>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <p className="text-sm opacity-90">October 10, 2025 • 11:00 AM - 2:00 PM</p>
                </div>
                <div className="p-6">
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">Visakhapatnam Conference Hall</span>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Everything you need to know about buying your first home, from financing to closing.
                  </p>
                  <button className="bg-[#0ca5e9] text-white px-4 py-2 rounded-lg hover:bg-[#068bc6] transition-colors text-sm font-medium w-full">
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Community Recognition */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-2xl font-bold text-[#061D58] mb-6 text-center">Community Recognition</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-6">
                We celebrate members of our community who go above and beyond in their contributions to Home & Own and the real estate industry.
              </p>

              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    <Award className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Top Host of the Month</h3>
                    <p className="text-gray-600 mb-2">
                      Recognizing hosts with exceptional property listings and outstanding buyer/renter feedback.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium">
                        July 2025 Winner: Priya Sharma, Hyderabad
                      </p>
                      <p className="text-blue-600 text-xs">
                        "Priya's detailed property listings and prompt responses have earned her perfect 5-star ratings from all visitors."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-16 h-16 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4 flex-shrink-0">
                    <Award className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Community Champion</h3>
                    <p className="text-gray-600 mb-2">
                      Celebrating members who contribute to making real estate more accessible and transparent.
                    </p>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-green-800 text-sm font-medium">
                        Q2 2025 Champion: Rajesh Kumar, Visakhapatnam
                      </p>
                      <p className="text-green-600 text-xs">
                        "Rajesh has helped over 50 first-time homebuyers navigate the complex process of property purchase."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Join Our Community */}
          <div className="bg-gradient-to-r from-[#3B5998] to-[#061D58]  p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Join Our Community</h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              Whether you're buying, selling, renting, or just exploring, there's a place for you in the Home & Own community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/buy"
                target="_blank"
                className="bg-white text-[#3B5998] px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-lg font-medium"
              >
                Find a Home
              </Link>
              <Link
                to="/sell"
                target="_blank"
                className="bg-[#0ca5e9] text-white px-6 py-3 rounded-lg hover:bg-[#067cb1] transition-colors shadow-lg font-medium"
              >
                List Your Property
              </Link>
              <Link
                to="/agents"
                target="_blank"
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-colors shadow-lg font-medium"
              >
                Connect with Agents
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Community;