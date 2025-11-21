import React, { useEffect, useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { pyFetch } from '@/utils/backend';

interface UserInfoProps {
  userId: string;
}

interface UserData {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  user_type?: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ userId }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await pyFetch(`/api/users/${userId}`, {
          method: 'GET',
          useApiKey: false,
        });
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500">Owner information not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#3B5998] flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {userData.first_name} {userData.last_name}
          </h4>
          {userData.user_type && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mb-3">
              {userData.user_type.charAt(0).toUpperCase() + userData.user_type.slice(1)}
            </span>
          )}
          <div className="space-y-2">
            {userData.email && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span>{userData.email}</span>
              </div>
            )}
            {userData.phone_number && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{userData.phone_number}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
