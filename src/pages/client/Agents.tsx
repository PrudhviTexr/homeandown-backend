import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Mail, MessageCircle, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { AdminApi } from '@/services/pyApi';
import { getCityOptions } from '@/config/cities';

interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  city?: string;
  state?: string;
  experience_years?: number;
  specialization?: string;
  agency_name?: string;
  license_number?: string;
  verification_status: string;
  profile_image?: string;
  rating?: number;
  total_sales?: number;
  languages?: string[];
}

const Agents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    specialization: searchParams.get('specialization') || '',
    experience: searchParams.get('experience') || '',
  });

  // Get city options from centralized config
  const cityOptions = getCityOptions();

  useEffect(() => {
    // Redirect agents to their dashboard immediately (once)
    if (user && (user as any).user_type === 'agent') {
      navigate('/agent/dashboard', { replace: true });
      return;
    }
    // Fetch agents for non-agent users
    fetchAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const users = await AdminApi.users();
  const onlyAgents = (users || []).filter((u: any) => (u.user_type || '').toLowerCase() === 'agent' && (u.status || '') === 'active' && (['approved','verified'].includes(String(u.verification_status || '').toLowerCase())) && !!u.email_verified);
      const transformedAgents: Agent[] = onlyAgents.map((u: any) => ({
        id: u.id,
        first_name: u.first_name || 'Agent',
        last_name: u.last_name || 'User',
        email: u.email,
        phone_number: u.phone_number || '',
        city: u.city || '',
        state: u.state || '',
        experience_years: u.experience_years || 0,
        specialization: u.specialization || 'General',
        agency_name: `${u.first_name || 'Agent'} ${u.last_name || 'User'} Realty`,
        verification_status: u.verification_status,
        rating: 4.5,
        total_sales: 0,
        languages: ['English'],
      }));
      // Apply simple client filters
      const filtered = transformedAgents.filter(a => {
        if (filters.city && String(a.city || '').toLowerCase() !== String(filters.city).toLowerCase()) return false;
        if (filters.specialization && String(a.specialization || '').toLowerCase() !== String(filters.specialization).toLowerCase()) return false;
        if (filters.experience) {
          const exp = a.experience_years || 0;
          if (filters.experience === '0-2' && !(exp >= 0 && exp <= 2)) return false;
          if (filters.experience === '3-5' && !(exp >= 3 && exp <= 5)) return false;
          if (filters.experience === '6-10' && !(exp >= 6 && exp <= 10)) return false;
          if (filters.experience === '10+' && !(exp >= 10)) return false;
        }
        return true;
      });
      setAgents(filtered);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContactAgent = (agent: Agent) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedAgent(agent);
    setShowContactModal(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  // Show loading while redirecting agents
  if (user && 'user_type' in user && user.user_type === 'agent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
      </div>
    );
  }

  // Regular Agents Listing View
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[50px] pb-16">
        <div>
          <div>
            {/* Header */}
            <div className="relative overflow-hidden mb-4">
              <img
                src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg"
                alt="Host your property"
                className="w-full h-[350px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#162e5a]/90 via-[#162e5a]/70 to-transparent backdrop-blur-sm flex items-center">
                <div className="max-w-3xl mx-auto px-6 text-center">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 mt-16">
                    Find Your Perfect Real Estate Agent
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 mb-6">
                    Connect with verified and experienced real estate professionals
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 professional-card p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="professional-input p-3"
                >
                  <option value="">All Cities</option>
                  {(cityOptions || []).map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>

                <select
                  value={filters.specialization}
                  onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                  className="professional-input p-3"
                >
                  <option value="">All Specializations</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Luxury">Luxury Properties</option>
                  <option value="Investment">Investment</option>
                </select>

                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                  className="professional-input p-3"
                >
                  <option value="">Experience Level</option>
                  <option value="0-2">0-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="10+">10+ years</option>
                </select>

                <button
                  onClick={fetchAgents}
                  className="professional-button bg-[#0ca5e9] text-white px-6 py-3 rounded-lg hover:bg-[#068ac4]"
                >
                  Search Agents
                </button>
              </div>
            </div>

            {/* Agents Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-12 w-12 border-b-2 border-[#90C641] rounded-full" />
              </div>
            ) : agents.length === 0 ? (
              <div className="max-w-7xl mx-auto px-4 text-center py-12">
                <div className="professional-card p-12">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">No Agents Found</h3>
                  <p className="text-gray-600 mb-6">
                    We don't have any verified agents matching your criteria at the moment.
                    Please try adjusting your filters or check back later.
                  </p>
                  <button
                    onClick={() => {
                      setFilters({ city: '', specialization: '', experience: '' });
                      fetchAgents();
                    }}
                    className="bg-[#0ca5e9] text-white px-6 py-3 rounded-lg hover:bg-[#068ac4] transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(agents || []).map((agent) => (
                  <div key={agent.id} className="professional-card p-6 card-hover">
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 bg-[#0ca5e9] rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {agent.first_name[0]}{agent.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {agent.first_name} {agent.last_name}
                        </h3>
                        <p className="text-gray-600">{agent.agency_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center mb-2">
                      <div className="flex items-center mr-4">
                        {renderStars(agent.rating || 4.5)}
                        <span className="ml-2 text-sm text-gray-600">
                          {(agent.rating || 4.5).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {agent.total_sales || 0} sales
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-2" />
                        {agent.city || 'Location not specified'}, {agent.state || 'State not specified'}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Specialization:</strong> {agent.specialization}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Experience:</strong> {agent.experience_years} years
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Languages:</strong> {agent.languages?.join(', ')}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleContactAgent(agent)}
                        className="flex-1 bg-[#0ca5e9] text-white py-2 px-4 rounded-full hover:bg-[#2d4373] transition-all duration-200 font-semibold flex items-center justify-center text-sm shadow-md hover:shadow-lg"
                      >
                        <MessageCircle size={16} className="mr-2" />
                        Contact
                      </button>
                      <button
                        onClick={() => handleContactAgent(agent)}
                        className="flex-1 bg-[#3B5998] text-white py-2 px-4 rounded-full hover:bg-[#2d4373] transition-all duration-200 font-semibold flex items-center justify-center text-sm shadow-md hover:shadow-lg"
                      >
                        <Calendar size={16} className="mr-2" />
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Contact Agent Modal */}
      {showContactModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Contact {selectedAgent.first_name} {selectedAgent.last_name}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone size={20} className="text-[#90C641] mr-3" />
                  <span>{selectedAgent.phone_number}</span>
                </div>
                <div className="flex items-center">
                  <Mail size={20} className="text-[#90C641] mr-3" />
                  <span>{selectedAgent.email}</span>
                </div>
              </div>

              <form className="mt-6 space-y-4">
                <textarea
                  placeholder="Your message to the agent..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#90C641]"
                />
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#90C641] text-white py-2 rounded-lg hover:bg-[#7DAF35]"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Agents;