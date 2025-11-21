import React from 'react';

interface SellerHeaderProps {
  title: string;
  subtitle?: string;
  showAddProperty?: boolean;
  rightAction?: React.ReactNode;
}

const SellerHeader: React.FC<SellerHeaderProps> = ({
  title,
  subtitle,
  rightAction
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {rightAction && (
            <div className="flex items-center space-x-4">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;
