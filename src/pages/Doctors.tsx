import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { supabase } from '../lib/supabase';

interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  category: string;
  profilepicture: string | null;
  created_at: string | null;
  dominant_state: string | null;
}

const categoryOptions = [
  'Psychiatrist',
  'ClinicalPsychologist',
  'CounsellingPsychologist',
  'Psychotherapist',
  'ChildAdolescentSpecialist',
  'AddictionSpecialist',
  'Neuropsychologist',
  'SleepSpecialist',
  'TraumaSpecialist',
  'FamilyTherapist',
  'Counsellor'
];

const stateOptions = [
  'neutral/calm',
  'angry/frustrated',
  'depressed/sad',
  'stressed/anxious',
  'confused/uncertain',
  'excited/energetic'
];

const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  // useAuth(); // Keep for future authorization checks

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      message.error('Error fetching doctors');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Handle doctor deletion
  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      message.success('Doctor deleted successfully');
      fetchDoctors();
    } catch (error) {
      message.error('Error deleting doctor');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Profile Picture',
      dataIndex: 'profilepicture',
      key: 'profilepicture',
      render: (text: string) => (
        <img
          src={text || 'default-avatar.png'}
          alt="Profile"
          style={{ width: 50, height: 50, borderRadius: '50%' }}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Doctor, b: Doctor) => a.name.localeCompare(b.name),
    },
    {
      title: 'Contact Info',
      key: 'contact',
      render: (record: Doctor) => (
        <div className="flex flex-col">
          <div className="flex items-center text-gray-800">
            <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{record.email}</span>
          </div>
          <div className="flex items-center text-gray-600 mt-1">
            <svg className="w-4 h-4 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{record.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: categoryOptions.map(cat => ({ text: cat, value: cat })),
      onFilter: (value: string, record: Doctor) => record.category === value,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'State',
      dataIndex: 'dominant_state',
      key: 'dominant_state',
      filters: stateOptions.map(state => ({ text: state, value: state })),
      onFilter: (value: string, record: Doctor) => record.dominant_state === value,
      render: (state: string) => {
        const colorMap: { [key: string]: string } = {
          'neutral/calm': 'green',
          'angry/frustrated': 'red',
          'depressed/sad': 'grey',
          'stressed/anxious': 'orange',
          'confused/uncertain': 'purple',
          'excited/energetic': 'cyan'
        };
        return <Tag color={colorMap[state]}>{state}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Doctor) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              // Edit functionality can be implemented here if needed
              message.info('Edit functionality would go here');
            }}
            className="bg-indigo-500 hover:bg-indigo-600 border-none shadow-sm"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this doctor?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ className: 'bg-red-500 hover:bg-red-600' }}
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              className="hover:bg-red-50 border-red-500"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-800">Manage Doctors</h1>
              <Button 
                type="text"
                onClick={fetchDoctors}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2"
              >
                Refresh
              </Button>
            </div>
            <p className="text-gray-600 mt-1">View and manage doctor profiles</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Total Doctors</h3>
              <span className="bg-blue-50 text-blue-600 py-1 px-2 rounded-md text-sm font-medium">
                All
              </span>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{doctors.length}</p>
            <p className="text-sm text-gray-500 mt-1">Active healthcare providers</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Psychiatrists</h3>
              <span className="bg-indigo-50 text-indigo-600 py-1 px-2 rounded-md text-sm font-medium">
                {doctors.length > 0 ? ((doctors.filter(d => d.category === 'Psychiatrist').length / doctors.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <p className="text-2xl font-semibold text-indigo-600 mt-2">
              {doctors.filter(d => d.category === 'Psychiatrist').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Medical specialists</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Psychologists</h3>
              <span className="bg-green-50 text-green-600 py-1 px-2 rounded-md text-sm font-medium">
                {doctors.length > 0 ? ((doctors.filter(d => ['ClinicalPsychologist', 'CounsellingPsychologist'].includes(d.category)).length / doctors.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <p className="text-2xl font-semibold text-green-600 mt-2">
              {doctors.filter(d => ['ClinicalPsychologist', 'CounsellingPsychologist'].includes(d.category)).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Clinical & counselling</p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">Specialists</h3>
              <span className="bg-purple-50 text-purple-600 py-1 px-2 rounded-md text-sm font-medium">
                {doctors.length > 0 ? ((doctors.filter(d => !['Psychiatrist', 'ClinicalPsychologist', 'CounsellingPsychologist'].includes(d.category)).length / doctors.length) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <p className="text-2xl font-semibold text-purple-600 mt-2">
              {doctors.filter(d => !['Psychiatrist', 'ClinicalPsychologist', 'CounsellingPsychologist'].includes(d.category)).length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Other specializations</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table
          columns={columns as ColumnsType<Doctor>}
          dataSource={doctors}
          rowKey="id"
          loading={loading}
          className="custom-table"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            position: ['bottomCenter'],
            className: 'custom-pagination'
          }}
        />
      </div>
    </div>
  );
};

export default Doctors;