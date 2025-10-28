import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Users, Wrench, BarChart3, Shield, Phone, Mail, ArrowRight, Plus, Settings, FileText } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';

const PropertyManagement: React.FC = () => {
  const { user } = useAuth();
  const isSellerOrAgent = user && ['seller', 'agent'].includes(user.user_type?.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="property-management-page pt-24">
          {/* Header Section */}
        <section className="hero-section bg-gradient-to-br from-[#162e5a] to-[#0ca5e9] text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6">Property Management Services</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Comprehensive property management solutions for property owners and tenants
            </p>
            <div className="cta-buttons flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/about#contact"
                className="btn-primary bg-[#90C641] hover:bg-[#7ab02d] text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button 
                onClick={() => window.location.href = '/about#contact'}
                className="btn-secondary bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#162e5a] transition-colors"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Property Management Dashboard for Authenticated Users */}
        {isSellerOrAgent && (
          <section className="dashboard-access py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Your Property Management Dashboard</h2>
              <div className="dashboard-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link 
                  to="/my-properties"
                  className="dashboard-card bg-gradient-to-br from-[#162e5a] to-[#0ca5e9] text-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Home className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">My Properties</h3>
                  <p className="text-sm opacity-90">View and manage your properties</p>
                </Link>
                <Link 
                  to="/add-property"
                  className="dashboard-card bg-gradient-to-br from-[#90C641] to-[#7ab02d] text-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Plus className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Add Property</h3>
                  <p className="text-sm opacity-90">List a new property</p>
                </Link>
                <Link 
                  to="/property-management/maintenance"
                  className="dashboard-card bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] text-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Wrench className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Maintenance</h3>
                  <p className="text-sm opacity-90">Manage maintenance requests</p>
                </Link>
                <Link 
                  to="/property-management/add-nri-property"
                  className="dashboard-card bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] text-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">NRI Properties</h3>
                  <p className="text-sm opacity-90">Add NRI-specific properties</p>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Service Overview Cards */}
        <section className="services-overview py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Our Property Management Services</h2>
            <div className="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="service-card bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="icon text-4xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Tenant Management</h3>
                <p className="text-gray-600">Complete tenant screening, lease management, and communication</p>
              </div>
              <div className="service-card bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="icon text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Rent Collection</h3>
                <p className="text-gray-600">Automated rent collection, invoicing, and financial reporting</p>
              </div>
              <div className="service-card bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="icon text-4xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Maintenance Services</h3>
                <p className="text-gray-600">24/7 maintenance support and vendor coordination</p>
              </div>
              <div className="service-card bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className="icon text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">Property Analytics</h3>
                <p className="text-gray-600">Detailed reports and insights on property performance</p>
              </div>
            </div>
          </div>
        </section>

        {/* Coming Soon Preview */}
        <section className="coming-soon-preview py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Launching Soon - Property Management Platform</h2>
            <div className="coming-soon-mockup bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-6">🚀</div>
                <h3 className="text-2xl font-bold text-[#162e5a] mb-4">We're Building Something Amazing</h3>
                <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                  Our comprehensive property management platform is currently in development. 
                  We're creating a complete solution that will help property owners manage their investments 
                  with ease and efficiency.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="feature-preview bg-blue-50 rounded-lg p-6">
                    <div className="text-3xl mb-3">📊</div>
                    <h4 className="font-semibold text-[#162e5a] mb-2">Real-time Analytics</h4>
                    <p className="text-sm text-gray-600">Track your property performance with detailed insights</p>
                  </div>
                  <div className="feature-preview bg-green-50 rounded-lg p-6">
                    <div className="text-3xl mb-3">🏠</div>
                    <h4 className="font-semibold text-[#162e5a] mb-2">Property Management</h4>
                    <p className="text-sm text-gray-600">Complete management solution for all your properties</p>
                  </div>
                  <div className="feature-preview bg-purple-50 rounded-lg p-6">
                    <div className="text-3xl mb-3">👥</div>
                    <h4 className="font-semibold text-[#162e5a] mb-2">Tenant Portal</h4>
                    <p className="text-sm text-gray-600">Easy communication and service requests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Complete Property Management Solution</h2>
            <div className="features-grid grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="feature-item bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-4">🔍 Tenant Screening</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Background verification</li>
                  <li>• Credit score check</li>
                  <li>• Employment verification</li>
                  <li>• Previous rental history</li>
                </ul>
              </div>
              <div className="feature-item bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-4">📋 Lease Management</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Digital lease agreements</li>
                  <li>• Renewal notifications</li>
                  <li>• Security deposit tracking</li>
                  <li>• Legal compliance</li>
                </ul>
              </div>
              <div className="feature-item bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-4">💳 Payment Processing</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Online rent collection</li>
                  <li>• Multiple payment methods</li>
                  <li>• Late fee management</li>
                  <li>• Financial reporting</li>
                </ul>
              </div>
              <div className="feature-item bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-4">🛠️ Maintenance Coordination</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Work order management</li>
                  <li>• Vendor network</li>
                  <li>• Emergency repairs</li>
                  <li>• Preventive maintenance</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Get Started Today</h2>
            <div className="contact-cards grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="contact-card bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">📞</div>
                <h3 className="text-xl font-bold text-[#162e5a] mb-4">Call Us</h3>
                <p className="text-gray-600 mb-4">Speak with our property management experts</p>
                <a href="tel:9440946662" className="text-[#90C641] font-semibold text-lg hover:underline">
                  9440946662
                </a>
              </div>
              <div className="contact-card bg-white rounded-lg shadow-lg p-8 text-center border-4 border-[#90C641] relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#90C641] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Recommended
                </div>
                <div className="text-4xl mb-4">✉️</div>
                <h3 className="text-xl font-bold text-[#162e5a] mb-4">Email Us</h3>
                <p className="text-gray-600 mb-4">Get detailed information about our services</p>
                <a href="mailto:info@homeandown.com" className="text-[#90C641] font-semibold text-lg hover:underline">
                  info@homeandown.com
                </a>
              </div>
              <div className="contact-card bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-bold text-[#162e5a] mb-4">Schedule Consultation</h3>
                <p className="text-gray-600 mb-4">Book a free consultation to discuss your needs</p>
                <Link 
                  to="/about#contact"
                  className="btn-outline border-2 border-[#162e5a] text-[#162e5a] px-6 py-3 rounded-lg font-semibold hover:bg-[#162e5a] hover:text-white transition-colors w-full inline-block"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Owner Portal Preview */}
        <section className="owner-portal py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Property Owner Portal</h2>
            <div className="portal-features grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="feature-left">
                <h3 className="text-2xl font-semibold text-[#162e5a] mb-6">Real-time Property Insights</h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-[#90C641] mr-3" />
                    Monthly financial statements
                  </li>
                  <li className="flex items-center">
                    <Wrench className="w-5 h-5 text-[#90C641] mr-3" />
                    Maintenance request tracking
                  </li>
                  <li className="flex items-center">
                    <Users className="w-5 h-5 text-[#90C641] mr-3" />
                    Tenant communication logs
                  </li>
                  <li className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-[#90C641] mr-3" />
                    Property performance analytics
                  </li>
                  <li className="flex items-center">
                    <Home className="w-5 h-5 text-[#90C641] mr-3" />
                    Document management
                  </li>
                </ul>
              </div>
              <div className="portal-mockup bg-gradient-to-br from-[#162e5a] to-[#0ca5e9] rounded-lg p-8 text-white text-center">
                <div className="mockup-placeholder text-2xl font-semibold">Dashboard Mockup</div>
                <p className="mt-4 opacity-80">Interactive property management dashboard with real-time data and analytics</p>
              </div>
            </div>
                      </div>
        </section>

        {/* Tenant Portal Preview */}
        <section className="tenant-portal py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Tenant Portal</h2>
            <div className="portal-features grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="portal-mockup bg-gradient-to-br from-[#90C641] to-[#7ab02d] rounded-lg p-8 text-white text-center order-2 lg:order-1">
                <div className="mockup-placeholder text-2xl font-semibold">Tenant App Mockup</div>
                <p className="mt-4 opacity-80">User-friendly mobile app for tenants to manage their rental experience</p>
                    </div>
              <div className="feature-right order-1 lg:order-2">
                <h3 className="text-2xl font-semibold text-[#162e5a] mb-6">Easy Tenant Experience</h3>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[#90C641] rounded-full mr-3"></div>
                    Online rent payment
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[#90C641] rounded-full mr-3"></div>
                    Maintenance request submission
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[#90C641] rounded-full mr-3"></div>
                    Lease document access
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[#90C641] rounded-full mr-3"></div>
                    Communication with management
                  </li>
                  <li className="flex items-center">
                    <div className="w-5 h-5 bg-[#90C641] rounded-full mr-3"></div>
                    Payment history
                  </li>
                </ul>
                    </div>
                  </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="why-choose-us py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Why Choose Home & Own Property Management?</h2>
            <div className="benefits-grid grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="benefit-item bg-green-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">🌱 Eco-Friendly Initiative</h3>
                <p className="text-gray-600">We plant 1 tree for every property managed - Building a greener future</p>
                </div>
              <div className="benefit-item bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">💯 No Hidden Fees</h3>
                <p className="text-gray-600">Transparent pricing with no surprise charges or hidden costs</p>
                </div>
              <div className="benefit-item bg-purple-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">🚀 Technology-Driven</h3>
                <p className="text-gray-600">Modern property management software with mobile apps</p>
                </div>
              <div className="benefit-item bg-orange-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[#162e5a] mb-3">🏆 Local Expertise</h3>
                <p className="text-gray-600">Deep knowledge of Hyderabad, Visakhapatnam, and AP/Telangana markets</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section py-16 bg-gradient-to-br from-[#162e5a] to-[#0ca5e9] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8">Contact us today to learn more about our property management services</p>
            <div className="cta-buttons flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/about#contact"
                className="btn-primary bg-[#90C641] hover:bg-[#7ab02d] text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Contact Us Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                to="/about#contact"
                className="btn-secondary bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#162e5a] transition-colors"
              >
                Call Now
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#162e5a] mb-12">Frequently Asked Questions</h2>
            <div className="faq-items grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="faq-item bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-[#162e5a] mb-3">What's included in property management services?</h3>
                <p className="text-gray-600">Complete tenant management, rent collection, maintenance coordination, and financial reporting.</p>
              </div>
              <div className="faq-item bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-[#162e5a] mb-3">How do you screen tenants?</h3>
                <p className="text-gray-600">Comprehensive background checks, credit verification, employment confirmation, and reference checks.</p>
              </div>
              <div className="faq-item bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-[#162e5a] mb-3">What are your management fees?</h3>
                <p className="text-gray-600">Transparent pricing from 8-15% of monthly rent with no hidden charges.</p>
            </div>
          </div>
        </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default PropertyManagement;