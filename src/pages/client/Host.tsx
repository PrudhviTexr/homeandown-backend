import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DollarSign, Shield, CheckCircle, Users, Star, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

const Host: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="pt-[50px]  flex-grow">
        <div className="">
          {/* Hero Section */}
          <div className="relative overflow-hidden mb-16">
            <img
              src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg"
              alt="Host your property"
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#162e5a]/90 via-[#162e5a]/70 to-transparent backdrop-blur-sm flex items-center">
              <div className="max-w-3xl mx-auto px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                  Become a Host
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-6">
                  List your property on <span className="text-[#0ca5e9] font-semibold">Home & Own</span> and connect with thousands of potential buyers and renters.
                </p>
                <button
                  onClick={() => user ? navigate('/sell') : setShowAuthModal(true)}
                  className="bg-[#0ca5e9] text-white px-8 py-3 md:py-4 md:px-10 rounded-xl text-lg font-semibold hover:bg-[#089cd4] transition-all duration-200 shadow-xl"
                >
                  Start Hosting Today
                </button>
              </div>
            </div>
          </div>


          {/* Why Host Section */}
          <div className="mb-16 max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#162e5a] mb-12">
              Why Host with Home &amp; Own?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-2xl duration-300">
                <div className="w-16 h-16 bg-[#0ca5e9]/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <DollarSign className="h-8 w-8 text-[#0ca5e9]" />
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Maximize Your Returns</h3>
                <p className="text-gray-600">
                  Our platform helps you get the best price for your property with market insights and pricing recommendations.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-2xl duration-300">
                <div className="w-16 h-16 bg-[#0ca5e9]/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Users className="h-8 w-8 text-[#0ca5e9]" />
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Reach More Buyers</h3>
                <p className="text-gray-600">
                  Connect with thousands of verified buyers and renters actively looking for properties like yours.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center transition-transform hover:-translate-y-2 hover:shadow-2xl duration-300">
                <div className="w-16 h-16 bg-[#0ca5e9]/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Shield className="h-8 w-8 text-[#0ca5e9]" />
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Safe &amp; Secure</h3>
                <p className="text-gray-600">
                  Our verification process ensures you deal only with genuine buyers, reducing fraud and time-wasters.
                </p>
              </div>
            </div>
          </div>


          {/* How It Works */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#162e5a] mb-12">
              How Hosting Works
            </h2>
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Left: Steps */}
              <div className="p-10 space-y-8">
                {[
                  {
                    step: 1,
                    title: 'Create Your Listing',
                    desc: 'Sign up as a seller, complete your verification, and list your property with photos, details, and pricing.',
                  },
                  {
                    step: 2,
                    title: 'Connect with Buyers',
                    desc: 'Receive inquiries and booking requests from interested buyers and renters through our platform.',
                  },
                  {
                    step: 3,
                    title: 'Schedule Viewings',
                    desc: 'Arrange property tours with interested parties at times that work for you.',
                  },
                  {
                    step: 4,
                    title: 'Close the Deal',
                    desc: 'Finalize the sale or rental agreement with your chosen buyer or tenant.',
                  },
                ].map(({ step, title, desc }) => (
                  <div className="flex items-start" key={step}>
                    <div className="w-12 h-12 bg-[#0ca5e9] text-white text-lg font-bold rounded-full flex items-center justify-center shadow-md mr-4">
                      {step}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#162e5a] mb-1">{title}</h3>
                      <p className="text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Image */}
              <div className="h-full w-full">
                <img
                  src="https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg"
                  alt="How Hosting Works"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>


          {/* Responsible Hosting */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#162e5a] mb-12">
              Responsible Hosting
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-3xl shadow-xl overflow-hidden items-stretch">

              {/* Left: Image (fills height of content) */}
              <div className="h-full w-full">
                <img
                  src="https://images.pexels.com/photos/8293770/pexels-photo-8293770.jpeg"
                  alt="Responsible Hosting"
                  className="w-full h-[600px] object-cover object-top"
                />
              </div>

              {/* Right: Content */}
              <div className="p-10 space-y-6 flex flex-col justify-center">
                <p className="text-gray-700">
                  At <span className="font-semibold text-[#0ca5e9]">Home & Own</span>, we believe in promoting responsible hosting practices that benefit both property owners and buyers/renters. Here are some guidelines to follow:
                </p>

                {[
                  {
                    title: 'Accurate Listings',
                    text: 'Provide accurate and honest information about your property, including any issues or limitations.',
                  },
                  {
                    title: 'Legal Compliance',
                    text: 'Ensure your property meets all legal requirements and regulations for sale or rental.',
                  },
                  {
                    title: 'Transparent Communication',
                    text: 'Respond promptly to inquiries and be transparent about terms and conditions.',
                  },
                  {
                    title: 'Fair Pricing',
                    text: 'Set reasonable prices based on market conditions and property value.',
                  },
                  {
                    title: 'Respect Privacy',
                    text: 'Respect the privacy and personal information of potential buyers and renters.',
                  },
                ].map(({ title, text }, index) => (
                  <div className="flex items-start" key={index}>
                    <CheckCircle className="h-5 w-5 text-[#0ca5e9] mt-1 mr-3" />
                    <div>
                      <h3 className="font-semibold text-[#162e5a]">{title}</h3>
                      <p className="text-gray-600 text-sm">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Trust and Safety */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">Trust and Safety</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-6">
                Your safety and security are our top priorities. Here's how we ensure a safe environment for all users:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">For Hosts</h3>
                  <ul className="space-y-2 text-gray-700">
                    {['Verified buyer profiles', 'Secure messaging system', 'Screening of potential buyers', 'Support for legal documentation']
                      .map((item, idx) => (
                        <li className="flex items-start" key={idx}>
                          <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">For Buyers/Renters</h3>
                  <ul className="space-y-2 text-gray-700">
                    {['Verified property listings', 'Secure payment options', 'Property inspection assistance', 'Fraud prevention measures']
                      .map((item, idx) => (
                        <li className="flex items-start" key={idx}>
                          <Shield className="h-5 w-5 text-green-600 mr-2 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-yellow-600 mr-3 mt-1" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> While we take extensive measures to ensure safety, we recommend conducting your own due diligence before finalizing any property transaction. For more information, please review our{' '}
                    <Link to="/safety-guidelines" className="text-[#90C641] hover:underline">
                      Safety Guidelines
                    </Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Host Testimonials */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl font-bold text-[#061D58] mb-8 text-center">What Our Hosts Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  initials: 'RS',
                  name: 'Rajesh Sharma',
                  rating: 5,
                  text: 'I sold my apartment within 3 weeks of listing on Home & Own. The verification process gave buyers confidence, and the platform made it easy to manage inquiries.',
                },
                {
                  initials: 'AP',
                  name: 'Anita Patel',
                  rating: 5,
                  text: 'As a property owner with multiple rentals, Home & Own has simplified my life. The tenant screening process is thorough, and I’ve found reliable tenants every time.',
                },
                {
                  initials: 'VK',
                  name: 'Vikram Kumar',
                  rating: 4,
                  text: 'The support team at Home & Own is exceptional. When I had questions about pricing my property, they provided market insights that helped me set the right price.',
                },
              ].map(({ initials, name, rating, text }, idx) => (
                <div className="bg-white rounded-lg shadow-lg p-6" key={idx}>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-[#3B5998] rounded-full flex items-center justify-center text-white font-bold mr-4">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold">{name}</h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'} fill-current`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 italic">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#3B5998] to-[#061D58]  p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Hosting?</h2>
            <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
              Join thousands of successful hosts on Home &amp; Own and start earning from your property today.
            </p>
            <button
              onClick={() => user ? navigate('/sell') : setShowAuthModal(true)}
              className="bg-[#0ca5e9] text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-[#0880b6] transition-colors shadow-lg"
            >
              List Your Property
            </button>
          </div>
        </div>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        userType="seller"
      />
    </div>
  );
};

export default Host;
