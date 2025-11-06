import { useState, useEffect, useCallback } from 'react';
import { EntertainmentService, type EntertainmentItem, type EntertainmentStats } from '../lib/entertainmentService';

const EntertainmentManagement = () => {
  const [entertainments, setEntertainments] = useState<EntertainmentItem[]>([]);
  const [filteredEntertainments, setFilteredEntertainments] = useState<EntertainmentItem[]>([]);
  const [stats, setStats] = useState<EntertainmentStats>({
    totalContent: 0,
    totalVideos: 0,
    totalAudio: 0,
    storageUsed: 0,
    totalStorage: 24,
    activeCount: 0,
    inactiveCount: 0,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Video' | 'Audio'>('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EntertainmentItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Video' as 'Video' | 'Audio',
    description: '',
    category: '',
    mood_states: [] as string[],
    mediaFile: null as File | null,
    coverFile: null as File | null,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Categories based on type
  const videoCategories = [
    'Breathing Exercises',
    'Progressive Muscle Relaxation',
    'Guided Mindfulness Meditation',
    'Guided Visualization',
    'Yoga/Stretching for Stress Relief',
    'Grounding Techniques',
  ];

  const audioCategories = [
    'Calming Music',
    'Binaural Beats',
    'Guided Sleep Meditations',
    'White/Brown Noise',
    'Positive Affirmations Audio',
  ];

  const allCategories = [...videoCategories, ...audioCategories];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEntertainments();
  }, [entertainments, searchQuery, selectedType, selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [entertainmentsData, statsData] = await Promise.all([
        EntertainmentService.getAllEntertainments(),
        EntertainmentService.getEntertainmentStats(),
      ]);
      setEntertainments(entertainmentsData);
      setStats(statsData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filterEntertainments = useCallback(() => {
    let filtered = entertainments;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredEntertainments(filtered);
  }, [entertainments, searchQuery, selectedType, selectedCategory]);

  const handleTypeFilter = (type: 'all' | 'Video' | 'Audio') => {
    setSelectedType(type);
    setSelectedCategory(''); // Reset category when type changes
  };

  const handleAddEntertainment = () => {
    setFormData({
      title: '',
      type: 'Video',
      description: '',
      category: '',
      mood_states: [],
      mediaFile: null,
      coverFile: null,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditEntertainment = (item: EntertainmentItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };


const handleDeleteEntertainment = async (id: number, mediaFileUrl: string | null, coverImgUrl: string | null) => {
  if (!confirm('Are you sure you want to delete this entertainment item? This will also remove the associated files from storage.')) {
    return;
  }

  try {
    // Delete files from storage first
    if (mediaFileUrl) {
      const fileName = mediaFileUrl.split('/').pop();
      if (fileName) {
        await EntertainmentService.deleteFile('entertainment-media', fileName);
      }
    }
    if (coverImgUrl) {
      const fileName = coverImgUrl.split('/').pop();
      if (fileName) {
        await EntertainmentService.deleteFile('entertainment-covers', fileName);
      }
    }

    // Delete from database
    await EntertainmentService.deleteEntertainment(id);
    await fetchData(); // Refresh the list
  } catch (error) {
    console.error('Error deleting entertainment:', error);
    setError('Failed to delete entertainment item');
  }
};

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.mediaFile) errors.mediaFile = 'Media file is required';
    if (formData.mood_states.length === 0) errors.mood_states = 'At least one mood state is required';

    // Validate file types
    if (formData.mediaFile) {
      const allowedMediaTypes = ['video/mp4', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'video/avi', 'video/mov', 'video/wmv'];
      if (!allowedMediaTypes.includes(formData.mediaFile.type)) {
        errors.mediaFile = 'Invalid file type. Please upload MP4, MP3, WAV, AVI, MOV, or WMV files.';
      }
    }

    if (formData.coverFile) {
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedImageTypes.includes(formData.coverFile.type)) {
        errors.coverFile = 'Invalid image type. Please upload JPG, PNG, GIF, or WebP files.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setUploading(true);
    try {
      let mediaUrl = '';
      let coverUrl = '';

      // Upload media file
      if (formData.mediaFile) {
        const mediaFileName = `${Date.now()}_${formData.mediaFile.name}`;
        mediaUrl = await EntertainmentService.uploadFile('entertainment-media', formData.mediaFile, mediaFileName);
      }

      // Upload cover image
      if (formData.coverFile) {
        const coverFileName = `${Date.now()}_${formData.coverFile.name}`;
        coverUrl = await EntertainmentService.uploadFile('entertainment-covers', formData.coverFile, coverFileName);
      }

      // Create entertainment record
      await EntertainmentService.createEntertainment({
        title: formData.title,
        type: formData.type,
        description: formData.description,
        category: formData.category,
        mood_states: formData.mood_states,
        media_file_url: mediaUrl,
        cover_img_url: coverUrl,
      });

      setShowAddModal(false);
      await fetchData(); // Refresh the list and stats
    } catch (error) {
      console.error('Error creating entertainment:', error);
      setError('Failed to create entertainment item');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (field: 'mediaFile' | 'coverFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMoodStateChange = (moodState: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      mood_states: checked
        ? [...prev.mood_states, moodState]
        : prev.mood_states.filter(state => state !== moodState)
    }));
    if (formErrors.mood_states) {
      setFormErrors(prev => ({ ...prev, mood_states: '' }));
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'Video' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ● Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        ○ Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Entertainment</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage CBT Resources & Therapeutic Content
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddEntertainment}
                className="btn-primary flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Entertainment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Content Count */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Content Count</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                Videos: {stats.totalVideos} Audio: {stats.totalAudio}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total: {stats.totalContent} items</p>
            </div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.storageUsed}/{stats.totalStorage} GB
              </p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{stats.storageUsed} GB of {stats.totalStorage} GB</span>
                  <span>{Math.round((stats.storageUsed / stats.totalStorage) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((stats.storageUsed / stats.totalStorage) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status Summary</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.activeCount} Active / {stats.inactiveCount} Inactive
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalContent > 0 ? Math.round((stats.activeCount / stats.totalContent) * 100) : 0}% active rate
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Date(stats.lastUpdated).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(stats.lastUpdated).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6 sm:p-6">
          {/* Add space between filters and table */}
          <div className="mb-6">
            <div className="flex flex-col space-y-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-lg">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="input-field pl-10 pr-4"
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Category Dropdown */}
                <div className="flex-1 max-w-xs">
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input-field max-h-40 overflow-y-auto"
                    >
                      <option value="">All Categories</option>
                      {allCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type Toggle Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTypeFilter('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      selectedType === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({stats.totalContent})
                  </button>
                  <button
                    onClick={() => handleTypeFilter('Video')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      selectedType === 'Video'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Videos ({stats.totalVideos})
                  </button>
                  <button
                    onClick={() => handleTypeFilter('Audio')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      selectedType === 'Audio'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Audio ({stats.totalAudio})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Table */}
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cover
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mood States
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntertainments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchQuery || selectedType !== 'all' || selectedCategory ? 'No content found' : 'No entertainment content yet'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery || selectedType !== 'all' || selectedCategory ? 'Try adjusting your filters.' : 'Add your first CBT resource to get started.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntertainments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                          {item.cover_img_url ? (
                            <img
                              src={item.cover_img_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center">No Image</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.media_file_url ? item.media_file_url.split('/').pop() : 'No file'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'Video' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1">{item.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.mood_states.slice(0, 3).map((state, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {state}
                            </span>
                          ))}
                          {item.mood_states.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{item.mood_states.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEntertainment(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEntertainment(item.id, item.media_file_url, item.cover_img_url)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Entertainment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Add New Entertainment</h3>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`input-field ${formErrors.title ? 'border-red-500' : ''}`}
                      placeholder="Enter entertainment title"
                    />
                    {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'Video' | 'Audio' }))}
                      className="input-field"
                    >
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows={3}
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`input-field ${formErrors.category ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a category</option>
                    {allCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                </div>

                {/* Mood States */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mood States *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      'Neutral/Calm',
                      'Happy/Positive',
                      'Depressed/Sad',
                      'Stressed/Anxious',
                      'Angry/Frustrated',
                      'Excited/Energetic',
                      'Confused/Uncertain',
                      'Mixed/No Clear Pattern'
                    ].map(state => (
                      <label key={state} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.mood_states.includes(state)}
                          onChange={(e) => handleMoodStateChange(state, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{state}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.mood_states && <p className="text-red-500 text-xs mt-1">{formErrors.mood_states}</p>}
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Media File *</label>
                    <input
                      type="file"
                      accept=".mp3,.mp4,.wav,.avi,.mov,.wmv,audio/*,video/*"
                      onChange={(e) => handleFileChange('mediaFile', e.target.files?.[0] || null)}
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${formErrors.mediaFile ? 'border-red-500' : ''}`}
                    />
                    {formErrors.mediaFile && <p className="text-red-500 text-xs mt-1">{formErrors.mediaFile}</p>}
                    <p className="text-xs text-gray-500 mt-1">Supported: MP4, MP3, WAV, AVI, MOV, WMV</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
                      onChange={(e) => handleFileChange('coverFile', e.target.files?.[0] || null)}
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 ${formErrors.coverFile ? 'border-red-500' : ''}`}
                    />
                    {formErrors.coverFile && <p className="text-red-500 text-xs mt-1">{formErrors.coverFile}</p>}
                    <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, GIF, WebP (optional)</p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2"
                    disabled={uploading}
                  >
                    {uploading && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{uploading ? 'Uploading...' : 'Add Entertainment'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Entertainment</h3>
              <p className="text-sm text-gray-500 mb-4">
                Edit functionality will allow updating type, category, mood states, and status.
                Changes will automatically sync with the database.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntertainmentManagement;