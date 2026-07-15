bash
#!/bin/bash
mv src/app/modulos/STAGE_ID src/app/modulos/[stage]
mv "src/app/modulos/[stage]/MODULE_ID" "src/app/modulos/[stage]/[module]"
mv src/app/guias/GUIDE_ID "src/app/guias/[id]"
echo "✅ Listo. Corré: bun dev"
