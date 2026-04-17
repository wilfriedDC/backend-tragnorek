// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Storage avatar ─────────────────────────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'tragnorek/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

// ── Storage galerie ────────────────────────────────────────────────────────
const galleryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'tragnorek/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, quality: 'auto' }],
  },
});

// ── Storage événements ─────────────────────────────────────────────────────
const eventStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'tragnorek/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'fill' }],
  },
});

export const uploadAvatar  = multer({ storage: avatarStorage,  limits: { fileSize: 5  * 1024 * 1024 } });
export const uploadGallery = multer({ storage: galleryStorage, limits: { fileSize: 10 * 1024 * 1024 } });
export const uploadEvent   = multer({ storage: eventStorage,   limits: { fileSize: 10 * 1024 * 1024 } });

export default cloudinary;