# Fantasy Writer Studio v1.1 Map Studio 2.0 (development preview)

React/Vite multilingual fantasy novel writing app. Based on v1.0 integrated development source; replaces the map editor only. Main existing writing, library, character, world, timeline, image, backup and export modules stay intact.

Map functionality: stamp palette with custom vector icon art, HTML drag-and-drop or touch click-to-place, terrain paint brush, river/road strokes, place-name labels, object selection/moving/sizing/rotation, background map import, custom image symbol import, layer visibility and opacity, undo/redo session history, PNG/SVG export, multiple maps per book, local auto-save and JSON backup.

All map additions are additive to `book.maps`; original `background`, `markers`, `paths` are preserved and unknown fields remain untouched. `src/map-model.js` holds pure helper functions covered by tests.

Commands: `npm install`, `npm test`, `npm run build`, `npm run dev`. Full Korean Windows and GitHub instructions: `START_HERE_KO.md`.

**Status:** source and tests supplied. 10 Node tests passed and JSX transpile syntax checked. Dependency installation/build did not complete in the artifact environment; test on a local Windows PC before merging to production. Do not migrate real manuscripts until verified backups and restores work.
