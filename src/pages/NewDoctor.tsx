import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  MapPinIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Import the database types
import type { Tables } from '../types/supabase';

// Define the structure for doctor registration requests using database types
type DoctorRegistrationRequest = Tables<'doctor_registration_requests'>;

// Dominant state options
const dominantStateOptions = [
  'neutral/calm',
  'angry/frustrated',
  'depressed/sad',
  'stressed/anxious',
  'confused/uncertain',
  'excited/energetic'
];

// Component for admin to view and manage doctor registration requests
const NewDoctor: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DoctorRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DoctorRegistrationRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedDominantStates, setSelectedDominantStates] = useState<{[key: string]: string}>({});

  // Fetch doctor registration requests
  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_registration_requests')
        .select('*')
        .eq('status', 'pending') // Only fetch pending requests
        .order('submitted_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRequests(data || []);
      
      // Initialize dominant states for each request
      const initialStates: {[key: string]: string} = {};
      data?.forEach(request => {
        initialStates[request.id] = 'neutral/calm';
      });
      setSelectedDominantStates(initialStates);
    } catch (error) {
      console.error('Error fetching registration requests:', error);
      alert('Error loading registration requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update dominant state for a specific request
  const handleDominantStateChange = (requestId: string, value: string) => {
    setSelectedDominantStates(prev => ({
      ...prev,
      [requestId]: value
    }));
  };

  // Approve a doctor registration request
  const handleApprove = async (requestId: string) => {
    const dominantState = selectedDominantStates[requestId] || 'neutral/calm';
    
    if (!confirm(`Are you sure you want to approve this doctor registration? This will create a new user account with dominant state: ${dominantState}`)) {
      return;
    }

    setApprovingId(requestId);

    try {
      // Get the request details first
      const { data: request, error: requestError } = await supabase
        .from('doctor_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) {
        throw requestError;
      }

      if (!request) {
        throw new Error('Request not found');
      }

      // Use the password and email from the registration request
      const userPassword = request.password;
      const userEmail = request.email;

      // Try to create a new user with auth using service role
      let newUserId: string;

      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userEmail,
          password: userPassword,
          email_confirm: true,
          user_metadata: {
            full_name: request.full_name,
            user_type: 'doctor'
          }
        });

        if (authError) {
          // If user already exists, try to get the existing user
          if (authError.message.includes('already been registered') || authError.message.includes('already registered')) {
            throw new Error('User with this email already exists. Please contact support if you need to approve this registration.');
          } else {
            throw new Error(`Failed to create user: ${authError.message}`);
          }
        } else {
          if (!authData.user) {
            throw new Error('Failed to create user');
          }
          newUserId = authData.user.id;
        }
      } catch (createUserError) {
        throw createUserError;
      }

      // Try to insert into user_roles table as doctor
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: newUserId,
          role: 'doctor'
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        if (roleError.code !== '23505') { // If not a duplicate key error
          throw new Error(`Failed to assign role: ${roleError.message}`);
        }
      }

      // Try to insert into doctors table
      const { error: doctorError } = await supabaseAdmin
        .from('doctors')
        .upsert({
          name: request.full_name,
          email: request.email,
          phone: request.phone_number || 'Not provided',
          category: request.specialization,
          profilepicture: null,
          dominant_state: dominantState
        }, {
          onConflict: 'email'
        });

      if (doctorError) {
        if (doctorError.code !== '23505') { // If not a duplicate key error
          throw new Error(`Failed to create doctor record: ${doctorError.message}`);
        }
      }

      // Delete the registration request since it's no longer needed
      const { error: deleteError } = await supabaseAdmin
        .from('doctor_registration_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) {
        throw new Error(`Failed to delete registration request: ${deleteError.message}`);
      }

      alert(`Doctor registration approved successfully! A new user account has been created for ${request.full_name}.`);
      
      // Remove the request from the local state immediately
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving registration request: ' + (error as Error).message);
    } finally {
      setApprovingId(null);
    }
  };

  // Reject a doctor registration request
  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setRejectingId(requestId);

    try {
      // Delete the registration request
      const { error } = await supabaseAdmin
        .from('doctor_registration_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      alert('Doctor registration rejected successfully!');
      setRejectionReason('');
      setIsModalOpen(false);
      setSelectedRequest(null);
      
      // Remove the request from the local state immediately
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error rejecting registration request');
    } finally {
      setRejectingId(null);
    }
  };

  // Open rejection modal
  const openRejectionModal = (request: DoctorRegistrationRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsModalOpen(true);
  };

  // Get status badge color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Page header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Doctor Registration Requests</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Review and manage pending doctor registration applications
                </p>
              </div>
              <button
                onClick={() => navigate('/doctors/manage')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Doctors
              </button>
            </div>
          </div>

          {/* Requests list */}
          <div className="p-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending registration requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no pending doctor registration requests to review.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-900">{request.full_name}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status === 'pending' && <ClockIcon className="w-4 h-4 mr-1" />}
                            {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Unknown'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{request.email}</span>
                          </div>
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{request.specialization}</span>
                          </div>
                          <div className="flex items-center">
                            <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{request.phone_number || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{request.years_experience} years experience</span>
                          </div>
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">License: {request.license_number}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{request.city || 'Location not specified'}</span>
                          </div>
                        </div>

                        {/* Dominant State Selection for this request */}
                        <div className="mt-4 flex items-center">
                          <label htmlFor={`dominant-state-${request.id}`} className="block text-sm font-medium text-gray-700 mr-3">
                            Dominant State:
                          </label>
                          <select
                            id={`dominant-state-${request.id}`}
                            value={selectedDominantStates[request.id] || 'neutral/calm'}
                            onChange={(e) => handleDominantStateChange(request.id, e.target.value)}
                            className="block w-64 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                          >
                            {dominantStateOptions.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>

                        {request.address_line_1 && (
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Address:</strong> {request.address_line_1}
                            {request.address_line_2 && `, ${request.address_line_2}`}
                            {request.postal_code && `, ${request.postal_code}`}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                           Submitted: {formatDate(request.submitted_at)}
                         </div>
                      </div>

                      {/* Action buttons */}
                      <div className="ml-4 flex flex-col space-y-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={approvingId === request.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {approvingId === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => openRejectionModal(request)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Document links */}
                    <div className="mt-4 flex space-x-4">
                      {request.license_document_url && (
                        <a
                          href={request.license_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          View License Document
                        </a>
                      )}
                      {request.qualification_document_url && (
                        <a
                          href={request.qualification_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          View Qualification Document
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg px-4 py-6 max-w-md mx-auto">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Reject Registration Request</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please provide a reason for rejecting {selectedRequest.full_name}'s application.
              </p>
            </div>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter reason for rejection..."
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedRequest(null);
                }}
                disabled={rejectingId === selectedRequest.id}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.id)}
                disabled={rejectingId === selectedRequest.id || !rejectionReason.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectingId === selectedRequest.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Rejecting...
                  </>
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewDoctor;