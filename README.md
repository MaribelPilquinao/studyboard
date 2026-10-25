# StudyBoard

Aplicación web local para organizar tareas académicas. Los datos se guardan en
`localStorage` del navegador.

## Ejecutar

Abre `index.html` en un navegador moderno. Para evitar restricciones del
navegador con archivos locales, también puedes servir la carpeta con cualquier
servidor HTTP estático.

## Pruebas y validación

Requiere Node.js 18 o superior:

```powershell
npm install
npm test
npm run validate
```

`npm run validate` ejecuta ESLint, las pruebas automatizadas y las
comprobaciones de sintaxis.

## Importar y exportar

La exportación genera un archivo JSON. La importación reemplaza las tareas
actuales después de pedir confirmación, acepta archivos de hasta 1 MB y rechaza
JSON inválido, tareas con campos inválidos o IDs duplicados.
