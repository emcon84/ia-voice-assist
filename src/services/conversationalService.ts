export interface ConversationContext {
  topic: string;
  step: number;
  answers: Record<string, any>;
  completed: boolean;
  recommendation?: string;
}

export interface DialogueStep {
  id: string;
  question: string;
  options?: string[];
  contextKey: string;
  nextStep?: string;
}

export interface DialogueFlow {
  topic: string;
  detection: string[];
  steps: DialogueStep[];
  generateRecommendation: (answers: Record<string, any>) => string;
}

class ConversationalService {
  private activeContexts: Map<string, ConversationContext> = new Map();

  private dialogues: DialogueFlow[] = [
    {
      topic: "platea_hormigon",
      detection: [
        "platea",
        "platea para casa",
        "losa de piso",
        "piso de hormigón",
        "fundación para casa",
      ],
      steps: [
        {
          id: "tipo_casa",
          question:
            "¡Hola! 👋 Te ayudo con gusto con tu platea.\n\nPara darte la mejor recomendación, contame un poco más:\n\n� **¿Qué tipo de construcción es?**\n\na) Casa familiar simple\nb) Casa con varios niveles\nc) Quincho o galponcito\nd) Algo más específico",
          options: ["casa_simple", "casa_niveles", "quincho", "otro"],
          contextKey: "tipo",
        },
        {
          id: "suelo_terreno",
          question:
            "Perfecto, ahora necesito saber del terreno:\n\n🌍 **¿Cómo está el suelo donde vas a construir?**\n\na) Tierra normal, no se hunde mucho\nb) Terreno un poco blando\nc) Muy blando o con agua\nd) No estoy seguro",
          options: [
            "suelo_normal",
            "suelo_blando",
            "suelo_muy_blando",
            "no_se",
          ],
          contextKey: "suelo",
        },
        {
          id: "uso_platea",
          question:
            "Entendido. Última pregunta:\n\n🏗️ **¿Qué va arriba de esta platea?**\n\na) Solo la casa normal\nb) Autos o vehículos pesados\nc) Maquinaria o cosas pesadas\nd) No sé todavía",
          options: ["casa_normal", "vehiculos", "maquinaria", "no_se"],
          contextKey: "uso",
        },
      ],
      generateRecommendation: (answers: Record<string, any>) => {
        const { tipo, suelo, uso } = answers;

        let recomendacion = "";
        let hormigon = "";
        let espesor = "";
        let consejos = "";

        // Lógica simple y amigable
        if (uso === "maquinaria" || tipo === "casa_niveles") {
          hormigon = "H-25";
          espesor = "12-15 cm";
          recomendacion =
            "Te conviene un H-25, es más resistente y te va a durar mucho más.";
          consejos =
            "Acordate de poner malla de refuerzo y bien compactar el terreno.";
        } else if (uso === "vehiculos" || suelo === "suelo_blando") {
          hormigon = "H-20";
          espesor = "10-12 cm";
          recomendacion =
            "Con un H-20 estás más que seguro. Es el estándar para casas.";
          consejos =
            "No te olvides de la malla soldada, es clave para que no se fisure.";
        } else {
          hormigon = "H-20";
          espesor = "8-10 cm";
          recomendacion =
            "Un H-20 es perfecto para tu caso. Es el que más se usa y tiene buena relación precio/calidad.";
          consejos =
            "Con una buena preparación del terreno y malla light, te queda impecable.";
        }

        return `## 🎯 **Mi Recomendación**\n\n${recomendacion}\n\n### � **En resumen:**\n- **Hormigón**: ${hormigon}\n- **Espesor**: ${espesor}\n- **Consejo clave**: ${consejos}\n\n### � **Tips prácticos:**\n1. Compactá bien el suelo antes\n2. Usá film plástico para evitar humedad\n3. Curá el hormigón los primeros 7 días\n\n### 📞 **¿Querés que te cotice?**\nPuedo contactarte con un experto de HORMAX para darte un presupuesto preciso. ¿Te parece bien?`;
      },
    },
    {
      topic: "galpon_hormigon",
      detection: ["galpón", "galpon", "nave industrial", "depósito", "almacén"],
      steps: [
        {
          id: "uso_galpon",
          question:
            "¡Claro que sí! Te ayudo con tu galpón. 🏗️\n\nContame primero:\n\n� **¿Para qué lo vas a usar?**\n\na) Guardar cosas del hogar\nb) Taller o trabajo liviano\nc) Guardar vehículos o maquinaria\nd) Producción pesada",
          options: ["almacenamiento", "taller", "vehiculos", "industria"],
          contextKey: "uso",
        },
        {
          id: "tamano_galpon",
          question:
            "Entendido. Ahora el tamaño:\n\n� **¿Qué tamaño pensás hacer?**\n\na) Chico (como un garage)\nb) Mediano (para guardar varias cosas)\nc) Grande (tipo industrial)\nd) No sé todavía",
          options: ["chico", "mediano", "grande", "no_se"],
          contextKey: "tamano",
        },
        {
          id: "carga_piso",
          question:
            "Perfecto. Último detalle:\n\n� **¿Qué va a pasar por el piso?**\n\na) Solo personas y cosas livianas\nb) Autos o camionetas\nc) Camiones o montacargas\nd) Maquinaria pesada",
          options: ["liviano", "autos", "camiones", "maquinaria_pesada"],
          contextKey: "carga",
        },
      ],
      generateRecommendation: (answers: Record<string, any>) => {
        const { uso, tamano, carga } = answers;

        let recomendacion = "";
        let hormigon = "";
        let espesor = "";

        if (carga === "maquinaria_pesada" || uso === "industria") {
          hormigon = "H-30";
          espesor = "15-20 cm";
          recomendacion =
            "Para lo que necesitas, te conviene un H-30. Aguantará todo sin problemas.";
        } else if (carga === "camiones" || tamano === "grande") {
          hormigon = "H-25";
          espesor = "12-15 cm";
          recomendacion =
            "Un H-25 es ideal para tu caso. Es resistente y económico.";
        } else {
          hormigon = "H-20";
          espesor = "10-12 cm";
          recomendacion =
            "Con un H-20 tenes más que suficiente. Es el clásico y funciona perfecto.";
        }

        return `## 🎯 **Mi Sugerencia**\n\n${recomendacion}\n\n### 📋 **Lo que necesitas:**\n- **Hormigón**: ${hormigon}\n- **Espesor**: ${espesor}\n\n### 💡 **Consejos de amigo:**\n1. Hacé buen drenaje alrededor\n2. Poner malla de refuerzo nunca está de más\n3. Dejá que el hormigón cure bien\n\n### 📞 **¿Querés presupuesto?**\nTe paso un experto de HORMAX para que te cotice exactamente lo que necesitas. ¿Te parece?`;
      },
    },
    {
      topic: "vereda_pavimento",
      detection: ["vereda", "pavimento", "acera", "sendero", "camino"],
      steps: [
        {
          id: "tipo_vereda",
          question:
            "¡Hola! Te ayudo con tu vereda/pavimento. 🚶‍♂️\n\nPara darte la mejor recomendación:\n\n🏗️ **¿Qué tipo de vereda es?**\n\na) Vereda de casa particular\nb) Acceso a garage/estacionamiento\nc) Camino peatonal en jardín\nd) Vereda comercial o de mucho tránsito",
          options: ["particular", "garage", "jardin", "comercial"],
          contextKey: "tipo",
        },
        {
          id: "transito_vereda",
          question:
            "Perfecto. Ahora necesito saber el uso:\n\n🚗 **¿Qué tránsito tendrá?**\n\na) Solo peatones personas\nb) Peatones y bicicletas\nc) Autos ocasionales\nd) Autos diarios o tránsito constante",
          options: [
            "peatones",
            "bicicletas",
            "autos_ocasionales",
            "autos_constantes",
          ],
          contextKey: "transito",
        },
        {
          id: "medidas_vereda",
          question:
            "Entendido. Las medidas finales:\n\n📏 **¿Qué dimensiones tiene?**\n\na) Estándar (1.2m x 10m aprox)\nb) Ancha (más de 1.5m)\nc) Corta (menos de 5m de largo)\nd) No sé las medidas exactas",
          options: ["estandar", "ancha", "corta", "no_se"],
          contextKey: "medidas",
        },
      ],
      generateRecommendation: (answers: Record<string, any>) => {
        const { tipo, transito, medidas } = answers;
        let hormigon = "H-20";
        let espesor = "8-10 cm";
        let recomendacion =
          "Para vereda particular con tránsito normal, H-20 está perfecto.";

        if (transito === "autos_constantes" || tipo === "comercial") {
          hormigon = "H-25";
          espesor = "10-12 cm";
          recomendacion =
            "Con tránsito constante, te conviene H-25 para mayor durabilidad.";
        } else if (transito === "autos_ocasionales") {
          hormigon = "H-20";
          espesor = "10 cm";
          recomendacion =
            "Para autos ocasionales, H-20 con 10cm de espesor es ideal.";
        } else if (transito === "peatones") {
          hormigon = "H-15";
          espesor = "6-8 cm";
          recomendacion =
            "Para solo peatones, H-15 es suficiente y más económico.";
        }

        return `## 🚶‍♂️ **Mi Sugerencia para Vereda**\n\n${recomendacion}\n\n### 📋 **Lo que necesitas:**\n- **Hormigón**: ${hormigon}\n- **Espesor**: ${espesor}\n\n### 💡 **Consejos prácticos:**\n1. Preparar bien el suelo compactándolo\n2. Usar moldes o guías para los bordes\n3. Hacer juntas de dilatación cada 2-3 metros\n4. Curar bien los primeros 7 días\n\n### 📞 **¿Querés que te contacte un experto?**\nTe paso un especialista de HORMAX para que te asesore personalmente. ¿Te parece?`;
      },
    },
    {
      topic: "losa_hormigon",
      detection: ["losa", "losas", "entrepiso", "techo", "terraza"],
      steps: [
        {
          id: "uso_losa",
          question:
            "¡Hola! Te ayudo con tu losa. 🏠\n\nContame:\n\n🏗️ **¿Para qué es la losa?**\n\na) Techo de mi casa\nb) Piso de entrepiso\nc) Terraza o balcón\nd) Piso de taller",
          options: ["techo", "entrepiso", "terraza", "taller"],
          contextKey: "uso",
        },
        {
          id: "medidas_losa",
          question:
            "Perfecto. Ahora las medidas:\n\n📏 **¿Qué tamaño tiene?**\n\na) Chica (hasta 3x3m)\nb) Mediana (3x3 a 6x6)\nc) Grande (más de 6x6)\nd) No sé las medidas exactas",
          options: ["chica", "mediana", "grande", "no_se"],
          contextKey: "medidas",
        },
        {
          id: "carga_losa",
          question:
            "Entendido. Última pregunta:\n\n📦 **¿Qué va a soportar?**\n\na) Solo el peso normal de una casa\nb) Muebles pesados o grupos\nc) Estanterías o equipos\nd) No estoy seguro",
          options: ["normal", "muebles", "equipos", "no_se"],
          contextKey: "carga",
        },
      ],
      generateRecommendation: (answers: Record<string, any>) => {
        const { uso, medidas, carga } = answers;

        let recomendacion = "";
        let hormigon = "";
        let espesor = "";

        if (carga === "equipos" || medidas === "grande") {
          hormigon = "H-25";
          espesor = "15-20 cm";
          recomendacion =
            "Te conviene un H-25 con buena malla. Así te quedás tranquilo.";
        } else if (carga === "muebles" || uso === "entrepiso") {
          hormigon = "H-20";
          espesor = "12-15 cm";
          recomendacion =
            "Un H-20 está perfecto. Es el estándar y funciona muy bien.";
        } else {
          hormigon = "H-20";
          espesor = "10-12 cm";
          recomendacion =
            "Con H-20 tenes más que suficiente. Es económico y resistente.";
        }

        return `## � **Lo que te recomiendo**\n\n${recomendacion}\n\n### � **En detalle:**\n- **Hormigón**: ${hormigon}\n- **Espesor**: ${espesor}\n\n### � **Tips importantes:**\n1. Usá encofrado bien nivelado\n2. No te olvides la malla de refuerzo\n3. Curá bien los primeros días\n\n### � **¿Querés que te ayude con la cotización?**\nTe contacto con un técnico de HORMAX para que te dé un precio exacto. ¿Te parece bien?`;
      },
    },
  ];

  detectDialogueNeed(message: string): DialogueFlow | null {
    const lowerMessage = message.toLowerCase();

    for (const dialogue of this.dialogues) {
      if (
        dialogue.detection.some((keyword) => lowerMessage.includes(keyword))
      ) {
        return dialogue;
      }
    }

    return null;
  }

  startDialogue(
    sessionId: string,
    dialogue: DialogueFlow,
  ): ConversationContext {
    const context: ConversationContext = {
      topic: dialogue.topic,
      step: 0,
      answers: {},
      completed: false,
    };

    this.activeContexts.set(sessionId, context);
    return context;
  }

  processAnswer(
    sessionId: string,
    answer: string,
  ): {
    nextQuestion?: string;
    completed?: boolean;
    recommendation?: string;
  } {
    const context = this.activeContexts.get(sessionId);
    if (!context) {
      return {};
    }

    const dialogue = this.dialogues.find((d) => d.topic === context.topic);
    if (!dialogue) {
      return {};
    }

    const currentStep = dialogue.steps[context.step];

    // Procesar respuesta
    context.answers[currentStep.contextKey] = answer;

    // Avanzar al siguiente paso
    context.step++;

    if (context.step >= dialogue.steps.length) {
      // Diálogo completado
      context.completed = true;
      context.recommendation = dialogue.generateRecommendation(context.answers);

      return {
        completed: true,
        recommendation: context.recommendation,
      };
    }

    // Siguiente pregunta
    const nextStep = dialogue.steps[context.step];
    return {
      nextQuestion: nextStep.question,
    };
  }

  getCurrentStep(sessionId: string): DialogueStep | null {
    const context = this.activeContexts.get(sessionId);
    if (!context || context.completed) {
      return null;
    }

    const dialogue = this.dialogues.find((d) => d.topic === context.topic);
    if (!dialogue) {
      return null;
    }

    return dialogue.steps[context.step];
  }

  getContext(sessionId: string): ConversationContext | null {
    return this.activeContexts.get(sessionId) || null;
  }

  clearContext(sessionId: string): void {
    this.activeContexts.delete(sessionId);
  }

  // Método para generar respuesta conversacional
  generateConversationalResponse(message: string, sessionId: string): string {
    // Verificar si ya hay un diálogo activo
    const existingContext = this.getContext(sessionId);

    if (existingContext && !existingContext.completed) {
      // Procesar respuesta del usuario
      const result = this.processAnswer(sessionId, message);

      if (result.completed) {
        // Finalizar diálogo
        const response = result.recommendation || "";
        this.clearContext(sessionId);
        return response;
      } else {
        // Continuar diálogo
        return result.nextQuestion || "";
      }
    }

    // Detectar si necesita iniciar un nuevo diálogo
    // PERO no iniciar si el mensaje viene del wizard (contiene "Hola, soy [nombre]")
    if (
      message.includes("Hola, soy") &&
      message.includes("El usuario quiere construir")
    ) {
      // Mensaje del wizard -> dejar que la IA responda personalmente
      return "";
    }

    const dialogue = this.detectDialogueNeed(message);

    if (dialogue) {
      // Iniciar nuevo diálogo
      this.startDialogue(sessionId, dialogue);
      const firstStep = dialogue.steps[0];
      return firstStep.question;
    }

    // Si no necesita diálogo, devolver string vacío para usar respuesta normal
    return "";
  }

  // Verificar si un mensaje es una respuesta a un diálogo activo
  isDialogueResponse(sessionId: string, message: string): boolean {
    const context = this.getContext(sessionId);
    if (!context || context.completed) {
      return false;
    }

    const currentStep = this.getCurrentStep(sessionId);
    if (!currentStep || !currentStep.options) {
      return true; // Si no hay opciones, cualquier respuesta es válida
    }

    const lowerMessage = message.toLowerCase();
    return currentStep.options.some(
      (option) =>
        lowerMessage.includes(option.toLowerCase()) ||
        option.toLowerCase().includes(lowerMessage),
    );
  }
}

export const conversationalService = new ConversationalService();
