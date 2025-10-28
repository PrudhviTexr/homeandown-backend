import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Apple,
  Store as PlayStore,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp
} from 'lucide-react';

const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);

  // Show/hide scroll-to-top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer className="relative">
      {/* Top Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-20">

            {/* About */}
            <div>
              <h3 className="text-[#162e5a] text-lg font-bold mb-6 relative inline-block">
                About
                <span className="absolute left-0 -bottom-2 w-12 h-[3px] bg-[#0ca5e9] rounded transition-all duration-300"></span>
              </h3>
              <ul className="space-y-3 text-gray-600 text-sm">
                {['About Us', 'Privacy Policy', 'Terms Of Services', 'Blogs', 'Contact Us'].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 group transition-transform duration-300 hover:translate-x-1"
                  >
                    <span className="text-[#0ca5e9] text-sm">▸</span>
                    <Link
                      to="/about"
                      target="_blank"
                      className="transition-colors duration-300 group-hover:text-[#0ca5e9]"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Host */}
            <div>
              <h3 className="text-[#162e5a] text-lg font-bold mb-6 relative inline-block">
                Host
                <span className="absolute left-0 -bottom-2 w-12 h-[3px] bg-[#0ca5e9] rounded transition-all duration-300"></span>
              </h3>
              <ul className="space-y-3 text-gray-600 text-sm">
                {['Why Host', 'Responsible Hosting', 'Trust and Safety'].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 group transition-transform duration-300 hover:translate-x-1"
                  >
                    <span className="text-[#0ca5e9] text-sm">▸</span>
                    <Link
                      to="/host"
                      target="_blank"
                      className="transition-colors duration-300 group-hover:text-[#0ca5e9]"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-[#162e5a] text-lg font-bold mb-6 relative inline-block">
                Community
                <span className="absolute left-0 -bottom-2 w-12 h-[3px] bg-[#0ca5e9] rounded transition-all duration-300"></span>
              </h3>
              <ul className="space-y-3 text-gray-600 text-sm">
                {['Diversity & Belonging', 'Accessibility', 'Frontline Stays'].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 group transition-transform duration-300 hover:translate-x-1"
                  >
                    <span className="text-[#0ca5e9] text-sm">▸</span>
                    <Link
                      to="/community"
                      target="_blank"
                      className="transition-colors duration-300 group-hover:text-[#0ca5e9]"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info */}
            <div>
              <h3 className="text-[#162e5a] text-lg font-bold mb-6 relative inline-block">
                Our Info & Address
                <span className="absolute left-0 -bottom-2 w-12 h-[3px] bg-[#0ca5e9] rounded transition-all duration-300"></span>
              </h3>
              <ul className="space-y-5 text-gray-700 text-sm">
                <li className="flex items-center gap-3 group">
                  <div className="bg-[#0ca5e9] p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:scale-105">
                    <Phone className="text-white group-hover:text-[#162e5a] transition-colors duration-300" size={18} />
                  </div>
                  <span className="transition-colors duration-300 group-hover:text-[#0ca5e9]">9440946662</span>
                </li>
                <li className="flex items-center gap-3 group">
                  <div className="bg-[#0ca5e9] p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:scale-105">
                    <Mail className="text-white group-hover:text-[#162e5a] transition-colors duration-300" size={18} />
                  </div>
                  <span className="transition-colors duration-300 group-hover:text-[#0ca5e9]">info@homeandown.com</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="bg-[#0ca5e9] p-3 rounded-xl shadow-sm mt-1 transition-all duration-300 group-hover:scale-105">
                    <MapPin className="text-white group-hover:text-[#162e5a] transition-colors duration-300" size={18} />
                  </div>
                  <span className="transition-colors duration-300 group-hover:text-[#0ca5e9]">
                    Chandanagar, Hyderabad<br />
                    Telangana-500050
                  </span>
                </li>
              </ul>
            </div>

            {/* App Links */}
            <div>
              <h3 className="text-[#162e5a] text-lg font-bold mb-6 relative inline-block">
                Get the App
                <span className="absolute left-0 -bottom-2 w-12 h-[3px] bg-[#0ca5e9] rounded transition-all duration-300"></span>
              </h3>
              <div className="space-y-4">
                <a
                  href="#"
                  className="flex items-center gap-4 bg-[#0ca5e9] text-white rounded-xl px-4 py-3 shadow-md transition-all duration-300 hover:shadow-lg hover:bg-[#0990cc] hover:scale-105"
                >
                  <Apple size={26} />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="font-semibold">Apple Store</div>
                  </div>
                </a>
                <a
                  href="#"
                  className="flex items-center gap-4 bg-[#0ca5e9] text-white rounded-xl px-4 py-3 shadow-md transition-all duration-300 hover:shadow-lg hover:bg-[#0990cc] hover:scale-105"
                >
                  <PlayStore size={26} />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-[#162e5a] py-4 border-t border-[#0ca5e9]/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-200 text-sm">© Home & Own 2025. All Rights Reserved</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0 text-[#0ca5e9]">
            <a href="#" className="transition-all duration-300 hover:text-white hover:scale-110"><Facebook size={20} /></a>
            <a href="#" className="transition-all duration-300 hover:text-white hover:scale-110"><Twitter size={20} /></a>
            <a href="#" className="transition-all duration-300 hover:text-white hover:scale-110"><Instagram size={20} /></a>
            <a href="#" className="transition-all duration-300 hover:text-white hover:scale-110"><Linkedin size={20} /></a>
          </div>
        </div>

        {/* Scroll to top */}
        {showScroll && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 bg-[#0ca5e9] text-white p-3 rounded-full shadow-md transition-all duration-300 hover:bg-[#0990cc] hover:scale-110"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </footer>
  );
};

export default Footer;
