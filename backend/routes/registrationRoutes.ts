import express, { Request, Response } from 'express';
import upload from '../middleware/upload'; // Adjust the path if needed
import { registerUser, getAllRegistrations, generateAllRegistrationsPDF } from '../controllers/registrationController';
import puppeteer from 'puppeteer';
import { Registration } from '../models/Registration'; // Adjust the path if needed
import { College } from '../models/College';

const router = express.Router();

// Apply the upload middleware to handle file uploads
router.post('/register', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'researchPaper', maxCount: 1 }]), registerUser);
router.get('/', getAllRegistrations);

router.get('/pdf', generateAllRegistrationsPDF);

export default router;
