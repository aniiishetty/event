import express, { Request, Response } from 'express';
import upload from '../middleware/upload'; // Adjust the path if needed
import { registerUser, getAllRegistrations } from '../controllers/registrationController';
import puppeteer from 'puppeteer';
import { Registration } from '../models/Registration'; // Adjust the path if needed
import { College } from '../models/College';

const router = express.Router();

// Apply the upload middleware to handle file uploads
router.post('/register', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'researchPaper', maxCount: 1 }]), registerUser);
router.get('/', getAllRegistrations);

router.post('/generate-pdf', async (req: Request, res: Response) => {
    try {
        const registrations = await Registration.findAll({
            include: [{ model: College, as: 'college', attributes: ['name'] }],
        });

        if (registrations.length === 0) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        const registrationsWithPhotos = registrations.map((registration) => {
            const photoBuffer = registration.photo as Buffer;
            const photoUrl = photoBuffer
                ? `data:image/jpeg;base64,${photoBuffer.toString('base64')}`
                : 'path/to/placeholder-image.png';

            return {
                name: registration.name,
                college: registration.college ? registration.college.name : 'N/A',
                email: registration.email,
                phone: registration.phone,
                photoUrl,
            };
        });

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true,
        });
        const page = await browser.newPage();
        await page.setDefaultTimeout(120000);

        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.resourceType() === 'image') {
                request.abort();
            } else {
                request.continue();
            }
        });

        const htmlContent = `...`; // Your existing HTML content

        await page.setContent(htmlContent);
        await page.waitForTimeout(3000); // Wait for rendering
        const pdfBuffer = await page.pdf({ format: 'A4' });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=registrations_list.pdf',
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error';
        res.status(500).send({
            message: 'Error generating PDF',
            error: errorMessage,
        });
    }
});

export default router;
