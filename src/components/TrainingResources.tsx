import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Download, Play, FileText, Video, Image, 
  Search, Filter, Star, Clock, User, Calendar,
  ChevronRight, ChevronDown, ExternalLink
} from 'lucide-react';
import { getApiUrl } from '@/utils/backend';

interface TrainingResourcesProps {
  userType?: 'agent' | 'admin' | 'client';
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'presentation' | 'guide' | 'policy';
  category: 'onboarding' | 'sales' | 'legal' | 'technical' | 'policies';
  file_url: string;
  file_size: string;
  duration?: string;
  created_at: string;
  updated_at: string;
  author: string;
  tags: string[];
  is_featured: boolean;
  download_count: number;
  rating: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  resource_count: number;
}

const TrainingResources: React.FC<TrainingResourcesProps> = ({ userType = 'agent' }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedResource, setExpandedResource] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'rating'>('newest');

  useEffect(() => {
    fetchResources();
    fetchCategories();
  }, [userType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      const response = await fetch(getApiUrl('/api/training/resources'), { headers });
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      } else {
        // Fallback: create mock resources
        setResources(getMockResources());
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources(getMockResources());
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const apiKey = import.meta.env.VITE_PYTHON_API_KEY || 'g7lshzFb55RKuskTH0WOu_oC7MW5hNE1lmgS2wBflZCyHV6CUk9b4wxSjAnXYYXj';
      const headers = { 'X-API-Key': apiKey };

      const response = await fetch(getApiUrl('/api/training/categories'), { headers });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else {
        setCategories(getMockCategories());
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(getMockCategories());
    }
  };

  const getMockResources = (): Resource[] => [
    {
      id: '1',
      title: 'Agent Onboarding Guide',
      description: 'Complete guide for new agents covering company policies, procedures, and best practices.',
      type: 'document',
      category: 'onboarding',
      file_url: '/resources/agent-onboarding.pdf',
      file_size: '2.5 MB',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
      author: 'Training Team',
      tags: ['onboarding', 'policies', 'procedures'],
      is_featured: true,
      download_count: 156,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Sales Techniques Masterclass',
      description: 'Video training on effective sales techniques, objection handling, and closing strategies.',
      type: 'video',
      category: 'sales',
      file_url: '/resources/sales-techniques.mp4',
      file_size: '45.2 MB',
      duration: '1h 23m',
      created_at: '2025-01-10T14:30:00Z',
      updated_at: '2025-01-10T14:30:00Z',
      author: 'Sales Director',
      tags: ['sales', 'techniques', 'training'],
      is_featured: true,
      download_count: 89,
      rating: 4.9
    },
    {
      id: '3',
      title: 'Legal Compliance Handbook',
      description: 'Important legal requirements and compliance guidelines for real estate agents.',
      type: 'document',
      category: 'legal',
      file_url: '/resources/legal-compliance.pdf',
      file_size: '1.8 MB',
      created_at: '2025-01-05T09:15:00Z',
      updated_at: '2025-01-05T09:15:00Z',
      author: 'Legal Team',
      tags: ['legal', 'compliance', 'requirements'],
      is_featured: false,
      download_count: 67,
      rating: 4.6
    },
    {
      id: '4',
      title: 'Property Valuation Guide',
      description: 'Step-by-step guide to property valuation techniques and market analysis.',
      type: 'guide',
      category: 'technical',
      file_url: '/resources/property-valuation.pdf',
      file_size: '3.2 MB',
      created_at: '2025-01-01T11:45:00Z',
      updated_at: '2025-01-01T11:45:00Z',
      author: 'Valuation Expert',
      tags: ['valuation', 'market-analysis', 'technical'],
      is_featured: false,
      download_count: 134,
      rating: 4.7
    },
    {
      id: '5',
      title: 'Commission Structure Overview',
      description: 'Detailed explanation of commission rates, payment schedules, and bonus structures.',
      type: 'presentation',
      category: 'policies',
      file_url: '/resources/commission-structure.pptx',
      file_size: '5.1 MB',
      created_at: '2024-12-28T16:20:00Z',
      updated_at: '2024-12-28T16:20:00Z',
      author: 'Finance Team',
      tags: ['commission', 'payment', 'bonus'],
      is_featured: true,
      download_count: 98,
      rating: 4.5
    }
  ];

  const getMockCategories = (): Category[] => [
    {
      id: 'onboarding',
      name: 'Onboarding',
      description: 'Resources for new agents',
      icon: 'User',
      resource_count: 3
    },
    {
      id: 'sales',
      name: 'Sales Training',
      description: 'Sales techniques and strategies',
      icon: 'Star',
      resource_count: 5
    },
    {
      id: 'legal',
      name: 'Legal & Compliance',
      description: 'Legal requirements and compliance',
      icon: 'FileText',
      resource_count: 2
    },
    {
      id: 'technical',
      name: 'Technical Guides',
      description: 'Technical knowledge and skills',
      icon: 'BookOpen',
      resource_count: 4
    },
    {
      id: 'policies',
      name: 'Company Policies',
      description: 'Company policies and procedures',
      icon: 'FileText',
      resource_count: 3
    }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'popular':
        return b.download_count - a.download_count;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      case 'presentation': return <Image className="h-5 w-5" />;
      case 'guide': return <BookOpen className="h-5 w-5" />;
      case 'policy': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User className="h-5 w-5" />;
      case 'Star': return <Star className="h-5 w-5" />;
      case 'FileText': return <FileText className="h-5 w-5" />;
      case 'BookOpen': return <BookOpen className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      // In a real implementation, this would track downloads and serve the file
      console.log(`Downloading: ${resource.title}`);
      
      // Simulate download
      const link = document.createElement('a');
      link.href = resource.file_url;
      link.download = resource.title;
      link.click();
    } catch (error) {
      console.error('Error downloading resource:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Resources</h1>
          <p className="text-gray-600">Access training materials, guides, and policies</p>
        </div>
        <div className="text-sm text-gray-500">
          {resources.length} resources available
        </div>
      </div>

      {/* Featured Resources */}
      {resources.filter(r => r.is_featured).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.filter(r => r.is_featured).slice(0, 3).map((resource) => (
              <div key={resource.id} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getResourceIcon(resource.type)}
                    <span className="text-sm font-medium text-gray-900">{resource.title}</span>
                  </div>
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{resource.file_size}</span>
                  <button
                    onClick={() => handleDownload(resource)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.resource_count})
                </option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="document">Documents</option>
              <option value="video">Videos</option>
              <option value="presentation">Presentations</option>
              <option value="guide">Guides</option>
              <option value="policy">Policies</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
              selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                selectedCategory === category.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {getCategoryIcon(category.icon)}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.resource_count} resources</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resources List */}
      <div className="space-y-4">
        {sortedResources.map((resource) => (
          <div key={resource.id} className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{resource.author}</span>
                        <span>•</span>
                        <span>{formatDate(resource.created_at)}</span>
                        <span>•</span>
                        <span>{resource.file_size}</span>
                        {resource.duration && (
                          <>
                            <span>•</span>
                            <span>{resource.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{resource.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{resource.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download className="h-4 w-4" />
                      <span>{resource.download_count} downloads</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated {formatDate(resource.updated_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setExpandedResource(
                      expandedResource === resource.id ? null : resource.id
                    )}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {expandedResource === resource.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDownload(resource)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              
              {expandedResource === resource.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Resource Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Type:</strong> {resource.type}</p>
                        <p><strong>Category:</strong> {resource.category}</p>
                        <p><strong>File Size:</strong> {resource.file_size}</p>
                        {resource.duration && <p><strong>Duration:</strong> {resource.duration}</p>}
                        <p><strong>Created:</strong> {formatDate(resource.created_at)}</p>
                        <p><strong>Updated:</strong> {formatDate(resource.updated_at)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                      <div className="space-y-2">
                        <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                          Download Resource
                        </button>
                        <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                          View Online
                        </button>
                        <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                          Share Resource
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  );
};

export default TrainingResources;
