import { Chess } from
    "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/+esm";

const game = new Chess();

const board = document.getElementById("chessboard");
const statusText = document.getElementById("game-status");
const historyBox = document.getElementById("move-history");

const undoButton = document.getElementById("undo-btn");
const redoButton = document.getElementById("redo-btn");
const restartButton = document.getElementById("restart-btn");

const whiteCaptured = document.getElementById("white-captured");
const blackCaptured = document.getElementById("black-captured");

const symbols = {
    w: {
        k: "♔",
        q: "♕",
        r: "♖",
        b: "♗",
        n: "♘",
        p: "♙"
    },
    b: {
        k: "♚",
        q: "♛",
        r: "♜",
        b: "♝",
        n: "♞",
        p: "♟"
    }
};

let selectedSquare = null;
let legalMoves = [];
let redoStack = [];
let lastMove = null;

function renderBoard() {

    board.innerHTML = "";

    const position = game.board();

    for (let row = 0; row < 8; row++) {

        for (let col = 0; col < 8; col++) {

            const square = document.createElement("div");

            const file = "abcdefgh"[col];
            const rank = 8 - row;
            const squareName = file + rank;

            square.classList.add("square");

            square.classList.add(
                (row + col) % 2 === 0 ? "light" : "dark"
            );

            const piece = position[row][col];

            if (piece) {
                square.textContent =
                    symbols[piece.color][piece.type];
            }

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            if (legalMoves.some(move => move.to === squareName)) {
                const isCapture = legalMoves.some(
                    move => move.to === squareName &&
                    (move.captured || move.flags.includes("e"))
                );

                square.classList.add(
                    isCapture ? "capture" : "legal"
                );
            }

            if (
                lastMove &&
                (lastMove.from === squareName ||
                 lastMove.to === squareName)
            ) {
                square.classList.add("last-move");
            }

            if (
                game.isCheck() &&
                piece &&
                piece.type === "k" &&
                piece.color === game.turn()
            ) {
                square.classList.add("in-check");
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }

    updateGameStatus();
    updateMoveHistory();
    updateCapturedPieces();
    updateControls();
}

function handleSquareClick(squareName) {

    if (game.isGameOver()) return;

    const piece = game.get(squareName);

    if (selectedSquare) {

        if (legalMoves.some(move => move.to === squareName)) {

            makeMove(selectedSquare, squareName);
            return;
        }
    }

    if (piece && piece.color === game.turn()) {

        selectedSquare = squareName;

        legalMoves = game.moves({
            square: squareName,
            verbose: true
        });

    } else {

        selectedSquare = null;
        legalMoves = [];
    }

    renderBoard();
}

function makeMove(from, to) {

    let promotion = "q";

    const movingPiece = game.get(from);

    if (
        movingPiece &&
        movingPiece.type === "p" &&
        (to.endsWith("8") || to.endsWith("1"))
    ) {
        const choice = prompt(
            "Promote pawn to: q (Queen), r (Rook), b (Bishop), n (Knight)",
            "q"
        );

        promotion = ["q", "r", "b", "n"].includes(
            (choice || "q").toLowerCase()
        ) ? (choice || "q").toLowerCase() : "q";
    }

    try {

        const move = game.move({
            from,
            to,
            promotion
        });

        if (move) {
            lastMove = {
                from: move.from,
                to: move.to
            };

            redoStack = [];
        }

    } catch (error) {
        console.error("Invalid move:", error);
    }

    selectedSquare = null;
    legalMoves = [];

    renderBoard();
}

function updateGameStatus() {

    let message = "";

    if (game.isCheckmate()) {
        message = `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins!`;
    } else if (game.isStalemate()) {
        message = "Draw by stalemate!";
    } else if (game.isThreefoldRepetition()) {
        message = "Draw by threefold repetition!";
    } else if (game.isInsufficientMaterial()) {
        message = "Draw by insufficient material!";
    } else if (game.isDraw()) {
        message = "Game drawn!";
    } else if (game.isCheck()) {
        message = `${game.turn() === "w" ? "White" : "Black"} is in check!`;
    } else {
        message = `${game.turn() === "w" ? "White" : "Black"}'s turn`;
    }

    statusText.textContent = message;
}

function updateMoveHistory() {

    const moves = game.history();

    if (moves.length === 0) {
        historyBox.textContent = "No moves yet.";
        return;
    }

    historyBox.innerHTML = "";

    for (let i = 0; i < moves.length; i += 2) {

        const row = document.createElement("div");
        row.className = "move-row";

        const number = document.createElement("span");
        number.textContent = `${Math.floor(i / 2) + 1}.`;

        const white = document.createElement("span");
        white.textContent = moves[i];

        const black = document.createElement("span");
        black.textContent = moves[i + 1] || "";

        row.append(number, white, black);
        historyBox.appendChild(row);
    }

    historyBox.scrollTop = historyBox.scrollHeight;
}

function updateCapturedPieces() {

    const history = game.history({ verbose: true });

    const capturedByWhite = [];
    const capturedByBlack = [];

    history.forEach(move => {

        if (move.captured) {

            const capturedColor =
                move.color === "w" ? "b" : "w";

            const symbol =
                symbols[capturedColor][move.captured];

            if (move.color === "w") {
                capturedByWhite.push(symbol);
            } else {
                capturedByBlack.push(symbol);
            }
        }
    });

    whiteCaptured.textContent = capturedByWhite.join(" ");
    blackCaptured.textContent = capturedByBlack.join(" ");
}

function updateControls() {

    undoButton.disabled = game.history().length === 0;
    redoButton.disabled = redoStack.length === 0;
}

undoButton.addEventListener("click", () => {

    const move = game.undo();

    if (move) {

        redoStack.push(move);
        lastMove = game.history({ verbose: true }).slice(-1)[0] || null;

        if (lastMove) {
            lastMove = {
                from: lastMove.from,
                to: lastMove.to
            };
        }

        selectedSquare = null;
        legalMoves = [];

        renderBoard();
    }
});

redoButton.addEventListener("click", () => {

    if (redoStack.length === 0) return;

    const move = redoStack.pop();

    try {

        const result = game.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion
        });

        lastMove = {
            from: result.from,
            to: result.to
        };

        selectedSquare = null;
        legalMoves = [];

        renderBoard();

    } catch (error) {
        console.error("Could not redo move:", error);
    }
});

restartButton.addEventListener("click", () => {

    const confirmRestart = confirm(
        "Are you sure you want to restart the game?"
    );

    if (confirmRestart) {

        game.reset();

        redoStack = [];
        lastMove = null;
        selectedSquare = null;
        legalMoves = [];

        renderBoard();
    }
});

renderBoard();