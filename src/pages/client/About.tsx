import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Users, Phone, Mail, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/utils/backend';

const About: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form with user details if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          form_type: 'general'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      toast.success('Thank you for your message! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[50px] pb-16">
        <div className="container mx-auto ">

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
                  About Home & Own
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-6">
                  We're on a mission to make property buying, selling, and renting simple, transparent, and accessible for everyone.
                </p>
              </div>
            </div>
          </div>


          {/* Our Story */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Our Story</h2>

            <div className="grid md:grid-cols-2 gap-10 items-center bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {/* Left: Image */}
              <div className="flex justify-center">
                <img
                  src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Home & Own Story"
                  className="rounded-2xl w-full  shadow-lg"
                />
              </div>

              {/* Right: Text */}
              <div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Home & Own was founded in 2023 with a simple vision: to transform India's real estate market by connecting property owners directly with buyers and renters, eliminating unnecessary intermediaries and making the process more transparent.
                </p>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  Our founder, frustrated by the complexity and opacity of traditional property transactions, set out to build a platform that would empower both property owners and seekers with the tools and information they need to make confident decisions.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Today, Home & Own is one of India's fastest-growing property platforms, serving thousands of users across major cities with a focus on transparency, trust, and technology.
                </p>
              </div>
            </div>
          </div>


          {/* Our Values */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Our Core Values</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-[#0ca5e9] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Trust & Transparency</h3>
                <p className="text-gray-600 leading-relaxed">
                  We verify all listings and users to ensure a safe and trustworthy platform for everyone.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-[#0ca5e9] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Community First</h3>
                <p className="text-gray-600 leading-relaxed">
                  We build features that serve the needs of our community of property owners, buyers, and renters.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-[#0ca5e9] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Simplicity</h3>
                <p className="text-gray-600 leading-relaxed">
                  We make complex processes simple, from property listing to final transaction.
                </p>
              </div>
            </div>
          </div>


          {/* Privacy Policy Section */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Privacy Policy</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white rounded-3xl shadow-xl p-8 md:p-12">
              {/* Left Content */}
              <div>
                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                  At Home & Own, we take your privacy seriously. Our privacy policy outlines how we collect, use, and protect your personal information.
                </p>

                <h3 className="text-xl font-semibold text-[#162e5a] mb-2">Information We Collect</h3>
                <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
                  <li>Personal information such as name, email, and phone number</li>
                  <li>Property details when you list a property</li>
                  <li>Transaction information when you buy, sell, or rent</li>
                  <li>Usage data to improve our services</li>
                </ul>

                <h3 className="text-xl font-semibold text-[#162e5a] mb-2">How We Use Your Information</h3>
                <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
                  <li>To provide and improve our services</li>
                  <li>To connect buyers with sellers and renters with owners</li>
                  <li>To verify user identities and prevent fraud</li>
                  <li>To communicate important updates and offers</li>
                </ul>

                <p className="text-gray-700">
                  For the complete privacy policy, please <Link to="/privacy-policy" className="text-[#0ca5e9] hover:underline">click here</Link>.
                </p>
              </div>

              {/* Right Image */}
              <div className="flex justify-center">
                <img
                  src="https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80"
                  alt="Privacy Illustration"
                  className="rounded-2xl w-full h-auto object-cover max-h-[500px] shadow-md"
                />
              </div>
            </div>
          </div>


          {/* Terms of Service */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Terms of Service</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch bg-white rounded-3xl shadow-xl overflow-hidden">
              {/* Left Side Image (full height/width of content) */}
              <div className="w-full h-full">
                <img
                  src="https://stories.freepiklabs.com/storage/1232/House-searching-01.svg"
                  alt="Terms Illustration"
                  className="rounded-2xl w-full h-auto object-cover max-h-[400px] shadow-md"
                />
              </div>

              {/* Right Side Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                  By using Home &amp; Own, you agree to our Terms of Service, which govern your use of our platform and services.
                </p>

                <h3 className="text-xl font-semibold text-[#162e5a] mb-2">Key Terms</h3>
                <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
                  <li>User responsibilities and account security</li>
                  <li>Property listing guidelines and requirements</li>
                  <li>Transaction processes and payment terms</li>
                  <li>Dispute resolution procedures</li>
                  <li>Limitation of liability and disclaimers</li>
                </ul>

                <p className="text-gray-700">
                  For the complete terms of service, please{' '}
                  <Link to="/terms-of-service" className="text-[#0ca5e9] hover:underline">
                    click here
                  </Link>.
                </p>
              </div>
            </div>
          </div>


          {/* Blogs */}
          <div className="max-w-7xl mx-auto px-4 mb-16">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-[#162e5a]">Our Blog</h2>
              <Link to="/blogs" className="text-[#0ca5e9] font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Blog Card 1 */}
              <div className="group bg-white rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg"
                  alt="Real Estate Investment Tips"
                  className="w-full h-60 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#162e5a] mb-2">
                    Top 10 Real Estate Investment Tips for 2025
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Learn the best strategies for real estate investment in the current market.
                  </p>
                  <Link
                    to="/blog/investment-tips"
                    className="text-[#0ca5e9] font-semibold hover:underline"
                  >
                    Read More →
                  </Link>
                </div>
              </div>

              {/* Blog Card 2 */}
              <div className="group bg-white rounded-3xl shadow-xl overflow-hidden transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src="https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg"
                  alt="Home Buying Guide"
                  className="w-full h-60 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#162e5a] mb-2">
                    First-Time Home Buyer's Complete Guide
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Everything you need to know before purchasing your first property.
                  </p>
                  <Link
                    to="/blog/home-buying-guide"
                    className="text-[#0ca5e9] font-semibold hover:underline"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            </div>
          </div>


          {/* Contact Us */}
          <div id="contact" className="max-w-7xl mx-auto px-4 py-10">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-10">Contact Us</h2>
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left: Contact Info */}
                <div>
                  <h3 className="text-xl font-semibold text-[#162e5a] mb-6">Get In Touch</h3>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0ca5e9] p-3 rounded-full">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-gray-700 text-base mt-1">+91 9440946662</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0ca5e9] p-3 rounded-full">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-gray-700 text-base mt-1">info@homeandown.com</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0ca5e9] p-3 rounded-full">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-gray-700 text-base">
                        Chandanagar, Hyderabad<br />Telangana - 500050
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Contact Form */}
                <div>
                  <h3 className="text-xl font-semibold text-[#162e5a] mb-6">Send Us a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your Name"
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ca5e9]"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Your Email"
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ca5e9]"
                    />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Your Message"
                      required
                      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ca5e9]"
                    ></textarea>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#162e5a] text-white px-6 py-3 rounded-xl hover:bg-[#0ca5e9] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>


        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;