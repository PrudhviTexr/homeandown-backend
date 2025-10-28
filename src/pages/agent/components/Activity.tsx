import React from 'react';
import { Calendar, MessageCircle } from 'lucide-react';

interface ActivityProps {
  dashboardStats: any;
}

const Activity: React.FC<ActivityProps> = ({ dashboardStats }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-6 flex items-center">
        <Calendar className="mr-2 h-5 w-5" />
        Recent Activity
      </h3>
      
      {dashboardStats?.recentContacts && dashboardStats.recentContacts.length > 0 ? (
        <div className="space-y-4">
          {dashboardStats.recentContacts.slice(0, 10).map((activity: any, index: number) => {
            const isBooking = activity.booking_date !== undefined;
            const propertyTitle = isBooking 
              ? activity.properties?.title 
              : activity.properties?.title;
            const customerName = isBooking
              ? `${activity.users?.first_name || ''} ${activity.users?.last_name || ''}`
              : activity.name;
            
            return (
            <div key={index} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-blue-400">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                  isBooking ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {isBooking ? 
                    <Calendar className="h-5 w-5 text-blue-600" /> : 
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {customerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isBooking ? 'Requested a tour for' : 'Sent an inquiry about'} <span className="font-medium">{propertyTitle}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isBooking ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isBooking ? 'Tour Request' : 'Inquiry'}
                </span>
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No recent activity</p>
          <p className="text-sm">New inquiries and bookings will appear here</p>
        </div>
      )}

      {dashboardStats?.todayContacts && dashboardStats.todayContacts.length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold text-gray-800 mb-4 border-b pb-2">Today's Activity</h4>
          <div className="space-y-4">
            {dashboardStats.todayContacts.map((activity: any, index: number) => {
              const isBooking = activity.booking_date !== undefined;
              return (
                <div key={`today-${index}`} className="flex items-center py-2 px-3 bg-blue-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    isBooking ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {isBooking ? 
                      <Calendar className="h-4 w-4 text-blue-600" /> : 
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isBooking 
                        ? `New booking for ${activity.properties?.title}` 
                        : `New inquiry about ${activity.properties?.title}`
                      }
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;