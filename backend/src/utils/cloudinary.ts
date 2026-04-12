import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function uploadBuffer(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (err, result) =>
        err || !result ? reject(err ?? new Error('Upload failed')) : resolve(result)
      )
      .end(buffer);
  });
}

export function deleteImage(publicId: string): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId);
}
