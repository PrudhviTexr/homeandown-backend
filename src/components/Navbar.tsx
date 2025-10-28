import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NotificationsApi } from '@/services/pyApi';
import AuthModal from './AuthModal';
import PasswordChangeModal from './PasswordChangeModal';
import BankDetailsModal from './auth/BankDetailsModal';
import EmailVerificationBanner from './EmailVerificationBanner';
import ScrollingBanner from '@/components/ScrollingBanner';
import HomeandownLogo from '../assets/Homeandown-logo.png';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, getUserProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalType, setAuthModalType] = useState<'buyer' | 'seller' | 'agent'>('buyer');
  const [authRedirectTo, setAuthRedirectTo] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Build nav items based on user type
  const getNavigationItems = async () => {
    if (!user) {
      return {
        main: [
          { label: 'Buy', to: '/buy', userType: 'buyer' as const },
          { label: 'Rent', to: '/rent', userType: 'buyer' as const },
          { label: 'Sell', to: '/sell', userType: 'seller' as const },
          { label: 'Agent', to: '/agents', userType: 'agent' as const },
          { label: 'Property Management', to: '/property-management' },
        ],
        footer: [
          { label: 'About', to: '/about' },
        ],
      };
    }

    // Use cached user from context to avoid network call; fall back to fetching
    // only when some profile fields are missing.
    const userType = (user as any)?.user_type || (await getUserProfile(true))?.user_type || 'buyer';

    switch (userType) {
      case 'buyer':
        return {
          main: [
            { label: 'Buy', to: '/buy' },
            { label: 'Rent', to: '/rent' },
            { label: 'My Bookings', to: '/my-bookings' },
            { label: 'My Inquiries', to: '/my-inquiries' },
            { label: 'Property Management', to: '/property-management' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
      case 'seller':
        return {
          main: [
            { label: 'My Properties', to: '/my-properties' },
            { label: 'Add Property', to: '/add-property' },
            { label: 'Property Management', to: '/property-management' },
            { label: 'Inquiries', to: '/property-inquiries' },
            { label: 'Bookings', to: '/property-bookings' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
      case 'agent':
        return {
          main: [{ label: 'Dashboard', to: '/agent/dashboard' }],
          footer: [{ label: 'About', to: '/about' }],
        };
      case 'admin':
        return {
          main: [
            { label: 'Dashboard', to: '/admin' },
            { label: 'Users', to: '/admin/users' },
            { label: 'Properties', to: '/admin/properties' },
            { label: 'Reports', to: '/admin/reports' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
      default:
        return {
          main: [
            { label: 'Buy', to: '/buy' },
            { label: 'Rent', to: '/rent' },
            { label: 'Property Management', to: '/property-management' },
          ],
          footer: [{ label: 'About', to: '/about' }],
        };
    }
  };

  const [mainNavItems, setMainNavItems] = useState<any[]>([]);
  const [footerNavItems, setFooterNavItems] = useState<any[]>([]);

  // Load unread notifications count
  useEffect(() => {
    if (user?.id) {
      const loadUnreadCount = async () => {
        try {
          const response = await NotificationsApi.list(user.id);
          const notifications = response.data || response || [];
          const unread = notifications.filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error('Error loading notifications count:', error);
        }
      };
      loadUnreadCount();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    const loadNavItems = async () => {
      const items = await getNavigationItems();
      setMainNavItems(items.main);
      setFooterNavItems(items.footer);
    };
    loadNavItems();
  }, [user]);

  // Load profile to show first name in the header
  const [displayName, setDisplayName] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      if (!user) { setDisplayName(null); return; }
      try {
        const profile = await getUserProfile();
        if (profile?.first_name) setDisplayName(profile.first_name);
        else setDisplayName(user.email?.split('@')[0] || null);
      } catch (e) {
        setDisplayName(user.email?.split('@')[0] || null);
      }
    })();
  }, [user]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = (item: any, e: React.MouseEvent) => {
    if (!user && item.userType) {
      e.preventDefault();
      setAuthModalType(item.userType);
      setAuthRedirectTo(item.to);
      setShowAuthModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate('/');
      }, 100);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Close user menu on outside click
  useEffect(() => {
    if (showUserMenu) {
      const onClick = (e: MouseEvent) => {
        if (!(e.target as Element).closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [showUserMenu]);

  return (
    <>
      {/* Scrolling Banner - Above Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <ScrollingBanner />
      </div>

      <div className="fixed inset-x-0 top-0 z-50">
        <div className="w-full">
          <EmailVerificationBanner />

          <header className="fixed inset-x-0 top-[44px] z-40">
            <div className="container mx-auto px-4">
              <div className="bg-white border-2 border-[#0ca5e9] rounded-full shadow-lg flex items-center justify-between px-4 py-2 max-w-5xl mx-auto">
                <Link
                  to="/"
                  className="flex-shrink-0 mr-4 relative rounded"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  aria-label="Home & Own - Go to homepage"
                >
                  <div>
                    <img src={HomeandownLogo} alt='Homeandown' className="w-28" />
                  </div>
                </Link>

                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-gray-700 hover:text-[#0ca5e9] focus:ring-2 focus:ring-[#0ca5e9] focus:outline-none p-1 rounded"
                    aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                    aria-expanded={mobileMenuOpen}
                    aria-controls="mobile-navigation"
                  >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  </button>
                </div>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex flex-1 items-center justify-center">
                  <div className="flex items-center space-x-1 lg:space-x-6">
                    {mainNavItems.map(item =>
                      user || item.to === '/property-management' ? (
                        <Link
                          key={item.to}
                          to={item.to}
                          className="text-gray-800 font-medium hover:text-[#0ca5e9] transition-colors text-sm lg:text-base px-3 py-2 rounded-md hover:bg-gray-50 nav-link"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          key={item.to}
                          onClick={(e) => {
                            handleNavClick(item, e);
                            setAuthRedirectTo(item.to);
                          }}
                          className="text-gray-800 font-medium hover:text-[#0ca5e9] transition-colors text-sm lg:text-base px-3 py-2 rounded-md hover:bg-gray-50 nav-link"
                        >
                          {item.label}
                        </button>
                      )
                    )}
                    {footerNavItems.map(item => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="text-gray-800 font-medium hover:text-[#0ca5e9] transition-colors text-sm lg:text-base px-3 py-2 rounded-md hover:bg-gray-50 nav-link"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                {/* User Menu */}
                <div className="relative ml-2 md:ml-4 flex items-center space-x-2">
                  {user && (
                    <button
                      onClick={() => navigate('/notifications')}
                      className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      title="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                  )}
                  {user ? (
                    <div className="relative user-menu-container">
                      <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center space-x-2 bg-[#162e5a] text-white px-3 py-2 rounded-full hover:bg-[#0ca5e9] transition-colors shadow-md"
                      >
                        <User className="h-5 w-5" />
                        <span className="hidden sm:inline text-sm font-medium">
                          {displayName || user.email}
                        </span>
                      </button>

                      {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate('/profile');
                            }}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                          >
                            <User size={16} className="mr-2" />
                            Profile
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate('/wishlist');
                            }}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                          >
                            <span className="mr-2">❤️</span>
                            Wishlist
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              navigate('/notifications');
                            }}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                          >
                            <Bell size={16} className="mr-2" />
                            Notifications
                            {unreadCount > 0 && (
                              <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordModal(true);
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                          >
                            <Settings size={16} className="mr-2" />
                            Change Password
                          </button>
                          {user.user_type === 'agent' && (
                            <button
                              onClick={() => {
                                setShowBankModal(true);
                                setShowUserMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                            >
                              <CreditCard size={16} className="mr-2" />
                              Bank Details
                            </button>
                          )}
                          <div className="border-t border-gray-100" />
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors flex items-center"
                          >
                            <LogOut size={16} className="mr-2" />
                            Log Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthModalType('buyer');
                        setShowAuthModal(true);
                      }}
                      className="bg-[#0ca5e9] text-white px-4 py-2 rounded-full hover:bg-[#162e5a] transition-colors flex items-center space-x-2 shadow-md"
                    >
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline text-sm font-medium">Sign In</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div
                id="mobile-navigation"
                className="md:hidden bg-white shadow-lg mt-2 rounded-lg max-w-5xl mx-auto overflow-hidden z-50"
                role="navigation"
                aria-label="Mobile navigation menu"
              >
                <div className="py-2">
                  {mainNavItems.map(item => (
                    <div key={item.to} className="px-4">
                      {user || item.to === '/property-management' ? (
                        <Link
                          to={item.to}
                          className="block py-3 text-gray-800 font-medium hover:text-[#0ca5e9] border-b border-gray-100"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          onClick={e => {
                            handleNavClick(item, e);
                            setAuthRedirectTo(item.to);
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full text-left py-3 text-gray-800 font-medium hover:text-[#0ca5e9] border-b border-gray-100"
                        >
                          {item.label}
                        </button>
                      )}
                    </div>
                  ))}
                  {footerNavItems.map(item => (
                    <div key={item.to} className="px-4">
                      <Link
                        to={item.to}
                        className="block py-3 text-gray-800 font-medium hover:text-[#0ca5e9] border-b border-gray-100"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {item.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </header>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setAuthRedirectTo('');
          }}
          userType={authModalType}
          redirectTo={authRedirectTo}
        />

        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />

        <BankDetailsModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          onSuccess={() => {
            toast.success('Bank details updated successfully!');
          }}
        />
      </div>
    </>
  );
};

export default Navbar;

import toast from 'react-hot-toast';