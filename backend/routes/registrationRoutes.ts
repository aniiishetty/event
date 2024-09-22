import express, { Request, Response } from 'express';
import upload from '../middleware/upload'; // Adjust the path if needed
import { registerUser, getAllRegistrations } from '../controllers/registrationController';
import puppeteer from 'puppeteer';

const router = express.Router();

// Apply the upload middleware to handle file uploads
router.post('/register', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'researchPaper', maxCount: 1 }]), registerUser);
router.get('/', getAllRegistrations);

router.post('/generate-pdf', async (req: Request, res: Response) => {
    const { registrations } = req.body; // Expect registrations from frontend

    try {
        const browser = await puppeteer.launch();
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
                        ${registrations
                            .map(
                                (reg: any) => `
                                <tr>
                                    <td><img src="${reg.photoUrl || 'path/to/placeholder-image.png'}" /></td>
                                    <td>${reg.name}</td>
                                    <td>${reg.college ? reg.college.name : 'N/A'}</td>
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

        await page.setContent(htmlContent);
        const pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close();

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=registrations_list.pdf',
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

export default router;
