import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedPropertyForm from './UnifiedPropertyForm';

interface RoleBasedPropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  property?: any;
  mode: 'add' | 'edit';
}

const RoleBasedPropertyForm: React.FC<RoleBasedPropertyFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  property,
  mode
}) => {
  const { user } = useAuth();

  // Determine user role
  const getUserRole = (): 'seller' | 'agent' | 'admin' => {
    if (!user) return 'seller';
    
    const userType = user.user_type?.toLowerCase();
    if (userType === 'admin') return 'admin';
    if (userType === 'agent') return 'agent';
    return 'seller';
  };

  const userRole = getUserRole();

  // Role-based feature configuration
  const getRoleFeatures = () => {
    switch (userRole) {
      case 'admin':
        return {
          canAssignOwner: true,
          canSetFeatured: true,
          canSetVerified: true,
          canDelete: true,
          canViewAllProperties: true
        };
      case 'agent':
        return {
          canAssignOwner: true,
          canSetFeatured: false,
          canSetVerified: false,
          canDelete: true,
          canViewAllProperties: false
        };
      case 'seller':
      default:
        return {
          canAssignOwner: false,
          canSetFeatured: false,
          canSetVerified: false,
          canDelete: false,
          canViewAllProperties: false
        };
    }
  };

  const roleFeatures = getRoleFeatures();

  return (
    <UnifiedPropertyForm
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      property={property}
      mode={mode}
      userRole={userRole}
      roleFeatures={roleFeatures}
    />
  );
};

export default RoleBasedPropertyForm;
