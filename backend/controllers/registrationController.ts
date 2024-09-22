import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Buffer } from 'buffer';
import { Registration } from '../models/Registration';
import { College } from '../models/College';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import * as path from 'path';
import fs from 'fs';// Import the path module

// Define the path to the invite.pdf file
const invitePdfPath = path.join(__dirname, 'invite.pdf'); 

// Define FileFields interface
interface FileFields {
    photo?: Express.Multer.File[];
    researchPaper?: Express.Multer.File[];
}

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
export const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure nodemailer with Hostinger
// Configure the email transport
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'lmsad6123@gmail.com',
    pass: 'xijxdmkupniydinn',
  },
});

// Middleware to handle file size errors
export const handleFileSizeError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size should not exceed 5MB' });
    }
    next(err); // Fix: Properly close the function with this curly brace
}; // Add a semicolon here to end the function

// Function to convert image buffer to a data URL
const bufferToDataURL = (buffer: Buffer, mimeType: string): string => {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
}; // Add a semicolon here

// Function to generate PDF from HTML
 const generatePDF = async (content: string): Promise<Buffer> => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    try {
        await page.setContent(content, { waitUntil: 'networkidle0' });
    } catch (contentError: any) {
        console.error('Error setting content:', contentError);
        throw new Error('Error setting content');
    }

    let pdfBuffer: Buffer;
    try {
        const pdfArrayBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '40px',
                right: '40px',
                bottom: '40px',
                left: '40px',
            },
        });
        // Convert Uint8Array to Buffer
        pdfBuffer = Buffer.from(pdfArrayBuffer);
    } catch (pdfError: any) {
        console.error('Error generating PDF:', pdfError);
        throw new Error('Error generating PDF');
    }

    await browser.close();

    return pdfBuffer;
};

export const registerUser = async (req: Request, res: Response) => {
    const { name, designation, collegeId, phone, email, reason, collegeName: newCollegeName, committeeMember } = req.body;
    const files = req.files as unknown as FileFields;
    const photo = files?.photo?.[0];
    const researchPaper = files?.researchPaper?.[0];

    try {
        // Validate required fields
        if (!name || !designation || !phone || !email || !reason) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate photo
        if (!photo) {
            return res.status(400).json({ message: 'Photo is required' });
        }

        let college: College | null = null; // Explicitly type college as College | null

        if (designation === 'Chair Person' || designation === 'Principal') {
            if (!collegeId) {
                return res.status(400).json({ message: 'College ID is required for this designation' });
            }
            college = await College.findByPk(collegeId);
            if (!college) {
                return res.status(400).json({ message: 'Invalid college ID' });
            }
        } else if (designation === 'Vice-Chancellor') {
            if (!newCollegeName) {
                return res.status(400).json({ message: 'College name is required for Vice-Chancellor' });
            }
            const existingCollege = await College.findOne({ where: { name: newCollegeName } });
            if (existingCollege) {
                college = existingCollege;
            } else {
                college = await College.create({ name: newCollegeName });
            }
        } else if (designation === 'Council Member') {
            // No college or committeeMember validation needed
        } else {
            return res.status(400).json({ message: 'Invalid designation' });
        }

        const existingUser = await Registration.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        if (photo.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'Photo size should not exceed 5 MB' });
        }

        const eventId = await Registration.count() + 1;
        const paddedEventId = eventId.toString().padStart(4, '0');

        const newRegistration = await Registration.create({
            name,
            designation,
            collegeId: designation === 'Council Member' ? null : college?.id,
            committeeMember: designation === 'Council Member' ? committeeMember : null,
            phone,
            email,
            photo: photo.buffer,
            reason,
            researchPaper: researchPaper?.buffer,
            eventId: parseInt(paddedEventId), // Assign the generated eventId
        });

        // Send response immediately
        res.status(201).json({ message: 'User registered successfully. Email will be sent shortly.' });

        // Email sending logic in setTimeout
        setTimeout(async () => {
            try {
                const confirmationMailOptions = {
                    from: 'lmsad6123@gmail.com',
                    to: 'lmsad6123@gmail.com',
                    subject: 'New Registration',
                    text: `A new user has registered with the following details:\n\n
Name: ${name}
Designation: ${designation}
${designation === 'Council Member' ? `Committee Member: ${committeeMember || 'IIMSTC Council Member'}` : `College: ${college ? college.name : 'N/A'}`}
Phone: ${phone}
Email: ${email}
Reason: ${reason}`,
                    attachments: [
                        {
                            filename: 'photo.jpg',
                            content: photo.buffer,
                            encoding: 'base64'
                        },
                        ...(researchPaper ? [{
                            filename: 'research_paper.pdf',
                            content: researchPaper.buffer,
                            encoding: 'base64'
                        }] : [])
                    ]
                };

                await transporter.sendMail(confirmationMailOptions);

                // Generate and send ID card email
                const photoDataURL = bufferToDataURL(photo.buffer, photo.mimetype);
                const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Business Card</title>
                  <style>
                    body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      background-color: #f5f5f5;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      height: 100vh;
                      margin: 0;
                    }
        
                    .business-card {
                      width: 700px;
                      height: 450px;
                      background: linear-gradient(135deg, #1a73e8 50%, #0077b5 50%);
                      color: #fff;
                      border-radius: 12px;
                      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                      position: relative;
                      overflow: hidden;
                      display: flex;
                      flex-direction: row;
                      justify-content: space-between;
                    }
        
                    .slanted-bg {
                      width: 50%;
                      background-color: #2b2d42;
                      position: absolute;
                      height: 100%;
                      clip-path: polygon(0 0, 100% 0, 70% 100%, 0% 100%);
                      z-index: 1;
                    }
        
                    .photo-container {
                      z-index: 2;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 45%;
                      padding-left: 30px;
                    }
        
                    .photo-container img {
                      width: 200px;
                      height: 200px;
                      border-radius: 8px;
                      border: 5px solid #1a73e8;
                      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                      background-color: #fff;
                    }
        
                    .details-container {
                      z-index: 2;
                      width: 55%;
                      padding: 40px 30px;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                    }
        
                    .card-header {
                      text-align: left;
                    }
        
                    .card-header h2 {
                      margin: 0;
                      font-size: 2.0rem;
                      letter-spacing: 1px;
                      font-weight: 700;
                      color: #f0f0f0;
                    }
        
                    .card-header h3 {
                      margin: 5px 0 ;
                      font-size: 1.4rem;
                      font-weight: 400;
                      color: #f0f0f0;
                    }
        
                    .card-header h4 {
                      margin: 5px 0 20px;
                      font-size: 1.4rem;
                      font-weight: 400;
                      color: #f0f0f0;
                    }
        
                    .card-body {
                      font-size: 1.1rem;
                      color: #f0f0f0;
                    }
        
                    .card-body p {
                      margin: 6px 0;
                      display: flex;
                      align-items: center;
                    }
        
                    .svg-icon {
                      width: 20px;
                      height: 20px;
                      margin-right: 10px;
                    }
        
                    .logo-container {
              position: absolute;
              top: 10px;
              left: 60%; /* Move the logos further to the right */
              transform: translateX(-30%); /* Adjust the centering if needed */
              display: flex;
              justify-content: space-around;
              width: 250px;
            }
            
            .logo-container img:first-child {
              margin-left: 50px;
            }
            
            
            .logo-container img {
              width: 60px;
              height: auto;
            }
        
        
                    /* Bottom logos */
                    .bottom-logo-container {
                      position: absolute;
                      bottom: 10px;
                      left: 68%;
                      transform: translateX(-50%);
                      display: flex;
                      gap: 30px;
                    }
        
                    .bottom-logo-container img {
                      width: 60px; /* Adjust this to match the size of top logos */
                      height: auto;
                    }
                  </style>
                </head>
                <body>
                  <div class="business-card">
                    <div class="slanted-bg"></div>
                    <div class="logo-container">
                      <img src="https://iimstc.com/wp-content/uploads/2024/09/WhatsApp-Image-2024-09-02-at-12.25.43-PM-150x150.jpeg" alt="Logo 1">
                      <img src="https://iimstc.com/wp-content/uploads/2024/09/WhatsApp-Image-2024-09-02-at-8.34.37-AM.jpeg" alt="Logo 2">
                    </div>
                    <div class="photo-container">
                      <img src="${photoDataURL}" alt="User Photo">
                    </div>
                    <div class="details-container">
                      <div class="card-header">
                      <p style="text-align: right; font-weight: bold; font-size: 1.2rem;">Event ID: ${eventId}</p>
                        <h2>${name}</h2>
                        <h3>${designation}</h3>
                        <h4>${designation === 'Council Member' ? ` ${committeeMember || 'IIMSTC Council Member'}` : ` ${college ? college.name : 'N/A'}`}</h4>
                      </div>
                      <div class="card-body">
                        <p>
                         
                        </p>
                        <p>
                        
                        </p>
                       
                      </div>
                    </div>
                    <div class="bottom-logo-container">
                      <img src="https://www.ecindia.org/Fourth-comming-event/ECI-WB.png" alt="Bottom Logo">
                      <img src="https://vectorseek.com/wp-content/uploads/2023/09/AICTE-Logo-Vector.svg-.png" alt="Bottom Logo">
                      <img src="https://presentations.gov.in/wp-content/uploads/2020/06/UGC-Preview.png?x31571" alt="Bottom Logo">
        
                    </div>
                  </div>
                </body>
                </html>
                `;
        
               const pdfBuffer = await generatePDF(htmlContent);
         const invitePdf = fs.readFileSync(invitePdfPath);
        
        const mailOptions = {
          from: 'lmsad6123@gmail.com',
          to: 'lmsad6123@gmail.com',
          subject: 'Invitation Confirmation for "Diamond Beneath Your Feet" Event',
          html: `
            <p>Respected <b>${name}</b>,</p>
            <p>Greetings from the <b>International Institute of Medical Science & Technology Council (IIMSTC)</b>.</p>
            <p>
              Thank you for registering as a <b>Special Guest/Guest</b> at our upcoming international event, 
              <b>"Diamond Beneath Your Feet,"</b> on <b>Monday, September 23, 2024</b>, at 
              <b>Hotel Lalith Ashok, Bangalore</b>, from <b>10 AM to 1 PM</b>.
              This prestigious event will feature a major announcement about 
              <b>international internship opportunities</b> for economically underprivileged Indian students, 
              including <b>stipends and scholarships</b>.
            </p>
            <p>
              An <b>identity card</b> is attached to this email. Please ensure you bring this ID for entry purposes. 
              Kindly note, entry is exclusive to the registered guest, and 
              <b>nominees, proxy representatives, personal assistants, secretaries, or drivers</b> 
              will not be permitted in the hall.
            </p>
            <p>We are honoured to welcome you to this event and look forward to hosting you.</p>
            <p>Warm regards,<br><b>Welcome Committee</b></p>
          `,
          attachments: [
            {
              filename: 'IDCard.pdf',
              content: pdfBuffer,
              encoding: 'base64'
            },
            {
              filename: 'invite.pdf',
              content: invitePdf,
              encoding: 'base64'
            }
          ]
        };
        

                await transporter.sendMail(mailOptions);
                console.log('Email sent successfully');
            } catch (emailError) {
                console.error('Error sending email:', emailError);
            }
        }, 2000); // Delay of 2 seconds

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
const genPDF = async (content: string): Promise<Buffer> => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080',
        ],
    });
    const page = await browser.newPage();

    try {
        await page.setContent(content, { waitUntil: 'networkidle0' });
        const pdfArrayBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '40px',
                right: '40px',
                bottom: '40px',
                left: '40px',
            },
        });
        return Buffer.from(pdfArrayBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Error generating PDF');
    } finally {
        await browser.close();
    }
};

export const generateAllRegistrationsPDF = async (req: Request, res: Response) => {
    try {
        const registrations = await Registration.findAll({
            include: [
                {
                    model: College,
                    as: 'college',
                    attributes: ['name'],
                },
            ],
            order: [['eventId', 'ASC']], // Sort by eventId in ascending order
            offset: 130, // Skip the first 30 registrations
            limit: 10,  // Limit to the next 30 registrations (31 to 60)
        });

        // Map each registration and convert the photo buffer to base64
        const registrationsWithBase64Photos = registrations.map(reg => {
            const photoBuffer = reg.photo as Buffer; // Cast to Buffer if necessary
            const photoUrl = photoBuffer
                ? `data:image/jpeg;base64,${photoBuffer.toString('base64')}`
                : null;

            return {
                ...reg.toJSON(),
                photoUrl,
            };
        });

        if (registrationsWithBase64Photos.length === 0) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        // Prepare HTML content for the PDF
        let registrationRows = registrationsWithBase64Photos.map(reg => `
            <tr>
                <td><img src="${reg.photoUrl}" alt="Photo" width="100" height="100"/></td>
                <td>${reg.name}</td>
                <td>${reg.designation}</td>
                <td>${reg.college ? reg.college.name : 'N/A'}</td>
                <td>${reg.phone}</td>
                <td>${reg.email}</td>
                <td>${reg.eventId}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Registrations List</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
                    th { background-color: #f2f2f2; }
                    img { border-radius: 50%; }
                </style>
            </head>
            <body>
                <h1>Registrations List</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>College</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Event ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrationRows}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const pdfBuffer = await genPDF(htmlContent);

        // Send PDF as a response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="registrations.pdf"',
        });
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF for registrations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


export const getAllRegistrations = async (req: Request, res: Response) => {
    try {
        const registrations = await Registration.findAll({
            include: [
                {
                    model: College,
                    as: 'college',
                    attributes: ['name'],
                },
            ],
        });

        if (registrations.length === 0) {
            return res.status(404).json({ message: 'No registrations found' });
        }

        res.status(200).json(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
