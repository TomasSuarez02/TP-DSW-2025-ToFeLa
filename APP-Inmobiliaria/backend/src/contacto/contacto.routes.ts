// contactoRouter.ts

import nodemailer from 'nodemailer';
import { Request, Response, Router } from 'express';

export const contactoRouter = Router();

// Define una interfaz para asegurar que los datos del cuerpo de la petición sean correctos
interface ContactFormBody {
    nombre: string;
    apellido: string;
    celular?: string; // El celular es opcional, como lo tipaste
    email: string;
    mensaje: string;
}

contactoRouter.post('/send-email', async (req: Request, res: Response) => {
    // Tipado de los datos del body
    const { nombre, apellido, celular, email, mensaje } = req.body as ContactFormBody;

    // Validación de los campos obligatorios
    if (!nombre || !apellido || !email || !mensaje) {
        return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios.' });
    }

    try {
        // Configuración del transporter con autenticación
        // Aquí debes reemplazar los valores con tus credenciales de Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'proyectodswtest@gmail.com',
                pass: 'iquo djrc wuxn lliz' // Usa una App Password si tienes 2FA habilitado
            }
        });

        // Contenido del correo en formato HTML
        const mailOptions = {
            from: `"${nombre} ${apellido}" <${email}>`,
            to: 'proyectodswtest@gmail.com', // Cambia esto por el correo que recibirá los mensajes
            subject: `Nuevo mensaje de ${nombre} - London House`,
            html: `
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Apellido:</strong> ${apellido}</p>
                <p><strong>Celular:</strong> ${celular || 'No proporcionado'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensaje:</strong> ${mensaje}</p>
            `
        };

        // Envía el correo
        await transporter.sendMail(mailOptions);
        res.status(200).json({ status: 'success', message: 'Mensaje enviado con éxito.' });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ status: 'error', message: 'Error al enviar el mensaje.' });
    }
});