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
        // Fetch all registration data including college details
        const registrations = await Registration.findAll({
            include: [
                {
                    model: College,
                    as: 'college',
                    attributes: ['name'], // Only fetch college name
                },
            ],
        });

        if (registrations.length === 0) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        // Convert the Buffer data to Base64 strings for the photos
        const registrationsWithPhotos = registrations.map((registration) => {
            const photoBuffer = registration.photo as Buffer;
            const photoUrl = photoBuffer
                ? `data:image/jpeg;base64,${photoBuffer.toString('base64')}`
                : 'path/to/placeholder-image.png'; // Fallback for no photo

            return {
                name: registration.name,
                college: registration.college ? registration.college.name : 'N/A',
                email: registration.email,
                phone: registration.phone,
                photoUrl,
            };
        });

        // Generate PDF
        const pdfBuffer = await generatePDF(registrationsWithPhotos);

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

const generatePDF = async (registrationsWithPhotos: any[]) => {
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

    const htmlContent = generateHTMLContent(registrationsWithPhotos);
    await page.setContent(htmlContent);
    await page.waitForSelector('h1'); // Wait for the header to ensure content is rendered

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return pdfBuffer;
};

const generateHTMLContent = (registrationsWithPhotos: any[]) => {
    return `
        <html>
        <head>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; border: 1px solid black; }
                img { width: 50px; height: 50px; object-fit: cover; }
            </style>
        </head>
        <body>
            <h1>Registrations List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>College</th>
                        <th>Email</th>
                        <th>Phone</th>
                    </tr>
                </thead>
                <tbody>
                    ${registrationsWithPhotos.map(reg => `
                        <tr>
                            <td><img src="${reg.photoUrl}" /></td>
                            <td>${reg.name}</td>
                            <td>${reg.college}</td>
                            <td>${reg.email}</td>
                            <td>${reg.phone}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;
};

export default router;
