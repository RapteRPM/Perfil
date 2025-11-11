// controllers/enviarCorreo.js
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

/**
 * 📧 Envía un correo electrónico usando Outlook/Office365
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 */
export async function enviarCorreo({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com", // Servidor SMTP de Outlook
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });

  try {
    await transporter.sendMail({
      from: `"RPMMarket" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`📨 Correo enviado correctamente a ${to}`);
    return { success: true, message: "Correo enviado" };
  } catch (err) {
    console.error("❌ Error al enviar correo:", err.message);
    return { success: false, error: err.message };
  }
}
