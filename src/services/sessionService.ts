export interface WelcomeWizardData {
  name: string;
  userType:
    | "particular"
    | "constructor"
    | "arquitecto"
    | "ingeniero"
    | "empresa";
  email?: string;
  phone?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userData: WelcomeWizardData;
  messages: ChatMessage[];
  wizardAnswers?: Record<string, string>;
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "abandoned";
}

// Base de datos en memoria (en producción sería una BD real)
const sessions: Map<string, ChatSession> = new Map();

export const sessionService = {
  // Crear nueva sesión
  createSession(userData: WelcomeWizardData): string {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: ChatSession = {
      id: sessionId,
      userData,
      messages: [],
      startTime: new Date(),
      status: "active",
    };

    sessions.set(sessionId, session);
    return sessionId;
  },

  // Obtener sesión
  getSession(sessionId: string): ChatSession | undefined {
    return sessions.get(sessionId);
  },

  // Agregar mensaje a sesión
  addMessage(
    sessionId: string,
    message: Omit<ChatMessage, "timestamp">,
  ): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.messages.push({
      ...message,
      timestamp: new Date(),
    });

    return true;
  },

  // Actualizar wizard answers
  updateWizardAnswers(
    sessionId: string,
    answers: Record<string, string>,
  ): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.wizardAnswers = answers;
    return true;
  },

  // Finalizar sesión
  completeSession(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.endTime = new Date();
    session.status = "completed";

    return true;
  },

  // Obtener todas las sesiones
  getAllSessions(): ChatSession[] {
    return Array.from(sessions.values());
  },

  // Obtener sesiones activas
  getActiveSessions(): ChatSession[] {
    return Array.from(sessions.values()).filter((s) => s.status === "active");
  },

  // Obtener sesiones completadas
  getCompletedSessions(): ChatSession[] {
    return Array.from(sessions.values()).filter(
      (s) => s.status === "completed",
    );
  },

  // Eliminar sesión
  deleteSession(sessionId: string): boolean {
    return sessions.delete(sessionId);
  },

  // Generar resumen de sesión para email (HTML con diseño profesional)
  generateSessionSummary(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const duration = session.endTime
      ? Math.round(
          (session.endTime.getTime() - session.startTime.getTime()) / 60000,
        )
      : Math.round(
          (new Date().getTime() - session.startTime.getTime()) / 60000,
        );

    const hasContact = !!(session.userData.email || session.userData.phone);
    const isInterested = session.messages.length >= 5;
    const hasProject = !!(
      session.wizardAnswers && Object.keys(session.wizardAnswers).length > 0
    );

    // Calcular score de interés
    let interestScore = 0;
    if (hasContact) interestScore += 30;
    if (isInterested) interestScore += 40;
    if (hasProject) interestScore += 30;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Sesion HORMAX - ${session.userData.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background: #0d0e0f;
            padding: 20px;
            color: #18181a;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 1px solid #282b2d;
        }
        
        .header {
            background: #c51216;
            color: #f0eeeb;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: #e8e6e3;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #c51216;
        }
        
        .info-card .label {
            font-size: 12px;
            color: #9a9896;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .info-card .value {
            font-size: 16px;
            font-weight: 600;
            color: #18181a;
        }
        
        .contact-info {
            background: #e8e6e3;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #d4d2cf;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #18181a;
        }
        
        .contact-item:last-child {
            margin-bottom: 0;
        }
        
        .conversation {
            background: #e8e6e3;
            padding: 20px;
            border-radius: 8px;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #d4d2cf;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 8px;
        }
        
        .message.user {
            background: #ffffff;
            margin-left: 20px;
            border: 1px solid #d4d2cf;
        }
        
        .message.assistant {
            background: #1e2022;
            margin-right: 20px;
            color: #f0eeeb;
        }
        
        .message .sender {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .message.user .sender {
            color: #c51216;
        }
        
        .message.assistant .sender {
            color: #f0eeeb;
        }
        
        .message .content {
            font-size: 14px;
            line-height: 1.4;
        }
        
        .message.user .content {
            color: #18181a;
        }
        
        .message.assistant .content {
            color: #f0eeeb;
        }
        
        .score-card {
            background: #c51216;
            color: #f0eeeb;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }
        
        .score-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgb(255, 190, 0);
        }
        
        .score-number {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .score-label {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .actions {
            background: #fff3cd;
            border: 2px solid rgb(255, 190, 0);
            padding: 20px;
            border-radius: 8px;
        }
        
        .action-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            color: #5a5856;
        }
        
        .action-item:last-child {
            margin-bottom: 0;
        }
        
        .footer {
            background: #1d1d1b;
            padding: 30px;
            text-align: center;
            color: #f0eeeb;
            font-size: 14px;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: #c51216;
            margin-bottom: 10px;
        }
        
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏗️ HORMAX</div>
            <h1>Nueva Sesion de Cliente</h1>
            <div class="subtitle">Resumen automático de conversación</div>
        </div>
        
        <div class="content">
            <div class="info-grid">
                <div class="info-card">
                    <div class="label">Cliente</div>
                    <div class="value">${session.userData.name}</div>
                </div>
                <div class="info-card">
                    <div class="label">Tipo</div>
                    <div class="value">${this.getUserTypeLabel(session.userData.userType)}</div>
                </div>
                <div class="info-card">
                    <div class="label">Duración</div>
                    <div class="value">${duration} minutos</div>
                </div>
                <div class="info-card">
                    <div class="label">Fecha</div>
                    <div class="value">${session.startTime.toLocaleDateString("es-AR")}</div>
                </div>
            </div>
            
            ${
              hasContact
                ? `
            <div class="section">
                <div class="section-title">📞 Datos de Contacto</div>
                <div class="contact-info">
                    ${
                      session.userData.email
                        ? `
                    <div class="contact-item">
                        <span>📧</span>
                        <span>${session.userData.email}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      session.userData.phone
                        ? `
                    <div class="contact-item">
                        <span>📱</span>
                        <span>${session.userData.phone}</span>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
            `
                : ""
            }
            
            <div class="section">
                <div class="section-title">📊 Score de Interés</div>
                <div class="score-card">
                    <div class="score-number">${interestScore}%</div>
                    <div class="score-label">Probabilidad de conversión</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🎯 Acciones Recomendadas</div>
                <div class="actions">
                    ${
                      hasContact
                        ? `
                    <div class="action-item">
                        <span>✅</span>
                        <span>Contactar inmediatamente - el usuario dejó sus datos</span>
                    </div>
                    `
                        : `
                    <div class="action-item">
                        <span>⚠️</span>
                        <span>Usuario no dejó contacto - intentar en próxima interacción</span>
                    </div>
                    `
                    }
                    ${
                      isInterested
                        ? `
                    <div class="action-item">
                        <span>✅</span>
                        <span>Conversación sustancial - usuario muy interesado</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      hasProject
                        ? `
                    <div class="action-item">
                        <span>✅</span>
                        <span>Proyecto definido - listo para cotización</span>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">💬 Conversación (${session.messages.length} mensajes)</div>
                <div class="conversation">
                    ${session.messages
                      .slice(0, 6)
                      .map(
                        (msg, index) => `
                    <div class="message ${msg.role}">
                        <div class="sender">${msg.role === "user" ? "👤 " + session.userData.name : "🤖 MAX"}</div>
                        <div class="content">${msg.content.length > 150 ? msg.content.substring(0, 150) + "..." : msg.content}</div>
                    </div>
                    `,
                      )
                      .join("")}
                    ${
                      session.messages.length > 6
                        ? `
                    <div style="text-align: center; color: #666; font-style: italic; padding: 10px;">
                        ... y ${session.messages.length - 6} mensajes más
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="logo">HORMAX</div>
            <div>Este resumen fue generado automáticamente por HORMAX Chat Assistant</div>
            <div>${new Date().toLocaleString("es-AR")}</div>
        </div>
    </div>
</body>
</html>
    `;

    return html;
  },

  // Helper functions
  getUserTypeLabel(userType: string): string {
    const labels = {
      particular: "Particular",
      constructor: "Constructor",
      arquitecto: "Arquitecto",
      ingeniero: "Ingeniero",
      empresa: "Empresa",
    };
    return labels[userType as keyof typeof labels] || userType;
  },

  getStatusLabel(status: string): string {
    const labels = {
      active: "Activa",
      completed: "Completada",
      abandoned: "Abandonada",
    };
    return labels[status as keyof typeof labels] || status;
  },
};
