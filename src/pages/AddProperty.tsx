import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import RoleBasedPropertyForm from '../components/RoleBasedPropertyForm';

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(true);

  const handleClose = () => {
    setShowForm(false);
    navigate(-1); // Go back to previous page
  };

  const handleSuccess = () => {
    setShowForm(false);
    navigate('/my-properties'); // Navigate to properties list after success
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-gray-600 mt-1">List your property on Home & Own</p>
          </div>

          {/* Property Form - Using RoleBasedPropertyForm (same as agent/admin) */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <RoleBasedPropertyForm
              isOpen={showForm}
              onClose={handleClose}
              onSuccess={handleSuccess}
              mode="add"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddProperty;
