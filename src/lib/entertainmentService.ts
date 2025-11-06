import { supabase } from './supabase';

// Match the exact database schema
export interface EntertainmentItem {
  id: number;
  title: string;
  type: string;
  description: string | null;
  cover_img_url: string | null;
  media_file_url: string | null;
  category: string;
  mood_states: string[];
  status: string;
  created_at: string;
  updated_at: string;
  dominant_state: string | null;
}

export interface EntertainmentStats {
  totalContent: number;
  totalVideos: number;
  totalAudio: number;
  storageUsed: number;
  totalStorage: number;
  activeCount: number;
  inactiveCount: number;
  lastUpdated: string;
}

export interface CreateEntertainmentData {
  title: string;
  type: string;
  description?: string | null;
  cover_img_url?: string | null;
  media_file_url?: string | null;
  category: string;
  mood_states: string[];
  status?: string;
}

export class EntertainmentService {
  static async getAllEntertainments(): Promise<EntertainmentItem[]> {
    try {
      const { data, error } = await supabase
        .from('entertainments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entertainments:', error);
        throw new Error(`Failed to fetch entertainments: ${error.message}`);
      }
      
      console.log('Fetched entertainments:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Exception in getAllEntertainments:', error);
      throw error;
    }
  }

  static async getEntertainmentById(id: number): Promise<EntertainmentItem | null> {
    try {
      const { data, error } = await supabase
        .from('entertainments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(`Failed to fetch entertainment: ${error.message}`);
      return data;
    } catch (error) {
      console.error('Exception in getEntertainmentById:', error);
      throw error;
    }
  }

  static async createEntertainment(data: CreateEntertainmentData): Promise<EntertainmentItem> {
    try {
      console.log('Creating entertainment with data:', data);
      
      // Create the exact object structure that matches the database
      const insertData: any = {
        title: data.title,
        type: data.type,
        category: data.category,
        mood_states: data.mood_states,
        status: data.status || 'active',
      };

      // Only add optional fields if they exist
      if (data.description) insertData.description = data.description;
      if (data.cover_img_url) insertData.cover_img_url = data.cover_img_url;
      if (data.media_file_url) insertData.media_file_url = data.media_file_url;

      console.log('Insert data:', insertData);

      const { data: result, error } = await supabase
        .from('entertainments')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Failed to create entertainment: ${error.message}`);
      }
      
      if (!result) {
        throw new Error('No data returned after insert');
      }

      console.log('Entertainment created successfully:', result);
      return result;
    } catch (error) {
      console.error('Exception in createEntertainment:', error);
      throw error;
    }
  }

  static async updateEntertainment(id: number, data: Partial<EntertainmentItem>): Promise<EntertainmentItem> {
    try {
      console.log('Updating entertainment:', id, data);
      
      const { data: result, error } = await supabase
        .from('entertainments')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Failed to update entertainment: ${error.message}`);
      }
      
      if (!result) {
        throw new Error('No data returned after update');
      }

      console.log('Entertainment updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Exception in updateEntertainment:', error);
      throw error;
    }
  }

  static async deleteEntertainment(id: number): Promise<void> {
    try {
      console.log('Deleting entertainment from database:', id);
      
      const { error } = await supabase
        .from('entertainments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Database delete error:', error);
        throw new Error(`Failed to delete entertainment: ${error.message}`);
      }

      console.log('Entertainment deleted successfully from database');
    } catch (error) {
      console.error('Exception in deleteEntertainment:', error);
      throw error;
    }
  }

  static async uploadFile(
    bucket: 'entertainment-media' | 'entertainment-covers', 
    file: File, 
    fileName: string
  ): Promise<string> {
    try {
      console.log(`Uploading file to ${bucket}:`, fileName, 'Size:', file.size);

      // Check if bucket exists and is accessible
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1 });

      if (bucketError) {
        console.error('Bucket access error:', bucketError);
        throw new Error(`Cannot access bucket ${bucket}: ${bucketError.message}`);
      }

      // Upload the file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('File upload error:', error);
        
        // If file already exists, try with upsert
        if (error.message.includes('already exists')) {
          console.log('File exists, trying with upsert...');
          const { data: upsertData, error: upsertError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (upsertError) {
            throw new Error(`Failed to upload file: ${upsertError.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(upsertData!.path);

          console.log('File uploaded successfully (upsert):', publicUrl);
          return publicUrl;
        }
        
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      console.log('File uploaded successfully:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Exception in uploadFile:', error);
      throw error;
    }
  }

  static async deleteFile(
    bucket: 'entertainment-media' | 'entertainment-covers', 
    fileName: string
  ): Promise<void> {
    try {
      console.log(`Deleting file from ${bucket}:`, fileName);
      
      // List files to verify it exists
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { search: fileName });

      if (listError) {
        console.error('Error listing files:', listError);
      } else {
        console.log('Files found:', files?.map(f => f.name));
      }

      // Delete the file
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('File deletion error:', error);
        // Don't throw error if file doesn't exist
        if (!error.message.includes('not found')) {
          throw new Error(`Failed to delete file: ${error.message}`);
        } else {
          console.log('File not found in storage, continuing...');
        }
      } else {
        console.log('File deleted successfully from storage');
      }
    } catch (error) {
      console.error('Exception in deleteFile:', error);
      // Don't throw - we still want to delete the database record
      console.log('Continuing despite file deletion error...');
    }
  }

  static async toggleEntertainmentStatus(id: number): Promise<EntertainmentItem> {
    const current = await this.getEntertainmentById(id);
    if (!current) throw new Error('Entertainment not found');

    const newStatus = current.status === 'active' ? 'inactive' : 'active';
    return this.updateEntertainment(id, { status: newStatus });
  }

  static async calculateStorageUsed(): Promise<number> {
    try {
      const [mediaSize, coversSize] = await Promise.all([
        this.getBucketSize('entertainment-media'),
        this.getBucketSize('entertainment-covers')
      ]);

      const totalSizeGB = (mediaSize + coversSize) / (1024 * 1024 * 1024);
      return Math.round(totalSizeGB * 100) / 100;
    } catch (error) {
      console.error('Error calculating storage:', error);
      return 0;
    }
  }

  private static async getBucketSize(bucketName: string): Promise<number> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list();

      if (error) {
        console.error(`Error listing bucket ${bucketName}:`, error);
        return 0;
      }
      
      const size = data?.reduce((total, file) => total + (file.metadata?.size || 0), 0) || 0;
      console.log(`Bucket ${bucketName} size:`, size, 'bytes');
      return size;
    } catch (error) {
      console.error(`Exception getting size for bucket ${bucketName}:`, error);
      return 0;
    }
  }

  static async getEntertainmentStats(): Promise<EntertainmentStats> {
    try {
      const { data, error } = await supabase
        .from('entertainments')
        .select('type, status, updated_at');

      if (error) {
        console.error('Error fetching stats:', error);
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      const items = data || [];
      const storageUsed = await this.calculateStorageUsed();

      return {
        totalContent: items.length,
        totalVideos: items.filter(item => item.type === 'Video').length,
        totalAudio: items.filter(item => item.type === 'Audio').length,
        storageUsed: storageUsed,
        totalStorage: 24,
        activeCount: items.filter(item => item.status === 'active').length,
        inactiveCount: items.filter(item => item.status === 'inactive').length,
        lastUpdated: items.length > 0 ? 
          items.reduce((latest, item) => 
            new Date(item.updated_at) > new Date(latest) ? item.updated_at : latest, 
            items[0].updated_at
          ) : new Date().toISOString(),
      };
    } catch (error) {
      console.error('Exception in getEntertainmentStats:', error);
      throw error;
    }
  }
}