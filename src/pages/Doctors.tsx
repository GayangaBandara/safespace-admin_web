import React, { useState, useEffect } from 'react';
import './Doctors.css';
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
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
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this doctor?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Manage Doctors</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="doctor-add-button"
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

      <Table
        columns={columns as ColumnsType<Doctor>}
        dataSource={doctors}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setFileList([]);
          setEditingDoctor(null);
        }}
        footer={null}
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
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingDoctor ? 'Update' : 'Add'} Doctor
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setFileList([]);
                setEditingDoctor(null);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Doctors;