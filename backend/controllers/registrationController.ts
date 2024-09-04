import { Request, Response } from 'express';
import { DailyLog } from '../models/dailyLog';
import pdf from 'html-pdf';

export const generateDailyLogReport = async (req: Request, res: Response) => {
  const userId = req.params.userId;

  try {
    const dailyLogs = await DailyLog.findAll({ where: { userId } });

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student's Daily Diary/Daily Log</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10mm auto;
            background: white;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-top: 20px;
          }
          .subtitle {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            color: #008080; 
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          table, th, td {
            border: 1px solid rgb(0, 0, 0, 1);
          }
          th, td {
            padding: 6px;
            text-align: left;
          }
          .signature {
            margin-top: 20px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>`;

    dailyLogs.forEach((log) => {
      htmlContent += `
        <div class="page">
          <img src="https://ams-multitenant-prod.s3.ap-south-1.amazonaws.com/egenius_multitenant-s3/c8d31366-60d7-4c2b-8c4f-627911d8bdb1/64e9946a-b35d-4d09-a41d-0db31520c180/b2ee9dbb-20d6-4530-ad92-6e3c1503244c/Event/meyRSHwnQWq9y1zTtcT1PeIimouTQ2ko7RwTVIik.png" alt="Description of the image" width="800px" /> 
          <div class="subtitle">FORMAT 5: STUDENT'S DAILY DIARY/DAILY LOG</div>
          <table>
            <tr>
              <th style="font-weight: normal;">DAY-${log.day}</th>
              <th style="font-weight: normal;">${log.studentName}</th>
              <th style="font-weight: normal;">DATE</th>
              <th colspan="2">${log.date}</th>
            </tr>
            <tr>
              <td>Time of arrival</td>
              <td>&emsp;&emsp;&emsp;${log.arrivalTime}&emsp;&emsp;&emsp;&emsp;&emsp;</td>
              <td>Time of Departure</td>
              <td>&emsp;&emsp;&emsp;${log.departureTime}&emsp;&emsp;&emsp;&emsp;&emsp;</td>
              <td>Remarks &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;</td>
            </tr>
            <tr>
              <td>Deptt./Division</td>
              <td>${log.department}</td>
              <td>Name of finished Product</td>
              <td colspan="2">${log.finishedProduct}</td>
            </tr>
            <tr>
              <td rowspan="4" colspan="1">Name of HOD/Supervisor With e-mail id</td>
            </tr>
            <tr>
              <td>${log.hodName}</td>
              <td colspan="4">${log.hodEmail}</td>
            </tr>
            <tr>
              <td></td>
              <td colspan="4"></td>
            </tr>
            <tr>
              <td></td>
              <td colspan="4"></td>
            </tr>
            <tr>
              <td colspan="2">Main points of the day</td>
              <td colspan="3">${log.mainPoints}</td>
            </tr>
            <tr>
              <td colspan="5" style="height: 600px;">${log.details}</td>
            </tr>
          </table>
          <div class="signature">
            Signature of Industry Supervisor
          </div><br>
          <img src="https://ams-multitenant-prod.s3.ap-south-1.amazonaws.com/egenius_multitenant-s3/c8d31366-60d7-4c2b-8c4f-627911d8bdb1/64e9946a-b35d-4d09-a41d-0db31520c180/b2ee9dbb-20d6-4530-ad92-6e3c1503244c/Event/6wS3S3BJbgIoVIma1qtXCGj4NiDrzXWPYr7DsG9g.png" alt="Description of the image" width="800px" /> 
        </div>`;
    });

    htmlContent += `
      </body>
      </html>`;

    pdf.create(htmlContent, { format: 'A4', orientation: 'portrait', border: '10mm', timeout: 60000 }).toStream((err, stream) => {
      if (err) {
        console.error('Error generating PDF:', err);
        return res.status(500).json({ success: false, message: 'Error generating daily log report' });
      }

      res.setHeader('Content-type', 'application/pdf');
      stream.pipe(res);
    });

  } catch (error) {
    console.error('Error generating daily log report:', error);
    res.status(500).json({ success: false, message: 'Error generating daily log report' });
  }
};
