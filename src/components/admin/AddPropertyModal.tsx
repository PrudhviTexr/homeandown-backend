import React from 'react';
import RoleBasedPropertyForm from '../RoleBasedPropertyForm';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyAdded: () => void;
}

const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ 
  isOpen, 
  onClose, 
  onPropertyAdded 
}) => {
  return (
    <RoleBasedPropertyForm
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onPropertyAdded}
      mode="add"
    />
  );
};

export default AddPropertyModal;