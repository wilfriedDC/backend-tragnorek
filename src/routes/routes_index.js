// src/routes/index.js
import { Router } from 'express';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { uploadAvatar, uploadGallery, uploadEvent } from '../config/cloudinary.js';

import * as auth    from '../controllers/authController.js';
import * as members from '../controllers/membersController_cloudinary.js';
import * as events  from '../controllers/eventsController_cloudinary.js';
import * as gallery from '../controllers/galleryController_cloudinary.js';
import * as contact from '../controllers/contactController.js';

const router = Router();

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

// ── Events (admin) ────────────────────────────────────────────────────────
router.get   ('/admin/events/registrations', authenticate, requireAdmin, events.getRegistrations);
router.post  ('/admin/events',               authenticate, requireAdmin, uploadEvent.single('image'), events.createEvent);
router.delete('/admin/events/:id',           authenticate, requireAdmin, events.deleteEvent);

// ── Gallery ────────────────────────────────────────────────────────────────
router.get   ('/gallery',     optionalAuth,                                             gallery.getGallery);
router.post  ('/gallery',     authenticate, requireAdmin, uploadGallery.single('image'), gallery.addGalleryItem);
router.delete('/gallery/:id', authenticate, requireAdmin,                               gallery.deleteGalleryItem);

// ── Contact ────────────────────────────────────────────────────────────────
router.post ('/contact',                contact.sendMessage);
router.get  ('/admin/contact',          authenticate, requireAdmin, contact.getMessages);
router.patch('/admin/contact/:id/read', authenticate, requireAdmin, contact.markAsRead);

export default router;