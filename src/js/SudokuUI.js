/**
 * SudokuUI.js
 * Maneja toda la interfaz visual del Sudoku:
 * - Renderizado del tablero
 * - Actualización de celdas
 * - Mensajes al usuario
 * - Temporizador
 */

class SudokuUI {
  constructor() {
    this.boardElement = document.getElementById("sudoku-board");
    this.numberPad = document.getElementById("number-pad");
    this.timerDisplay = document.getElementById("timer-display");
    this.messageContainer = document.getElementById("message-container");

    this.statsModal = document.getElementById("stats-modal");
    this.statsModalContent = document.getElementById("modal-stats-content");
    this.modalCloseBtn = document.getElementById("modal-close-btn");

    this.instructionsModal = document.getElementById("instructions-modal");
    this.instructionsCloseBtn = document.getElementById(
      "modal-close-instructions"
    );

    this.numberCountsElement = document.getElementById("number-counts");

    this.selectedCell = null;

    // Para cerrar el modal
    this.modalCloseBtn.addEventListener("click", () => this.hideStatistics());

    // Clicar en el fondo también cierra el modal
    this.statsModal.addEventListener("click", (e) => {
      if (e.target === this.statsModal) {
        this.hideStatistics();
      }
    });

    // Modal de instrucciones
    this.instructionsCloseBtn.addEventListener("click", () =>
      this.hideInstructions()
    );
    this.instructionsModal.addEventListener("click", (e) => {
      if (e.target === this.instructionsModal) {
        this.hideInstructions();
      }
    });
  }

  /**
   * Renderiza el tablero completo en el DOM
   * @param {Array} board - Tablero de Sudoku a renderizar
   * @param {Array} initialBoard - Tablero inicial (para marcar celdas fijas)
   */
  renderBoard(board, initialBoard) {
    this.boardElement.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const cell = this.createCell(i, j, board[i][j], initialBoard[i][j]);
        this.boardElement.appendChild(cell);
      }
    }
  }

  /**
   * Crea un elemento de celda individual
   * @param {number} row - Fila
   * @param {number} col - Columna
   * @param {number} value - Valor actual
   * @param {number} initialValue - Valor inicial (0 si es editable)
   * @returns {HTMLElement} Elemento div de la celda
   */
  createCell(row, col, value, initialValue) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.row = row;
    cell.dataset.col = col;

    cell.textContent = value !== 0 ? value : "";

    // Marcar celdas fijas (del tablero inicial)
    if (initialValue !== 0) {
      cell.classList.add("fixed");
    }

    return cell;
  }

  /**
   * Actualiza la selección visual de la celda
   * Resalta la fila y columna activas
   */
  updateSelection() {
    // Remover selección previa
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("selected");
      cell.classList.remove("highlight");
    });

    // Agregar selección a la celda actual
    if (this.selectedCell) {
      const [selRow, selCol] = this.selectedCell;

      // Recorrer todas las celdas de nuevo
      document.querySelectorAll(".cell").forEach((cell) => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;

        // Resaltar la fila y la columna
        if (row == selRow || col == selCol) {
          cell.classList.add("highlight");
        }
      });

      // Resaltar la celda seleccionada
      const selectedCellElement =
        this.boardElement.children[selRow * 9 + selCol];
      if (selectedCellElement) {
        selectedCellElement.classList.add("selected");
      }
    }
  }

  /**
   * Actualiza las celdas con conflictos visualmente
   * @param {Set} conflicts - Set de posiciones con conflictos
   */
  updateConflicts(conflicts) {
    document.querySelectorAll(".cell").forEach((cell) => {
      const row = cell.dataset.row;
      const col = cell.dataset.col;
      const key = `${row}-${col}`;

      if (conflicts.has(key)) {
        cell.classList.add("conflict");
      } else {
        cell.classList.remove("conflict");
      }
    });
  }

  /**
   * Muestra u oculta el teclado numérico
   * @param {boolean} show - true para mostrar, false para ocultar
   */
  toggleNumberPad(show) {
    if (show) {
      this.numberPad.classList.remove("hidden");
    } else {
      this.numberPad.classList.add("hidden");
    }
  }

  /**
   * Actualiza el valor de una celda específica
   * @param {number} row - Fila
   * @param {number} col - Columna
   * @param {number} value - Nuevo valor
   */
  updateCell(row, col, value) {
    const cell = this.boardElement.children[row * 9 + col];
    if (cell) {
      cell.textContent = value !== 0 ? value : "";
    }
  }

  /**
   * Muestra un mensaje al usuario
   * @param {string} text - Texto del mensaje
   * @param {string} type - 'success' o 'error'
   */
  showMessage(text, type) {
    this.messageContainer.innerHTML = `<div class="message ${type}">${text}</div>`;
  }

  /**
   * Limpia todos los mensajes
   */
  clearMessages() {
    this.messageContainer.innerHTML = "";
  }

  /**
   * Actualiza el display del temporizador
   * @param {number} seconds - Segundos totales
   */
  updateTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timerDisplay.textContent = `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Establece la celda seleccionada
   * @param {Array|null} cell - [row, col] o null
   */
  setSelectedCell(cell) {
    this.selectedCell = cell;
    this.updateSelection();
  }

  /**
   * Obtiene la celda actualmente seleccionada
   * @returns {Array|null} [row, col] o null
   */
  getSelectedCell() {
    return this.selectedCell;
  }

  /**
   * Muestra las estadísticas
   */
  showStatistics(stats, bestTimes) {
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    let html = '<div class="stats-content">';
    html += "<h3>📊 Estadísticas</h3>";

    ["easy", "medium", "hard"].forEach((difficulty) => {
      const diffName = { easy: "Fácil", medium: "Medio", hard: "Difícil" }[
        difficulty
      ];
      const stat = stats[difficulty];

      if (stat && stat.played > 0) {
        html += `
        <div class="stat-section">
          <h4>${diffName}</h4>
          <p>🎮 Partidas jugadas: ${stat.played}</p>
          <p>✅ Completadas: ${stat.completed}</p>
          ${
            stat.bestTime !== Infinity
              ? `<p>⏱️ Mejor tiempo: ${formatTime(stat.bestTime)}</p>`
              : ""
          }
          ${
            stat.completed > 0
              ? `<p>📈 Promedio: ${formatTime(
                  Math.floor(stat.totalTime / stat.completed)
                )}</p>`
              : ""
          }
          </div>
        `;

        // Mejores tiempos
        if (bestTimes[difficulty] && bestTimes[difficulty].length > 0) {
          html += '<div class="best-times"><h5>🏆 Top 5:</h5><ol>';
          bestTimes[difficulty].slice(0, 5).forEach((record) => {
            const date = new Date(record.date).toLocaleDateString();
            html += `<li>${formatTime(record.time)} - ${date}</li>`;
          });
          html += "</ol></div>";
        }
      }
    });

    html += "</div>";

    this.statsModalContent.innerHTML = html;
    this.statsModal.classList.remove("hidden");
  }

  /**
   * Muestra diálogo de confirmación para cargar partida
   */
  showLoadGameDialog(onAccept, onReject) {
    const dialog = `
    <div class="dialog">
      <p>💾 Se encontró una partida guardada. ¿Deseas continuarla?</p>
      <div class="dialog-buttons">
        <button id="load-yes" class="btn btn-solve">Sí, continuar</button>
        <button id="load-no" class="btn btn-clear">No, nueva partida</button>
      </div>
    </div>
    `;

    this.messageContainer.innerHTML = dialog;

    document.getElementById("load-yes").addEventListener("click", onAccept);
    document.getElementById("load-no").addEventListener("click", onReject);
  }

  /**
   * Oculta el modal de estadísticas
   */
  hideStatistics() {
    this.statsModal.classList.add("hidden");
  }

  /**
   * Actualiza el panel de contador de números
   * @param {Array} board - El tablero actual
   */
  updateNumberCounts(board) {
    // Contar todos los números en el tablero
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const num = board[r][c];
        if (num >= 1 && num <= 9) {
          counts[num]++;
        }
      }
    }

    // Actualizar el HTML
    this.numberCountsElement.innerHTML = "";
    for (let num = 1; num <= 9; num++) {
      const count = counts[num];
      const item = document.createElement("div");
      item.className = "count-item";

      // Marcar como completo si hay 9
      if (count === 9) {
        item.classList.add("completed");
      }

      // Añadir el HTML interno
      item.innerHTML = `
            <span class="number">${num}</span>
            <span class="count">(${count}/9)</span>
        `;
      this.numberCountsElement.appendChild(item);
    }
  }
  /**
   * Muestra el modal de instrucciones
   */
  showInstructions() {
    this.instructionsModal.classList.remove("hidden");
  }

  /**
   * Oculta el modal de instrucciones
   */
  hideInstructions() {
    this.instructionsModal.classList.add("hidden");
  }
}
