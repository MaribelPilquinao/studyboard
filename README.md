# StudyBoard

[Sitio publicado](https://maribelpilquinao.github.io/studyboard/)

## Contexto

Los estudiantes universitarios suelen tener varios cursos y otras responsabilidades que deben coordinar.

## Problema

Pueden olvidar fechas de entrega y no saber qué tareas deben priorizar.

## Usuario objetivo

Estudiantes de pregrado.

## Objetivo de la solución

Organizar las entregas académicas y mostrar cuáles son urgentes.

## Funcionalidades principales

- Agregar tareas con curso, fecha y prioridad.
- Editar, completar, reabrir y eliminar tareas.
- Filtrar por curso y estado.
- Buscar por título o curso.
- Ordenar por fecha, prioridad o título.
- Mostrar indicadores de urgencia y progreso.
- Guardar la información de forma persistente en `localStorage`.
- Exportar e importar tareas en formato JSON.
- Validar archivos importados y rechazar IDs duplicados.

## Tecnologías

- HTML
- CSS
- JavaScript puro
- Node.js para pruebas y herramientas de calidad

## Estructura de archivos

- `index.html`
- `styles.css`
- `app.js`
- `task-utils.js`
- `test/task-utils.test.js`
- `README.md`

## Ejecutar

Abre `index.html` en un navegador moderno. Para evitar restricciones del navegador con archivos locales, también puedes servir la carpeta con cualquier servidor HTTP estático.

## Pruebas y validación

Requiere Node.js 18 o superior:

```powershell
npm install
npm test
npm run validate
```

`npm run validate` ejecuta ESLint, Prettier, las pruebas automatizadas y las comprobaciones de sintaxis.

## Importar y exportar

La exportación genera un archivo JSON. La importación reemplaza las tareas actuales después de pedir confirmación, acepta archivos de hasta 1 MB y rechaza JSON inválido, tareas con campos inválidos o IDs duplicados.

## Uso de GitHub Copilot

Este proyecto fue creado y mejorado con apoyo de GitHub Copilot.
