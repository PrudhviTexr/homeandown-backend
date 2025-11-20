import React from 'react';
import { HelpCircle, Phone, Mail } from 'lucide-react';

const Help: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#061D58] mb-6 flex items-center">
        <HelpCircle className="mr-2 h-5 w-5" />
        Help & Support
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Contact Support</h4>
          <div className="space-y-3">
            <a href="tel:1800-123-4567" className="flex items-center text-[#90C641] hover:underline">
              <Phone size={16} className="mr-2" />
              1800-123-4567
            </a>
            <a href="mailto:agents@homeandown.com" className="flex items-center text-[#90C641] hover:underline">
              <Mail size={16} className="mr-2" />
              agents@homeandown.com
            </a>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Quick Links</h4>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">• Agent Training Materials</p>
            <p className="text-sm text-gray-600">• Commission Structure Guide</p>
            <p className="text-sm text-gray-600">• Customer Service Best Practices</p>
            <p className="text-sm text-gray-600">• Platform Usage Guidelines</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-4">Frequently Asked Questions</h4>
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-900 mb-1">How do I respond to a new assignment?</h5>
            <p className="text-sm text-gray-600">
              When you receive a new assignment, you'll get a notification. Go to the Assignments page to view details and accept or decline the assignment.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-1">How is my commission calculated?</h5>
            <p className="text-sm text-gray-600">
              For property sales, you earn 2% of the sale value. For rentals, you earn one month's rent as commission. Additional bonuses are available for high performance.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-1">What happens if I miss an assignment deadline?</h5>
            <p className="text-sm text-gray-600">
              Assignments expire after 24 hours if not responded to. This may affect your response rate metrics, so try to respond promptly to all assignments.
            </p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-1">How do I update my profile information?</h5>
            <p className="text-sm text-gray-600">
              Go to the Settings page to update your contact information, education background, and specialization. Note that your license number cannot be changed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;