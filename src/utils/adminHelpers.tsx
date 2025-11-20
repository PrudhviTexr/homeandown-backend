import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    inactive: { color: 'bg-red-100 text-red-800', icon: XCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    new: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    responded: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const formatCurrency = (amount: number | null) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const getUserTypeColor = (userType: string) => {
  const colors = {
    admin: 'bg-red-100 text-red-800',
    agent: 'bg-purple-100 text-purple-800',
    seller: 'bg-green-100 text-green-800',
    buyer: 'bg-blue-100 text-blue-800'
  };
  return colors[userType as keyof typeof colors] || colors.buyer;
};