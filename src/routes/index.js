import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, requireAdmin, requireMember, optionalAuth } from '../middleware/auth.js';
import * as auth    from '../controllers/authController.js';
import * as members from '../controllers/membersController.js';
import * as events  from '../controllers/eventsController.js';
import * as gallery from '../controllers/galleryController.js';
import * as contact from '../controllers/contactController.js';

const router = Router();

// ── Multer (upload avatars) ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont acceptées.'));
  },
});

// ── Auth ───────────────────────────────────────────────────────────────────
router.post('/auth/login',    auth.login);
router.post('/auth/register', auth.register);
router.post('/auth/logout',   auth.logout);
router.post('/auth/refresh',  auth.refreshToken);
router.get ('/auth/me',       authenticate, auth.me);

// ── Members (public) ───────────────────────────────────────────────────────
router.get('/members/bureau', members.getBureau);
router.get('/members',        members.getCommunity);
router.get('/members/:id',    members.getMemberById);

// ── Members (authentifiés) ─────────────────────────────────────────────────
router.patch('/members/me',        authenticate, members.updateProfile);
router.post ('/members/me/avatar', authenticate, upload.single('avatar'), members.uploadAvatar);

// ── Members (admin) ────────────────────────────────────────────────────────
router.get   ('/admin/members/pending',       authenticate, requireAdmin, members.getPending);
router.patch ('/admin/members/:id/approve',   authenticate, requireAdmin, members.approveMember);
router.delete('/admin/members/:id/reject',    authenticate, requireAdmin, members.rejectMember);

// ── Events (public) ────────────────────────────────────────────────────────
router.get('/events',     events.getEvents);
router.get('/events/:id', events.getEventById);

// ── Events (authentifiés) ─────────────────────────────────────────────────
router.post('/events/:id/register', authenticate, events.registerForEvent);

// ── Events (admin) ────────────────────────────────────────────────────────
router.get   ('/admin/events/registrations', authenticate, requireAdmin, events.getRegistrations);
router.post  ('/admin/events',               authenticate, requireAdmin, events.createEvent);
router.delete('/admin/events/:id',           authenticate, requireAdmin, events.deleteEvent);

// ── Gallery ────────────────────────────────────────────────────────────────
router.get   ('/gallery',          optionalAuth, gallery.getGallery);
router.post  ('/admin/gallery',    authenticate, requireAdmin, gallery.addGalleryItem);
router.delete('/admin/gallery/:id',authenticate, requireAdmin, gallery.deleteGalleryItem);

// ── Contact ────────────────────────────────────────────────────────────────
router.post('/contact',              contact.sendMessage);
router.get ('/admin/contact',        authenticate, requireAdmin, contact.getMessages);
router.patch('/admin/contact/:id/read', authenticate, requireAdmin, contact.markAsRead);

export default router;
