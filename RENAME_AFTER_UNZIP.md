# ⚠️ Renombrar carpetas dinámicas después de descomprimir

Next.js usa corchetes para rutas dinámicas. Renombrá estas carpetas:

| Carpeta actual              | Renombrar a           |
|-----------------------------|-----------------------|
| src/app/modulos/STAGE_ID/   | src/app/modulos/[stage]/ |
| src/app/modulos/STAGE_ID/MODULE_ID/ | src/app/modulos/[stage]/[module]/ |
| src/app/guias/GUIDE_ID/     | src/app/guias/[id]/   |

## Script rápido (bash — correr desde la raíz del proyecto)

```bash
#!/bin/bash
mv src/app/modulos/STAGE_ID src/app/modulos/[stage]
mv "src/app/modulos/[stage]/MODULE_ID" "src/app/modulos/[stage]/[module]"
mv src/app/guias/GUIDE_ID "src/app/guias/[id]"
echo "✅ Listo. Corré: bun dev"
```

Guardá como `rename.sh`, ejecutá `chmod +x rename.sh && ./rename.sh`

## Después

```bash
bun install
bun dev
```

Abre http://localhost:3000
