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

Se usó la **GitHub Copilot app** siguiendo el workshop [Copilot App](https://github-samples.github.io/copilot-workshops/first-steps/copilot-app/), adaptado a StudyBoard. Se omitió lo no disponible en la licencia.

| Tarea | Apoyo de Copilot | Mi decisión |
|---|---|---|
| Documentación inicial | Generó el primer README a partir de un prompt con la problemática | Corregí las secciones que no coincidían con mi caso |
| Implementación base | Generó `index.html`, `styles.css` y `app.js` | Mantuve HTML, CSS y JS puro, sin frameworks |
| Alcance extra | Agregó pruebas, ESLint, `task-utils.js` e importar/exportar JSON, sin que lo pidiera | [Decidí conservarlo porque me pareció algo útil para la app / lo revisé para poder explicarlo] |
| Backlog | Creó 3 issues con historia de usuario y criterios de aceptación | Elegí el issue #1 (notas) por su valor y alcance |
| Issue #1: notas | Implementó el campo con límite de 500 caracteres, pruebas y compatibilidad con tareas antiguas | [Verifiqué que las notas se muestran con `textContent` / lo que cambié o rechacé] |
| Pull request | Abrió el PR desde una rama aislada (worktree) | [Revisé el diff antes de fusionar a `main`] |
| Despliegue | Creó el workflow de GitHub Pages | [Revisé que publicara solo los archivos estáticos] |
| Mejoras de código | Refactorizó la lógica a `task-utils.js` y ordenó `app.js` | [Revisé la separación entre datos, lógica y renderizado] |
| Mejoras de interfaz | Mejoró la UI a petición mía: íconos, estilos, jerarquía visual y diseño responsive | [Pedí ajustes hasta que la interfaz fuera clara / lo que corregí o descarté] |

Copilot se usó como apoyo: yo definí qué mejorar (código, interfaz e iconos), revisé cada cambio.
