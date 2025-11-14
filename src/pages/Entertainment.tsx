import { useState, useEffect, useCallback } from "react";
import {
  EntertainmentService,
  type EntertainmentItem,
  type EntertainmentStats,
} from "../lib/entertainmentService";

const EntertainmentManagement = () => {
  const [entertainments, setEntertainments] = useState<EntertainmentItem[]>([]);
  const [filteredEntertainments, setFilteredEntertainments] = useState<
    EntertainmentItem[]
  >([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "Video" | "Audio">(
    "all"
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EntertainmentItem | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "Video" as "Video" | "Audio",
    description: "",
    category: "",
    mood_states: [] as string[],
    mediaFile: null as File | null,
    coverFile: null as File | null,
  });
  const [formDataEdit, setFormDataEdit] = useState({
    title: "",
    type: "Video" as "Video" | "Audio",
    description: "",
    category: "",
    mood_states: [] as string[],
    status: "active" as "active" | "inactive",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formErrorsEdit, setFormErrorsEdit] = useState<Record<string, string>>(
    {}
  );
  const [updating, setUpdating] = useState(false);

  // Categories based on type
  const videoCategories = [
    "Breathing Exercises",
    "Progressive Muscle Relaxation",
    "Guided Mindfulness Meditation",
    "Guided Visualization",
    "Yoga/Stretching for Stress Relief",
    "Grounding Techniques",
  ];

  const audioCategories = [
    "Calming Music",
    "Binaural Beats",
    "Guided Sleep Meditations",
    "White/Brown Noise",
    "Positive Affirmations Audio",
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
      const errorMsg =
        error instanceof Error ? error.message : "Failed to fetch data";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filterEntertainments = useCallback(() => {
    let filtered = entertainments;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    setFilteredEntertainments(filtered);
  }, [entertainments, searchQuery, selectedType, selectedCategory]);

  const handleTypeFilter = (type: "all" | "Video" | "Audio") => {
    setSelectedType(type);
    setSelectedCategory(""); // Reset category when type changes
  };

  const handleAddEntertainment = () => {
    setFormData({
      title: "",
      type: "Video",
      description: "",
      category: "",
      mood_states: [],
      mediaFile: null,
      coverFile: null,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditEntertainment = (item: EntertainmentItem) => {
    setEditingItem(item);
    setFormDataEdit({
      title: item.title,
      type: item.type as "Video" | "Audio",
      description: item.description || "",
      category: item.category,
      mood_states: [...item.mood_states],
      status: item.status as "active" | "inactive",
    });
    setFormErrorsEdit({});
    setShowEditModal(true);
  };

  const handleDeleteEntertainment = async (
    id: number,
    mediaFileUrl: string | null,
    coverImgUrl: string | null
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this entertainment item? This will also remove the associated files from storage."
      )
    ) {
      return;
    }

    try {
      setError(null);
      // Delete files from storage first
      if (mediaFileUrl) {
        // Extract filename from the complete URL by getting everything after the last occurrence of /media/ or /covers/
        const mediaMatch = mediaFileUrl.match(/\/media\/(.+)$/);
        if (mediaMatch && mediaMatch[1]) {
          await EntertainmentService.deleteFile("media", decodeURIComponent(mediaMatch[1]));
        }
      }
      if (coverImgUrl) {
        const coverMatch = coverImgUrl.match(/\/covers\/(.+)$/);
        if (coverMatch && coverMatch[1]) {
          await EntertainmentService.deleteFile("covers", decodeURIComponent(coverMatch[1]));
        }
      }

      // Delete from database
      await EntertainmentService.deleteEntertainment(id);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error deleting entertainment:", error);
      setError(`Failed to delete entertainment item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.category.trim()) errors.category = "Category is required";
    if (!formData.mediaFile) errors.mediaFile = "Media file is required";
    if (formData.mood_states.length === 0)
      errors.mood_states = "At least one mood state is required";

    // Validate file types
    if (formData.mediaFile) {
      const allowedMediaTypes = [
        "video/mp4",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "video/avi",
        "video/mov",
        "video/wmv",
      ];
      if (!allowedMediaTypes.includes(formData.mediaFile.type)) {
        errors.mediaFile =
          "Invalid file type. Please upload MP4, MP3, WAV, AVI, MOV, or WMV files.";
      }
    }

    if (formData.coverFile) {
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedImageTypes.includes(formData.coverFile.type)) {
        errors.coverFile =
          "Invalid image type. Please upload JPG, PNG, GIF, or WebP files.";
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
      let mediaUrl = "";
      let coverUrl = "";

      // Upload media file
      if (formData.mediaFile) {
        const mediaFileName = `${Date.now()}_${formData.mediaFile.name}`;
        mediaUrl = await EntertainmentService.uploadFile(
          "media",
          formData.mediaFile,
          mediaFileName
        );
      }

      // Upload cover image
      if (formData.coverFile) {
        const coverFileName = `${Date.now()}_${formData.coverFile.name}`;
        coverUrl = await EntertainmentService.uploadFile(
          "covers",
          formData.coverFile,
          coverFileName
        );
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
      console.error("Error creating entertainment:", error);
      setError("Failed to create entertainment item");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (
    field: "mediaFile" | "coverFile",
    file: File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleMoodStateChange = (moodState: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      mood_states: checked
        ? [...prev.mood_states, moodState]
        : prev.mood_states.filter((state) => state !== moodState),
    }));
    if (formErrors.mood_states) {
      setFormErrors((prev) => ({ ...prev, mood_states: "" }));
    }
  };

  const handleMoodStateChangeEdit = (moodState: string, checked: boolean) => {
    setFormDataEdit((prev) => ({
      ...prev,
      mood_states: checked
        ? [...prev.mood_states, moodState]
        : prev.mood_states.filter((state) => state !== moodState),
    }));
    if (formErrorsEdit.mood_states) {
      setFormErrorsEdit((prev) => ({ ...prev, mood_states: "" }));
    }
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (!formDataEdit.title.trim()) errors.title = "Title is required";
    if (!formDataEdit.category.trim()) errors.category = "Category is required";
    if (formDataEdit.mood_states.length === 0)
      errors.mood_states = "At least one mood state is required";

    setFormErrorsEdit(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEditForm() || !editingItem) return;

    setUpdating(true);
    try {
      setError(null);

      // Prepare update data
      const updateData = {
        title: formDataEdit.title.trim(),
        type: formDataEdit.type,
        description: formDataEdit.description?.trim() || null,
        category: formDataEdit.category.trim(),
        mood_states: formDataEdit.mood_states,
        status: formDataEdit.status,
        updated_at: new Date().toISOString()
      };

      console.log('Updating entertainment with data:', updateData);

      // Attempt update
      await EntertainmentService.updateEntertainment(editingItem.id, updateData);

      setShowEditModal(false);
      setEditingItem(null);
      await fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error updating entertainment:", error);
      setError(`Failed to update entertainment item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "Video" ? (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg rounded-lg overflow-hidden border border-blue-100">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Entertainment Hub
                </h1>
                <div className="hidden md:flex items-center px-3 py-1 bg-blue-100 rounded-full">
                  <span className="text-xs font-medium text-blue-800">
                    {stats.totalContent} Items
                  </span>
                </div>
              </div>
              <p className="mt-2 text-base text-gray-600 max-w-2xl">
                Manage and organize therapeutic content, including guided
                meditations, calming music, and relaxation exercises to support
                mental well-being.
              </p>
            </div>
            <div className="flex items-center space-x-3 self-end md:self-center">
              <button
                onClick={handleAddEntertainment}
                className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm shadow-md hover:shadow-lg transform transition hover:-translate-y-0.5"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Add New Content</span>
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
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        {/* Content Count */}
        <div className="stats-card rounded-xl p-6 border border-blue-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Content Library
              </p>
              <div className="mt-1 flex items-baseline space-x-4">
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalContent}
                </p>
                <div className="flex space-x-1 text-sm">
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {stats.totalVideos} Videos
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                    {stats.totalAudio} Audio
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="stats-card rounded-xl p-6 border border-purple-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">Storage Usage</p>
              <div className="mt-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.storageUsed} GB
                  </p>
                  <p className="text-sm text-gray-500">
                    of {stats.totalStorage} GB
                  </p>
                </div>
                <div className="mt-2">
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-purple-100">
                      <div
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500"
                        style={{
                          width: `${Math.min(
                            (stats.storageUsed / stats.totalStorage) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="stats-card rounded-xl p-6 border border-green-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Activity Status
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.activeCount}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  Active
                </span>
              </p>
              <div className="mt-1 flex items-center text-sm">
                <span className="text-gray-500">
                  {stats.inactiveCount} Inactive
                </span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="text-green-600 font-medium">
                  {stats.totalContent > 0
                    ? Math.round((stats.activeCount / stats.totalContent) * 100)
                    : 0}
                  % Active Rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="stats-card rounded-xl p-6 border border-orange-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Date(stats.lastUpdated).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(stats.lastUpdated).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white shadow-md rounded-xl mt-6 border border-gray-100">
        <div className="px-6 py-6">
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="w-full lg:w-64">
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Type Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTypeFilter("all")}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedType === "all"
                    ? "bg-blue-100 text-blue-700 ring-2 ring-blue-600 ring-offset-2"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                All ({stats.totalContent})
              </button>
              <button
                onClick={() => handleTypeFilter("Video")}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedType === "Video"
                    ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-600 ring-offset-2"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Videos ({stats.totalVideos})
              </button>
              <button
                onClick={() => handleTypeFilter("Audio")}
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedType === "Audio"
                    ? "bg-green-100 text-green-700 ring-2 ring-green-600 ring-offset-2"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                Audio ({stats.totalAudio})
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Table */}
        <div className="mt-4 overflow-hidden shadow-sm border border-gray-200 rounded-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cover & Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Title & Description
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Mood States
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntertainments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchQuery ||
                        selectedType !== "all" ||
                        selectedCategory
                          ? "No content found"
                          : "No entertainment content yet"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ||
                        selectedType !== "all" ||
                        selectedCategory
                          ? "Try adjusting your filters."
                          : "Add your first CBT resource to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntertainments.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {/* Cover & Type */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {item.cover_img_url ? (
                              <img
                                src={item.cover_img_url}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                {item.type === "Video" ? (
                                  <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-8 h-8 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                    />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              item.type === "Video"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {getTypeIcon(item.type)}
                            <span className="ml-1">{item.type}</span>
                          </span>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="px-6 py-4">
                        <div className="max-w-sm">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                          {item.category}
                        </span>
                      </td>

                      {/* Mood States */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {item.mood_states.map((state, index) => (
                            <span
                              key={index}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                            >
                              {state}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            item.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.status === "active" ? "● Active" : "○ Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => handleEditEntertainment(item)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                          >
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteEntertainment(
                                item.id,
                                item.media_file_url,
                                item.cover_img_url
                              )
                            }
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
                          >
                            <svg
                              className="w-4 h-4 mr-1.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
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
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Add New Entertainment
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className={`input-field ${
                        formErrors.title ? "border-red-500" : ""
                      }`}
                      placeholder="Enter entertainment title"
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as "Video" | "Audio",
                        }))
                      }
                      className="input-field"
                    >
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="input-field"
                    rows={3}
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className={`input-field ${
                      formErrors.category ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select a category</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.category}
                    </p>
                  )}
                </div>

                {/* Mood States */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood States *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      "Neutral/Calm",
                      "Happy/Positive",
                      "Depressed/Sad",
                      "Stressed/Anxious",
                      "Angry/Frustrated",
                      "Excited/Energetic",
                      "Confused/Uncertain",
                      "Mixed/No Clear Pattern",
                    ].map((state) => (
                      <label
                        key={state}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.mood_states.includes(state)}
                          onChange={(e) =>
                            handleMoodStateChange(state, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{state}</span>
                      </label>
                    ))}
                  </div>
                  {formErrors.mood_states && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrors.mood_states}
                    </p>
                  )}
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media File *
                    </label>
                    <input
                      type="file"
                      accept=".mp3,.mp4,.wav,.avi,.mov,.wmv,audio/*,video/*"
                      onChange={(e) =>
                        handleFileChange(
                          "mediaFile",
                          e.target.files?.[0] || null
                        )
                      }
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                        formErrors.mediaFile ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.mediaFile && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.mediaFile}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: MP4, MP3, WAV, AVI, MOV, WMV
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,image/*"
                      onChange={(e) =>
                        handleFileChange(
                          "coverFile",
                          e.target.files?.[0] || null
                        )
                      }
                      className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 ${
                        formErrors.coverFile ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.coverFile && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrors.coverFile}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: JPG, PNG, GIF, WebP (optional)
                    </p>
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
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span>
                      {uploading ? "Uploading..." : "Add Entertainment"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Edit Entertainment
              </h3>

              <form onSubmit={handleEditFormSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formDataEdit.title}
                      onChange={(e) =>
                        setFormDataEdit((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className={`input-field ${
                        formErrorsEdit.title ? "border-red-500" : ""
                      }`}
                      placeholder="Enter entertainment title"
                    />
                    {formErrorsEdit.title && (
                      <p className="text-red-500 text-xs mt-1">
                        {formErrorsEdit.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      value={formDataEdit.type}
                      onChange={(e) =>
                        setFormDataEdit((prev) => ({
                          ...prev,
                          type: e.target.value as "Video" | "Audio",
                        }))
                      }
                      className="input-field"
                    >
                      <option value="Video">Video</option>
                      <option value="Audio">Audio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formDataEdit.description}
                    onChange={(e) =>
                      setFormDataEdit((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="input-field"
                    rows={3}
                    placeholder="Enter description (optional)"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formDataEdit.category}
                    onChange={(e) =>
                      setFormDataEdit((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className={`input-field ${
                      formErrorsEdit.category ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select a category</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {formErrorsEdit.category && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrorsEdit.category}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formDataEdit.status}
                    onChange={(e) =>
                      setFormDataEdit((prev) => ({
                        ...prev,
                        status: e.target.value as "active" | "inactive",
                      }))
                    }
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Mood States */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mood States *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      "Neutral/Calm",
                      "Happy/Positive",
                      "Depressed/Sad",
                      "Stressed/Anxious",
                      "Angry/Frustrated",
                      "Excited/Energetic",
                      "Confused/Uncertain",
                      "Mixed/No Clear Pattern",
                    ].map((state) => (
                      <label
                        key={state}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formDataEdit.mood_states.includes(state)}
                          onChange={(e) =>
                            handleMoodStateChangeEdit(state, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{state}</span>
                      </label>
                    ))}
                  </div>
                  {formErrorsEdit.mood_states && (
                    <p className="text-red-500 text-xs mt-1">
                      {formErrorsEdit.mood_states}
                    </p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                    className="btn-secondary"
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex items-center space-x-2"
                    disabled={updating}
                  >
                    {updating && (
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span>{updating ? "Updating..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntertainmentManagement;
