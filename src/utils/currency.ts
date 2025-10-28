// Currency formatting utilities for Indian market
export const formatIndianCurrency = (amount: number | null): string => {
  if (!amount || amount === 0) return '₹0';
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10000000) { // 1 crore and above
    const crores = absAmount / 10000000;
    return `₹${crores.toFixed(crores >= 100 ? 0 : 1)} Cr`;
  } else if (absAmount >= 100000) { // 1 lakh and above
    const lakhs = absAmount / 100000;
    return `₹${lakhs.toFixed(lakhs >= 100 ? 0 : 1)} L`;
  } else if (absAmount >= 1000) { // 1 thousand and above
    const thousands = absAmount / 1000;
    return `₹${thousands.toFixed(0)}K`;
  } else {
    return `₹${absAmount.toLocaleString('en-IN')}`;
  }
};

export const formatRent = (amount: number | null): string => {
  if (!amount || amount === 0) return '₹0/month';
  return `${formatIndianCurrency(amount)}/month`;
};

export const formatDeposit = (amount: number | null): string => {
  if (!amount || amount === 0) return '₹0 deposit';
  return `${formatIndianCurrency(amount)} deposit`;
};

// Examples:
// 50000 -> ₹50K
// 500000 -> ₹5 L
// 5000000 -> ₹50 L
// 50000000 -> ₹5 Cr
// 150000000 -> ₹15 Cr