import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import * as auth    from '../controllers/authController.js';
import * as members from '../controllers/membersController.js';
import * as events  from '../controllers/eventsController.js';
import * as gallery from '../controllers/galleryController.js';
import * as contact from '../controllers/contactController.js';

const router = Router();

const makeStorage = (prefix) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, process.env.UPLOAD_DIR || 'uploads'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 30);
    cb(null, `${prefix}-${base}-${Date.now()}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Seules les images sont acceptées.'));
};

const uploadAvatar  = multer({ storage: makeStorage('avatar'),  limits: { fileSize: 5 * 1024 * 1024 },  fileFilter: imageFilter });
const uploadGallery = multer({ storage: makeStorage('gallery'), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });
const uploadEvent   = multer({ storage: makeStorage('event'),   limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });

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

// ── Members (auth) ─────────────────────────────────────────────────────────
router.patch('/members/me',        authenticate, members.updateProfile);
router.post ('/members/me/avatar', authenticate, uploadAvatar.single('avatar'), members.uploadAvatar);

// ── Members (admin) ────────────────────────────────────────────────────────
router.get   ('/admin/members/pending',         authenticate, requireAdmin, members.getPending);
router.patch ('/admin/members/:id/approve',     authenticate, requireAdmin, members.approveMember);
router.delete('/admin/members/:id/reject',      authenticate, requireAdmin, members.rejectMember);
router.patch ('/admin/members/:id/promote',     authenticate, requireAdmin, members.promoteToBureau);
router.patch ('/admin/members/:id/demote',      authenticate, requireAdmin, members.demoteFromBureau);
router.patch ('/admin/members/:id/bureau-role', authenticate, requireAdmin, members.updateBureauRole);

// ── Events (public) ────────────────────────────────────────────────────────
router.get('/events',     events.getEvents);
router.get('/events/:id', events.getEventById);

// ── Events (auth) ──────────────────────────────────────────────────────────
router.post('/events/:id/register', authenticate, events.registerForEvent);

// ── Events (admin) — multipart/form-data pour l'image ────────────────────
router.get   ('/admin/events/registrations', authenticate, requireAdmin, events.getRegistrations);
router.post  ('/admin/events',               authenticate, requireAdmin, uploadEvent.single('image'), events.createEvent);
router.delete('/admin/events/:id',           authenticate, requireAdmin, events.deleteEvent);

// ── Gallery ────────────────────────────────────────────────────────────────
router.get   ('/gallery',      optionalAuth,                                        gallery.getGallery);
router.post  ('/gallery',      authenticate, requireAdmin, uploadGallery.single('image'), gallery.addGalleryItem);
router.delete('/gallery/:id',  authenticate, requireAdmin,                          gallery.deleteGalleryItem);

// ── Contact ────────────────────────────────────────────────────────────────
router.post ('/contact',                contact.sendMessage);
router.get  ('/admin/contact',          authenticate, requireAdmin, contact.getMessages);
router.patch('/admin/contact/:id/read', authenticate, requireAdmin, contact.markAsRead);

export default router;