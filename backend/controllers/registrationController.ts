import { Request, Response } from 'express';
import { Registration } from '../models/Registration';
import { College } from '../models/College';
import multer from 'multer';
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

export const registerUser = async (req: Request, res: Response) => {
    const { name, designation, collegeId, phone, email, reason } = req.body;
    const files = req.files as FileFields; // Cast to the FileFields interface
    const photo = files?.photo?.[0]?.buffer; // Get photo buffer from request
    const researchPaper = files?.researchPaper?.[0]?.buffer; // Get research paper buffer from request

    try {
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
                message: `The college ${collegeName} is already registered by another user. Please contact support if this is a mistake.` 
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
            photo,
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
                    content: photo,
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
