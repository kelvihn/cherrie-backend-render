const cloudinary = require('cloudinary').v2;
const fs = require('fs');

class CloudinaryService {
  constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  /**
   * Upload file to Cloudinary
   * @param {string} filePath - Path to the file
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Cloudinary URL
   */
  async uploadFile(filePath, options = {}) {
    try {
      const defaultOptions = {
        resource_type: 'auto', // auto-detect file type
        folder: 'uploads', // organize files in folders
        use_filename: true,
        unique_filename: true,
        ...options
      };

      const result = await cloudinary.uploader.upload(filePath, defaultOptions);
      
      // Clean up local file after successful upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return result.secure_url;
    } catch (error) {
      // Clean up local file even if upload fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary
   * @param {Array<string>} filePaths - Array of file paths
   * @param {Object} options - Upload options
   * @returns {Promise<Array<string>>} - Array of Cloudinary URLs
   */
  async uploadMultipleFiles(filePaths, options = {}) {
    try {
      const uploadPromises = filePaths.map(filePath => 
        this.uploadFile(filePath, options)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw new Error(`Multiple file upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Public ID of the file to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteFile(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Cloudinary deletion failed: ${error.message}`);
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} cloudinaryUrl - Full Cloudinary URL
   * @returns {string} - Public ID
   */
  extractPublicId(cloudinaryUrl) {
    try {
      const parts = cloudinaryUrl.split('/');
      const filename = parts[parts.length - 1];
      return filename.split('.')[0]; // Remove file extension
    } catch (error) {
      throw new Error(`Failed to extract public ID: ${error.message}`);
    }
  }

  /**
   * Upload with specific transformations
   * @param {string} filePath - Path to the file
   * @param {Object} transformations - Cloudinary transformations
   * @returns {Promise<string>} - Cloudinary URL
   */
  async uploadWithTransformations(filePath, transformations = {}) {
    const options = {
      transformation: transformations,
      folder: 'uploads',
      use_filename: true,
      unique_filename: true
    };

    return await this.uploadFile(filePath, options);
  }
}

module.exports = new CloudinaryService();