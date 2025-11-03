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

  // Fetch doctor registration requests
  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_registration_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRequests(data || []);
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

  // Approve a doctor registration request
  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this doctor registration? This will create a new user account.')) {
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

      // Check if user already exists
      const { data: existingUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();

      if (checkError) {
        console.error('Error checking existing users:', checkError);
        throw new Error(`Failed to check existing users: ${checkError.message}`);
      }

      const existingUser = existingUsers.users.find(user => user.email === userEmail);

      let newUserId: string;

      if (existingUser) {
        // User already exists, use existing user ID
        console.log('User already exists, using existing user ID');
        newUserId = existingUser.id;
      } else {
        // Create a new user with auth using service role
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
          console.error('Auth error details:', authError);
          throw new Error(`Failed to create user: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('Failed to create user');
        }

        newUserId = authData.user.id;
      }

      // Check if user role already exists
      const { data: existingRole, error: roleCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', newUserId)
        .eq('role', 'doctor')
        .single();

      if (roleCheckError && roleCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing role:', roleCheckError);
        throw new Error(`Failed to check existing role: ${roleCheckError.message}`);
      }

      if (!existingRole) {
        // Insert into user_roles table as doctor only if it doesn't exist
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUserId,
            role: 'doctor'
          });

        if (roleError) {
          console.error('Role error details:', roleError);
          throw new Error(`Failed to assign role: ${roleError.message}`);
        }
      }

      // Check if doctor record already exists
      const { data: existingDoctor, error: doctorCheckError } = await supabaseAdmin
        .from('doctors')
        .select('*')
        .eq('email', request.email)
        .single();

      if (doctorCheckError && doctorCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing doctor:', doctorCheckError);
        throw new Error(`Failed to check existing doctor: ${doctorCheckError.message}`);
      }

      if (!existingDoctor) {
        // Insert into doctors table only if it doesn't exist
        const { error: doctorError } = await supabaseAdmin
          .from('doctors')
          .insert({
            name: request.full_name,
            email: request.email,
            phone: request.phone_number || '',
            category: request.specialization,
            profilepicture: null, // You can set a default profile picture or leave null
            dominant_state: request.city || null
          });

        if (doctorError) {
          console.error('Doctor error details:', doctorError);
          throw new Error(`Failed to create doctor record: ${doctorError.message}`);
        }
      }

      // Update the registration request status
      const { error: updateError } = await supabaseAdmin
        .from('doctor_registration_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Update error details:', updateError);
        throw new Error(`Failed to update request status: ${updateError.message}`);
      }

      // Optional: Send email to doctor with login credentials
      // You can implement this based on your email service
      console.log(`Doctor account created. Email: ${request.email}, Password: ${userPassword}`);

      alert(`Doctor registration approved successfully! A new user account has been created for ${request.full_name}.`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error approving registration request: ' + (error as Error).message);
      // Rollback: If user creation failed, we should clean up any partial data
      // But for now, just log and alert
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
      const { error } = await supabase
        .from('doctor_registration_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      alert('Doctor registration rejected successfully!');
      setRejectionReason('');
      setIsModalOpen(false);
      setSelectedRequest(null);
      fetchRequests(); // Refresh the list
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
                  Review and manage doctor registration applications
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No registration requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no pending doctor registration requests.
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
                            {request.status === 'approved' && <CheckIcon className="w-4 h-4 mr-1" />}
                            {request.status === 'rejected' && <XMarkIcon className="w-4 h-4 mr-1" />}
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

                        {request.address_line_1 && (
                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Address:</strong> {request.address_line_1}
                            {request.address_line_2 && `, ${request.address_line_2}`}
                            {request.postal_code && `, ${request.postal_code}`}
                          </div>
                        )}

                        {request.rejection_reason && (
                          <div className="mt-3 text-sm text-red-600">
                            <strong>Rejection Reason:</strong> {request.rejection_reason}
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Submitted: {formatDate(request.submitted_at)}
                          {request.reviewed_at && ` • Reviewed: ${formatDate(request.reviewed_at)}`}
                        </div>
                      </div>

                      {/* Action buttons */}
                      {request.status === 'pending' && (
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
                      )}
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