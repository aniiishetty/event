import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { Registration } from '../models/Registration';
import { College } from '../models/College';
import nodemailer from 'nodemailer';

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure nodemailer with Gmail
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'anishetty391@gmail.com',
        pass: 'dbaqgxwsxmajreyt',
    },
});

interface FileFields {
    photo?: Express.Multer.File[];
    researchPaper?: Express.Multer.File[];
}

// Middleware to handle file size errors
const handleFileSizeError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size should not exceed 5MB' });
    }
    next(err); // Pass other errors to the default error handler
};

export const registerUser = async (req: Request, res: Response) => {
    const { name, designation, collegeId, phone, email, reason } = req.body;
    const files = req.files as FileFields; // Cast to the FileFields interface
    const photo = files?.photo?.[0]; // Get the photo file from request
    const researchPaper = files?.researchPaper?.[0]?.buffer; // Get research paper buffer from request

    try {
        // Check if the photo size exceeds 1MB
        if (photo && photo.size > 1 * 1024 * 1024) {
            return res.status(400).json({ message: 'Photo size should not exceed 1MB' });
        }

        const photoBuffer = photo?.buffer;

        // Check if the email already exists
        const existingUser = await Registration.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Check if the collegeId is already registered
        const existingCollegeUser = await Registration.findOne({ where: { collegeId } });
        if (existingCollegeUser) {
            const college = await College.findByPk(collegeId);
            const collegeName = college ? college.name : 'Unknown College';
            return res.status(400).json({ 
                message: `The college ${collegeName} is already registered by another user. Please reach out to the concerned team or <a href="mailto:admin@iimstc.com">contact admin@iimstc.com</a> for assistance.` 
            });
        }

        // Get the college name from the college table
        const college = await College.findByPk(collegeId);
        const collegeName = college ? college.name : 'Unknown College';

        // Insert the new registration
        const newRegistration = await Registration.create({
            name,
            designation,
            collegeId,
            phone,
            email,
            photo: photoBuffer,
            reason,
            researchPaper
        });

        // Send email to the representative with the user's photo and research paper if available
        const repMailOptions = {
            from: 'anishetty391@gmail.com',
            to: 'aniiivocal456@gmail.com',
            subject: 'New Registration',
            text: `
                A new user has registered with the following details:

                Name: ${name}
                Designation: ${designation}
                College: ${collegeName}
                Phone: ${phone}
                Email: ${email}
                Reason: ${reason}

                Please find the attached photo of the user.
            `,
            attachments: [
                {
                    filename: 'photo.jpg',
                    content: photoBuffer,
                    encoding: 'base64'
                },
                ...(researchPaper ? [{
                    filename: 'research_paper.pdf',
                    content: researchPaper,
                    encoding: 'base64'
                }] : [])
            ]
        };

        transporter.sendMail(repMailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email to representative:', error);
            } else {
                console.log('Email sent to representative:', info.response);
            }
        });

        res.status(201).json({ message: 'User registered successfully', id: newRegistration.id });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
