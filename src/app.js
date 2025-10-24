/**
 * app.js
 * Punto de entrada de la aplicación
 * Inicializa las clases principales y arranca la app
 */

document.addEventListener("DOMContentLoaded", () => {
  // Crear instancias de las clases
  const solver = new SudokuSolver();
  const ui = new SudokuUI();
  const storage = new SudokuStorage();
  const controller = new SudokuController(solver, ui, storage);
});
