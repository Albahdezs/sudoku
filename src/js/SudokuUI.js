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
    // Elementos del DOM
    this.boardElement = document.getElementById("sudoku-board");
    this.numberPad = document.getElementById("number-pad");
    this.timerDisplay = document.getElementById("timer-display");
    this.numberCountsElement = document.getElementById("number-counts");

    // Modales
    this.statsModal = document.getElementById("stats-modal");
    this.statsModalContent = document.getElementById("modal-stats-content");
    this.modalCloseBtn = document.getElementById("modal-close-btn");

    this.instructionsModal = document.getElementById("instructions-modal");
    this.instructionsCloseBtn = document.getElementById(
      "modal-close-instructions"
    );

    this.dialogModal = document.getElementById("dialog-modal");
    this.dialogContent = document.getElementById("dialog-content-wrapper");

    // Estado
    this.selectedCell = null;

    // Configurar event listeners en modales
    this.setupModalListeners(this.statsModal, this.modalCloseBtn);
    this.setupModalListeners(this.instructionsModal, this.instructionsCloseBtn);

    // Modal de diálogo con lógica especial
    this.dialogModal.addEventListener("click", (e) => {
      if (e.target === this.dialogModal) {
        // Solo se cierra si no es un diálogo de decisión
        if (!this.dialogContent.querySelector(".dialog-buttons")) {
          this.hideDialog();
        }
      }
    });
  }

  /**
   * Muestra el modal genérico
   * @param {HTMLElement} modal - Elemento del modal
   */
  showModal(modal) {
    modal.classList.remove("hidden");
  }

  /**
   * Oculta el modal genérico
   * @param {HTMLElement} modal - Elemento del modal
   */
  hideModal(modal) {
    modal.classList.add("hidden");
  }

  /**
   * Configura event listeners para un modal
   * @param {HTMLElement} modal - Elemento del modal
   * @param {HTMLElement} closeBtn - Botón de cerrar
   * @param {Function} onClose - Callback opcional al cerrar
   */
  setupModalListeners(modal, closeBtn, onClose = null) {
    closeBtn.addEventListener("click", () => {
      this.hideModal(modal);
      if (onClose) onClose();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.hideModal(modal);
        if (onClose) onClose();
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
      cell.classList.remove("selected", "highlight");
    });

    // Agregar selección a la celda actual
    if (this.selectedCell) {
      const [selRow, selCol] = this.selectedCell;

      // Recorrer todas las celdas de nuevo
      document.querySelectorAll(".cell").forEach((cell) => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

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
    this.numberPad.classList.toggle("hidden", !show);
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
   * @param {boolean} hasButton - true para mostrar un botón "OK"
   */
  showMessage(text, type, hasButton = false) {
    // Crear el HTML del mensaje
    let messageHtml = `<div class="message ${type}">${text}</div>`;

    // Añadir botón si es necesario
    if (hasButton) {
      messageHtml += `
      <div class="dialog-buttons">
        <button id="dialog-ok" class="btn btn-solve">OK</button>
      </div>
      `;
    }

    // Lo ponemos en el modal y lo mostramos
    this.dialogContent.innerHTML = messageHtml;
    this.showModal(this.dialogModal);

    // Asignar lógica de cierre
    if (hasButton) {
      // Si tiene botón, se cierra al clicarlo
      this.dialogContent
        .querySelector("#dialog-ok")
        .addEventListener("click", () => {
          this.hideDialog();
        });
    }
  }

  /**
   * Limpia todos los mensajes
   */
  clearMessages() {
    this.hideDialog();
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
   * Formatea el tiempo en formato MM:SS
   * @param {number} seconds - Segundos totales
   * @retuns {string} Tiempo formateado
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Muestra las estadísticas
   * @param {Object} stas - Estadísticas por dificultad
   * @param {Object} bestTimes - Mejores tiempos por dificultad
   */
  showStatistics(stats, bestTimes) {
    const difficultyNames = {
      easy: "Fácil",
      medium: "Medio",
      hard: "Difícil",
    };

    let html = '<div class="stats-content"><h3>📊 Estadísticas</h3>';

    ["easy", "medium", "hard"].forEach((difficulty) => {
      const diffName = difficultyNames[difficulty];
      const stat = stats[difficulty];

      if (stat && stat.played > 0) {
        html += `
        <div class="stat-section">
          <h4>${diffName}</h4>
          <p>🎮 Partidas jugadas: ${stat.played}</p>
          <p>✅ Completadas: ${stat.completed}</p>
          ${
            stat.bestTime !== Infinity &&
            stat.bestTime !== null &&
            stat.bestTime !== 0
              ? `<p>⏱️ Mejor tiempo: ${this.formatTime(stat.bestTime)}</p>`
              : ""
          }
          ${
            stat.completed > 0
              ? `<p>📈 Promedio: ${this.formatTime(
                  Math.floor(stat.totalTime / stat.completed)
                )}</p>`
              : ""
          }
          </div>
        `;

        // Mejores tiempos
        if (bestTimes[difficulty]?.length > 0) {
          html += '<div class="best-times"><h5>🏆 Top 5:</h5><ol>';
          bestTimes[difficulty].slice(0, 5).forEach((record) => {
            const date = new Date(record.date).toLocaleDateString();
            html += `<li>${this.formatTime(record.time)} - ${date}</li>`;
          });
          html += "</ol></div>";
        }
      }
    });

    html += "</div>";

    this.statsModalContent.innerHTML = html;
    this.showModal(this.statsModal);
  }

  /**
   * Muestra diálogo de confirmación para cargar partida
   * @param {Function} onAccept - Callback al aceptar
   * @param {Function} onReject - Callback al rechazar
   */
  showLoadGameDialog(onAccept, onReject) {
    const dialogHtml = `
    <div class="dialog">
      <p>💾 Se encontró una partida guardada. ¿Deseas continuarla?</p>
      <div class="dialog-buttons">
        <button id="load-yes" class="btn btn-solve">Sí, continuar</button>
        <button id="load-no" class="btn btn-clear">No, nueva partida</button>
      </div>
    </div>
    `;

    // Ponerlo en el modal y mostrarlo
    this.dialogContent.innerHTML = dialogHtml;
    this.showModal(this.dialogModal);

    // Conectar los botones
    this.dialogContent
      .querySelector("#load-yes")
      .addEventListener("click", () => {
        this.hideDialog();
        onAccept();
      });

    this.dialogContent
      .querySelector("#load-no")
      .addEventListener("click", () => {
        this.hideDialog();
        onReject();
      });
  }

  /**
   * Oculta el modal de estadísticas
   */
  hideStatistics() {
    this.hideModal(this.statsModal);
  }

  /**
   * Actualiza el panel de contador de números
   * @param {Array} board - El tablero actual
   */
  updateNumberCounts(board) {
    // Contar todos los números en el tablero
    const counts = {};
    for (let num = 1; num <= 9; num++) {
      counts[num] = 0;
    }

    // Contar todos los números en el tablero
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
    this.showModal(this.instructionsModal);
  }

  /**
   * Oculta el modal de instrucciones
   */
  hideInstructions() {
    this.hideModal(this.instructionsModal);
  }

  /**
   * Oculta el modal de diálogo genérico
   */
  hideDialog() {
    this.hideModal(this.dialogModal);
    // Limpiamos el contenido para la próxima vez
    this.dialogContent.innerHTML = "";
  }
}
