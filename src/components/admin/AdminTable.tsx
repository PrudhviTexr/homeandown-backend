import { useState } from 'react';
import { 
  Search,
  Eye, 
  Filter, 
  RefreshCw, 
  Plus, 
  Printer, 
  Edit, 
  Trash2,
  UserPlus,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AdminTableProps {
  data: any[];
  columns: any[];
  title: string;
  onAdd?: () => void;
  onView?: (item: any) => void;
  onAssignAgent?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onRefresh: () => void;
}

const AdminTable = ({
  data,
  columns,
  title,
  onAdd,
  onView,
  onAssignAgent,
  onEdit,
  onDelete,
  onRefresh
}: AdminTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUserType, setFilterUserType] = useState('all');
  const [filterListingType, setFilterListingType] = useState('all');
  const [filterPropertyType, setFilterPropertyType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Apply filters
  let filteredData = data.filter(item => {
    const matchesSearch = Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    let matchesStatusFilter = true;
    if (filterStatus !== 'all') {
      // Get effective status: if verified but status is pending, treat as active
      const effectiveStatus = (item.verification_status === 'verified' && (item.status === 'pending' || !item.status))
        ? 'active'
        : (item.status || item.verification_status || 'pending');
      matchesStatusFilter = effectiveStatus === filterStatus || item.verification_status === filterStatus || item.status === filterStatus;
    }
    
    let matchesUserTypeFilter = true;
    if (filterUserType !== 'all' && item.user_type) {
      matchesUserTypeFilter = item.user_type === filterUserType;
    }

    let matchesListingTypeFilter = true;
    if (filterListingType !== 'all' && item.listing_type) {
      matchesListingTypeFilter = item.listing_type === filterListingType;
    }

    let matchesPropertyTypeFilter = true;
    if (filterPropertyType !== 'all' && item.property_type) {
      matchesPropertyTypeFilter = item.property_type === filterPropertyType;
    }
    
    return matchesSearch && matchesStatusFilter && matchesUserTypeFilter && matchesListingTypeFilter && matchesPropertyTypeFilter;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create CSV content with proper escaping
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escaped = String(value).replace(/"/g, '""');
          return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow print-section">
      {/* Header */}
      <div className="bg-[#3B5998] text-white p-3 sm:p-4 rounded-t-lg no-print">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg flex items-center text-sm"
            >
              <RefreshCw size={14} className={`mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            {onAdd && (
              <button
                onClick={onAdd}
                className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg flex items-center text-sm"
              >
                <Plus size={14} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add {title.slice(0, -1)}</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 sm:p-4 border-b border-gray-200 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 sm:px-3 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 ml-2">entries</span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => exportToCSV(filteredData, title.toLowerCase())}
                className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded text-sm hover:bg-green-600 flex items-center gap-1"
                aria-label="Download data as CSV file"
              >
                <Download size={12} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-500 text-white px-2 sm:px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center"
              >
                <Printer size={12} className="sm:w-3.5 sm:h-3.5 mr-1" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Filters */}
            <div className="flex items-center space-x-2">
              <Filter size={14} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 sm:px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
              
              {title === 'Users' && (
                <select
                  value={filterUserType}
                  onChange={(e) => {
                    setFilterUserType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              )}

              {title.includes('Properties') && (
                <>
                  <select
                    value={filterListingType}
                    onChange={(e) => {
                      setFilterListingType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Listing Types</option>
                    <option value="SALE">For Sale</option>
                    <option value="RENT">For Rent</option>
                  </select>

                  <select
                    value={filterPropertyType}
                    onChange={(e) => {
                      setFilterPropertyType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Property Types</option>
                    <option value="standalone_apartment">Standalone Apartment</option>
                    <option value="gated_apartment">Gated Apartment</option>
                    <option value="independent_house">Independent House</option>
                    <option value="villa">Villa</option>
                    <option value="farm_house">Farm House</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                    <option value="plot">Plot</option>
                  </select>
                </>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4">
          {paginatedData.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  {columns.slice(0, 3).map((column, colIndex) => (
                    <div key={colIndex} className="mb-2">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {column.header}:
                      </span>
                      <div className="text-sm text-gray-900 mt-1">
                        {column.render ? column.render(item) : item[column.key]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2 ml-4 no-print">
                  {onView && (
                    <button 
                      onClick={() => onView(item)} 
                      className="text-green-600 hover:text-green-900 p-2 hover:bg-green-100 rounded" 
                      title="View">
                      <Eye size={16} />
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)} 
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-100 rounded" 
                      title="Edit">
                      <Edit size={16} />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item.id || item)} 
                      className="text-red-600 hover:text-red-900 p-2 hover:bg-red-100 rounded" 
                      title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Show additional columns if there are more than 3 */}
              {columns.length > 3 && (
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {columns.slice(3).map((column, colIndex) => (
                      <div key={colIndex}>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column.header}:
                        </span>
                        <div className="text-sm text-gray-900 mt-1">
                          {column.render ? column.render(item) : item[column.key]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium no-print">
                                        <div className="flex space-x-1 lg:space-x-2">
                      {onView && (
                        <button 
                          onClick={() => onView(item)} 
                          className="text-green-600 hover:text-green-900 p-1 hover:bg-green-100 rounded" 
                          title="View">
                          <Eye size={16} />
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(item)} 
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded" 
                          title="Edit">
                          <Edit size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(item.id || item)} 
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-100 rounded" 
                          title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                      {/* Booking quick status actions */}
                      {item.status && item.hasOwnProperty('booking_date') && (
                        <>
                          {item.status !== 'confirmed' && item.status !== 'completed' && (
                            <button
                              onClick={async () => {
                                try {
                                  await (await import('@/services/pyApi')).AdminApi.updateBookingStatus(Number(item.id), 'confirmed');
                                  onRefresh();
                                } catch (e) { console.error(e); }
                              }}
                              className="text-green-600 hover:text-green-900 p-1 hover:bg-green-100 rounded"
                              title="Confirm"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {item.status === 'confirmed' && (
                            <button
                              onClick={async () => {
                                try {
                                  await (await import('@/services/pyApi')).AdminApi.updateBookingStatus(Number(item.id), 'completed');
                                  onRefresh();
                                } catch (e) { console.error(e); }
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded"
                              title="Complete"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                        </>
                      )}
                      {onAssignAgent && item.status !== 'completed' && (
                        <button
                          onClick={() => onAssignAgent(item)}
                          className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-100 rounded"
                          title="Assign Agent"
                        >
                          <UserPlus size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-200 no-print">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === page
                      ? 'bg-green-500 text-white border-green-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTable;