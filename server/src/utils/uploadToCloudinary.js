import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { configureCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const uploadBufferToCloudinary = (buffer, originalName) => {
  const cloudinary = configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'scms/complaints',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          originalName,
        });
      }
    );

    stream.end(buffer);
  });
};

const saveBufferLocallyFallback = async (buffer, originalName, baseUrl) => {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(originalName) || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
  const filename = `complaint-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safeExt}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  return {
    url: `${baseUrl}/uploads/${filename}`,
    publicId: `local/${filename}`,
    originalName,
  };
};

export const uploadComplaintImages = async (files = [], baseUrl = '') => {
  if (!files || files.length === 0) {
    return [];
  }

  if (isCloudinaryConfigured()) {
    return Promise.all(files.map((file) => uploadBufferToCloudinary(file.buffer, file.originalname)));
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cloudinary is not configured in production environment.');
  }

  return Promise.all(files.map((file) => saveBufferLocallyFallback(file.buffer, file.originalname, baseUrl)));
};
