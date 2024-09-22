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
                college: registration.college ? registration.college.name : 'N/A', // Accessing associated college
                email: registration.email,
                phone: registration.phone,
                photoUrl,
            };
        });

        // Start Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 60000, // Set a higher timeout limit
        });
        const page = await browser.newPage();

        // Generate HTML content for the PDF
        const htmlContent = `
            <html>
            <head>
                <style>
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 8px;
                        border: 1px solid black;
                    }
                    img {
                        width: 50px;
                        height: 50px;
                        object-fit: cover;
                    }
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
                        ${registrationsWithPhotos
                            .map(
                                (reg) => `
                                <tr>
                                    <td><img src="${reg.photoUrl}" /></td>
                                    <td>${reg.name}</td>
                                    <td>${reg.college}</td>
                                    <td>${reg.email}</td>
                                    <td>${reg.phone}</td>
                                </tr>`
                            )
                            .join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Set content in Puppeteer
        await page.setContent(htmlContent);

        // Wait for 3 seconds to ensure the content is fully loaded
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate the PDF
        const pdfBuffer = await page.pdf({ format: 'A4' });

        // Close Puppeteer
        await browser.close();

        // Set headers and send the PDF as a response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=registrations_list.pdf',
        });

        res.send(pdfBuffer);
    } catch (error: unknown) {
        console.error('Error generating PDF:', error);

        // Safely handle the error
        const errorMessage = (error instanceof Error) ? error.message : 'Unknown error occurred';
        res.status(500).json({
            message: 'Error generating PDF',
            error: errorMessage,
        });
    }
});

export default router;
