import React from 'react';
import { TrendingUp, Clock, Star, Target } from 'lucide-react';

interface PerformanceProps {
  dashboardStats: any;
}

const Performance: React.FC<PerformanceProps> = ({ dashboardStats }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#061D58]">Performance Metrics</h3>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-600">{dashboardStats?.performance?.conversionRate || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-green-600">{dashboardStats?.performance?.responseTime || 'N/A'}</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Customer Rating</p>
              <div className="flex items-center">
                {renderStars(dashboardStats?.performance?.customerRating || 0)}
                <span className="ml-2 text-xl font-bold text-yellow-600">{dashboardStats?.performance?.customerRating || 0}</span>
              </div>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Assignments</p>
              <p className="text-2xl font-bold text-purple-600">{dashboardStats?.performance?.activeAssignments || 0}</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Performance Insights</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Assignment Acceptance Rate</span>
            <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${dashboardStats?.performance?.conversionRate || 0}%` }}
              ></div>
            </div>
            <span className="text-gray-700 font-medium">{dashboardStats?.performance?.conversionRate || 0}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Customer Satisfaction</span>
            <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${(dashboardStats?.performance?.customerRating / 5) * 100 || 0}%` }}
              ></div>
            </div>
            <span className="text-gray-700 font-medium">{dashboardStats?.performance?.customerRating || 0}/5</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Response Time</span>
            <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-yellow-600 h-2.5 rounded-full" 
                style={{ width: '85%' }}
              ></div>
            </div>
            <span className="text-gray-700 font-medium">85%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;