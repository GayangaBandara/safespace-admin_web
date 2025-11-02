import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Upload,
  Space,
  Popconfirm,
  Tag
} from 'antd';
import type { UploadFile } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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

const { Option } = Select;

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
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
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

  // Handle form submission
  interface DoctorFormValues {
    name: string;
    email: string;
    phone: string;
    category: string;
    dominant_state: string;
  }

  const handleSubmit = async (values: DoctorFormValues) => {
    try {
      setLoading(true);
      let profilePictureUrl = editingDoctor?.profilepicture;

      // Handle file upload if there's a new file
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        if (!file) {
          throw new Error('File is required');
        }
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${values.name}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('doctor_profiles')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('doctor_profiles')
          .getPublicUrl(filePath);

        profilePictureUrl = publicUrl;
      }

      if (editingDoctor) {
        // Update existing doctor
        const { error } = await supabase
          .from('doctors')
          .update({
            ...values,
            profilepicture: profilePictureUrl
          })
          .eq('id', editingDoctor.id);

        if (error) throw error;
        message.success('Doctor updated successfully');
      } else {
        // Create new doctor
        const { error } = await supabase
          .from('doctors')
          .insert([{
            ...values,
            profilepicture: profilePictureUrl
          }]);

        if (error) throw error;
        message.success('Doctor added successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setFileList([]);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (error) {
      message.error('Error saving doctor');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Handle edit button click
  const handleEdit = (record: Doctor) => {
    setEditingDoctor(record);
    form.setFieldsValue(record);
    if (record.profilepicture) {
      const uploadFile: UploadFile = {
        uid: '-1',
        name: 'Current Profile Picture',
        status: 'done' as const,
        url: record.profilepicture,
      };
      setFileList([uploadFile]);
    }
    setModalVisible(true);
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
            onClick={() => handleEdit(record)}
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
            <p className="text-gray-600 mt-1">Add, edit, and manage doctor profiles</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-[#1677ff] hover:bg-blue-600 border-none flex items-center"
              onClick={() => {
                setEditingDoctor(null);
                form.resetFields();
                setFileList([]);
                setModalVisible(true);
              }}
            >
              Add New Doctor
            </Button>
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
                {((doctors.filter(d => d.category === 'Psychiatrist').length / doctors.length) * 100).toFixed(0)}%
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
                {((doctors.filter(d => ['ClinicalPsychologist', 'CounsellingPsychologist'].includes(d.category)).length / doctors.length) * 100).toFixed(0)}%
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
                {((doctors.filter(d => !['Psychiatrist', 'ClinicalPsychologist', 'CounsellingPsychologist'].includes(d.category)).length / doctors.length) * 100).toFixed(0)}%
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

      <Modal
        title={
          <div className="text-lg font-semibold text-gray-800 pb-3 border-b">
            {editingDoctor ? 'Edit Doctor Profile' : 'Add New Doctor'}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
          setEditingDoctor(null);
        }}
        footer={null}
        width={600}
        className="custom-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter the doctor\'s name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter the email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter the phone number' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select>
              {categoryOptions.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dominant_state"
            label="Current State"
            rules={[{ required: true, message: 'Please select the current state' }]}
          >
            <Select>
              {stateOptions.map(state => (
                <Option key={state} value={state}>{state}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Profile Picture"
          >
            <Upload
              listType="picture"
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <div className="flex justify-end space-x-4">
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setFileList([]);
                  setEditingDoctor(null);
                }}
                className="min-w-[100px] hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="min-w-[100px] bg-blue-500 hover:bg-blue-600 border-none shadow-sm"
              >
                {editingDoctor ? 'Update' : 'Add'} Doctor
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Doctors;