import { sessionService, ChatSession } from "./sessionService";
import { Resend } from "resend";

export interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;
  private config: {
    fromEmail?: string;
  } = {};

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || "dummy_key");
    this.config.fromEmail =
      process.env.RESEND_FROM_EMAIL || "noreply@hormax.com.ar";
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  setConfig(config: Partial<EmailService["config"]>) {
    this.config = { ...this.config, ...config };
  }

  // Enviar email usando Resend
  async sendEmail(emailConfig: EmailConfig): Promise<boolean> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;

      // Si no hay API key configurada, mostrar logs en desarrollo
      if (!resendApiKey || resendApiKey === "re_your_api_key_here") {
        console.log("📧 EMAIL ENVIADO (Modo Desarrollo - Sin API Key):");
        console.log("Para:", emailConfig.to);
        console.log("Asunto:", emailConfig.subject);
        console.log("Cuerpo:", emailConfig.body);
        console.log("---");
        console.log(
          "⚠️ Para enviar emails reales, configura RESEND_API_KEY en .env.local",
        );
        console.log(
          "⚠️ Regístrate en https://resend.com para obtener tu API key gratuita",
        );
        return true;
      }

      // Mostrar email completo en consola para debugging
      console.log("📧 CONTENIDO COMPLETO DEL EMAIL:");
      console.log("=".repeat(80));
      console.log("Para:", emailConfig.to);
      console.log("Asunto:", emailConfig.subject);
      console.log("HTML:");
      console.log(emailConfig.body);
      console.log("=".repeat(80));

      // Guardar email en archivo HTML para visualización rápida
      try {
        const fs = require("fs").promises;
        const path = require("path");

        // Crear nombre de archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `email-${timestamp}.html`;
        const filePath = path.join(process.cwd(), "emails", fileName);

        // Crear carpeta si no existe
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        // Guardar archivo HTML
        await fs.writeFile(filePath, emailConfig.body, "utf8");

        console.log("📁 Email guardado en:", filePath);
        console.log("🌐 Abre el archivo en tu browser para ver el diseño");
      } catch (error) {
        console.error("Error al guardar email en archivo:", error);
      }

      // Enviar email real con Resend
      const { data, error } = await this.resend.emails.send({
        from:
          emailConfig.from || this.config.fromEmail || "noreply@hormax.com.ar",
        to: [emailConfig.to],
        subject: emailConfig.subject,
        html: emailConfig.body.replace(/\n/g, "<br>"),
      });

      if (error) {
        console.error("Error al enviar email con Resend:", error);
        return false;
      }

      console.log("📧 Email enviado exitosamente con Resend:", data);
      return true;
    } catch (error) {
      console.error("Error al enviar email:", error);
      return false;
    }
  }

  // Enviar resumen de sesión
  async sendSessionSummary(
    sessionId: string,
    toEmail: string = "emcon84@gmail.com",
  ): Promise<boolean> {
    const summary = sessionService.generateSessionSummary(sessionId);
    if (!summary) {
      console.error("No se pudo generar el resumen de la sesión:", sessionId);
      return false;
    }

    const session = sessionService.getSession(sessionId);
    if (!session) {
      console.error("Sesión no encontrada:", sessionId);
      return false;
    }

    const subject = `🏗️ Nueva sesión HORMAX - ${session.userData.name} (${this.getUserTypeLabel(session.userData.userType)})`;

    return await this.sendEmail({
      to: toEmail,
      subject,
      body: summary,
      from: this.config.fromEmail || "noreply@hormax.com.ar",
    });
  }

  // Enviar resúmenes de sesiones completadas
  async sendCompletedSessionsSummaries(
    toEmail: string = "emcon84@gmail.com",
  ): Promise<boolean[]> {
    const completedSessions = sessionService.getCompletedSessions();
    const results: boolean[] = [];

    for (const session of completedSessions) {
      const success = await this.sendSessionSummary(session.id, toEmail);
      results.push(success);
    }

    return results;
  }

  // Enviar reporte diario de sesiones
  async sendDailyReport(
    toEmail: string = "emcon84@gmail.com",
  ): Promise<boolean> {
    const allSessions = sessionService.getAllSessions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = allSessions.filter(
      (session) => session.startTime >= today,
    );

    let report = `📊 **REPORTE DIARIO HORMAX**\n\n`;
    report += `📅 Fecha: ${new Date().toLocaleDateString("es-AR")}\n\n`;

    report += `📈 **ESTADÍSTICAS DEL DÍA**\n`;
    report += `• Total de sesiones: ${todaySessions.length}\n`;
    report += `• Sesiones completadas: ${todaySessions.filter((s) => s.status === "completed").length}\n`;
    report += `• Sesiones activas: ${todaySessions.filter((s) => s.status === "active").length}\n`;
    report += `• Sesiones abandonadas: ${todaySessions.filter((s) => s.status === "abandoned").length}\n\n`;

    // Usuarios por tipo
    const usersByType = todaySessions.reduce(
      (acc, session) => {
        acc[session.userData.userType] =
          (acc[session.userData.userType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    report += `👥 **USUARIOS POR TIPO**\n`;
    Object.entries(usersByType).forEach(([type, count]) => {
      report += `• ${this.getUserTypeLabel(type)}: ${count}\n`;
    });

    // Usuarios con contacto
    const usersWithContact = todaySessions.filter(
      (s) => s.userData.email || s.userData.phone,
    );
    report += `\n📞 **USUARIOS CON DATOS DE CONTACTO**: ${usersWithContact.length}/${todaySessions.length} (${Math.round((usersWithContact.length / todaySessions.length) * 100)}%)\n\n`;

    // Sesiones con más mensajes (más engagement)
    const topSessions = todaySessions
      .sort((a, b) => b.messages.length - a.messages.length)
      .slice(0, 3);

    if (topSessions.length > 0) {
      report += `🔥 **TOP 3 SESIONES CON MÁS INTERACCIÓN**\n`;
      topSessions.forEach((session, index) => {
        report += `${index + 1}. ${session.userData.name} - ${session.messages.length} mensajes\n`;
      });
    }

    // Usuarios interesados (sesiones completadas con wizard)
    const interestedUsers = todaySessions.filter(
      (s) =>
        s.status === "completed" &&
        s.wizardAnswers &&
        Object.keys(s.wizardAnswers).length > 0,
    );

    if (interestedUsers.length > 0) {
      report += `\n⭐ **USUARIOS MÁS INTERESADOS** (completaron wizard)\n`;
      interestedUsers.forEach((session) => {
        const contact =
          session.userData.email || session.userData.phone || "Sin contacto";
        report += `• ${session.userData.name} (${this.getUserTypeLabel(session.userData.userType)}) - ${contact}\n`;
      });
    }

    report += `\n---\n`;
    report += `Este reporte fue generado automáticamente por HORMAX Chat Assistant\n`;

    return await this.sendEmail({
      to: toEmail,
      subject: `📊 Reporte diario HORMAX - ${new Date().toLocaleDateString("es-AR")}`,
      body: report,
      from: this.config.fromEmail || "noreply@hormax.com.ar",
    });
  }

  // Enviar reporte semanal
  async sendWeeklyReport(
    toEmail: string = "emcon84@gmail.com",
  ): Promise<boolean> {
    const allSessions = sessionService.getAllSessions();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekSessions = allSessions.filter(
      (session) => session.startTime >= oneWeekAgo,
    );

    let report = `📊 **REPORTE SEMANAL HORMAX**\n\n`;
    report += `📅 Período: ${oneWeekAgo.toLocaleDateString("es-AR")} - ${new Date().toLocaleDateString("es-AR")}\n\n`;

    report += `📈 **ESTADÍSTICAS DE LA SEMANA**\n`;
    report += `• Total de sesiones: ${weekSessions.length}\n`;
    report += `• Sesiones completadas: ${weekSessions.filter((s) => s.status === "completed").length}\n`;
    report += `• Sesiones activas: ${weekSessions.filter((s) => s.status === "active").length}\n`;
    report += `• Promedio de mensajes por sesión: ${weekSessions.length > 0 ? Math.round(weekSessions.reduce((acc, s) => acc + s.messages.length, 0) / weekSessions.length) : 0}\n\n`;

    // Tendencia vs semana anterior
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const previousWeekSessions = allSessions.filter(
      (session) =>
        session.startTime >= twoWeeksAgo && session.startTime < oneWeekAgo,
    );

    if (previousWeekSessions.length > 0) {
      const growth = Math.round(
        ((weekSessions.length - previousWeekSessions.length) /
          previousWeekSessions.length) *
          100,
      );
      const trend = growth >= 0 ? "📈" : "📉";
      report += `📊 **TENDENCIA VS SEMANA ANTERIOR**: ${trend} ${growth}% (${previousWeekSessions.length} → ${weekSessions.length} sesiones)\n\n`;
    }

    report += `---\n`;
    report += `Este reporte fue generado automáticamente por HORMAX Chat Assistant\n`;

    return await this.sendEmail({
      to: toEmail,
      subject: `📊 Reporte semanal HORMAX - ${oneWeekAgo.toLocaleDateString("es-AR")} al ${new Date().toLocaleDateString("es-AR")}`,
      body: report,
      from: this.config.fromEmail || "noreply@hormax.com.ar",
    });
  }

  // Helper functions
  private getUserTypeLabel(userType: string): string {
    const labels = {
      particular: "Particular",
      constructor: "Constructor",
      arquitecto: "Arquitecto",
      ingeniero: "Ingeniero",
      empresa: "Empresa",
    };
    return labels[userType as keyof typeof labels] || userType;
  }
}

// Exportar instancia singleton
export const emailService = EmailService.getInstance();
