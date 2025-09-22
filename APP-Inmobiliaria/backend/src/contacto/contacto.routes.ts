import nodemailer from 'nodemailer';
import { Request, Response, Router } from 'express';


export const contactoRouter = Router();

contactoRouter.post('/send-email', async (req: Request, res: Response) => {
    const { nombre, apellido, celular, email, mensaje } = req.body as {
        nombre: string;
        apellido: string;
        celular?: string;
        email: string;
        mensaje: string;
    };

    if (!nombre || !apellido || !email || !mensaje) {
        return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail'
        });

        const mailOptions = {
            from: `"${nombre} ${apellido}" <${email}>`,
            to: 'tomassuarez2002@gmail.com',
            subject: `Nuevo mensaje de ${nombre} - London House`,
            html: `
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Apellido:</strong> ${apellido}</p>
                <p><strong>Celular:</strong> ${celular || 'No proporcionado'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensaje:</strong> ${mensaje}</p>
            `
        }

        await transporter.sendMail(mailOptions);
        res.status(200).json({ status: 'success', message: 'Mensaje enviado con éxito.' });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ status: 'error', message: 'Error al enviar el mensaje.' });
    }
});