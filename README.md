# Academia Elias Yapur

Plataforma e-learning de capacitación técnica — diseño con data hardcodeada.

## Stack

- **Next.js 16.2.4** — App Router + Turbopack
- **Bun** — runtime y package manager
- **TypeScript + Tailwind CSS v4**

## Inicio rápido

```bash
bun install
bun dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Redirect → /dashboard
│   ├── globals.css         # CSS variables + Tailwind
│   ├── dashboard/          # Inicio / home
│   ├── modulos/            # Módulos por etapa
│   │   └── [stage]/
│   │       └── [module]/
│   ├── guias/              # Guías de instalación
│   ├── biblioteca/         # Normas y fichas técnicas
│   ├── simulador/          # Presupuesto de obra
│   ├── quiz/               # Evaluación técnica
│   ├── chat/               # Consultor IA
│   └── logros/             # Badges y progreso
├── components/
│   ├── layout/             # Sidebar, Topbar
│   └── ui/                 # Button, Badge, Card...
└── data/
    ├── stages.ts           # Etapas + módulos
    ├── quiz.ts             # Preguntas
    ├── guides.ts           # Guías paso a paso
    ├── biblioteca.ts       # Documentos
    └── achievements.ts     # Logros
```
# yapurlearning
