import { Circle, X, Minus } from "lucide-react";
import { useState } from "react";

/***** Types *****/
interface GameState {
  turn: "X" | "O";
  end: boolean;
  winner: null | "X" | "O" | "Draw";
}

type gameCell = null | "X" | "O";

interface EndCheck {
  end: boolean;
  winner: "X" | "O" | "Draw" | null;
}

export default function MiniMax() {
  const [gameState, setGameState] = useState<GameState>({
    turn: "X",
    end: false,
    winner: null,
  });

  const [boardState, setBoardState] = useState<gameCell[]>([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  const drawState: gameCell[][] = [
    boardState.slice(0, 3),
    boardState.slice(3, 6),
    boardState.slice(6, 9),
  ];

  function checkEnd(boardState: gameCell[]): EndCheck {
    let end = false;
    let winner: "X" | "O" | "Draw" | null = null;

    const winningCombinations = [
      [boardState[0], boardState[1], boardState[2]],
      [boardState[3], boardState[4], boardState[5]],
      [boardState[6], boardState[7], boardState[8]],
      [boardState[0], boardState[3], boardState[6]],
      [boardState[1], boardState[4], boardState[7]],
      [boardState[2], boardState[5], boardState[8]],
      [boardState[0], boardState[4], boardState[8]],
      [boardState[2], boardState[4], boardState[6]],
    ];

    for (const [v1, v2, v3] of winningCombinations) {
      // X Wins
      if (v1 === "X" && v2 === "X" && v3 === "X") {
        end = true;
        winner = "X";
        break;
      }

      // O Wins
      if (v1 === "O" && v2 === "O" && v3 === "O") {
        end = true;
        winner = "O";
        break;
      }
    }

    // Draw Case
    if (!end && !boardState.includes(null)) {
      end = true;
      winner = "Draw";
    }

    return { end, winner };
  }

  function onClick(row: number, col: number) {
    const idx = 3 * row + col;

    // If game is over, or cell is already filled do not proceed
    if (boardState[idx] !== null || gameState.end) return;

    // Next board state
    const newBoardState = [...boardState];
    newBoardState[idx] = gameState.turn;
    const nextTurn = gameState.turn === "X" ? "O" : "X";

    // Check Winning Condition
    const { end, winner } = checkEnd(newBoardState);

    // Update Board State
    setBoardState(newBoardState);

    // Update Game State
    setGameState({ turn: nextTurn, end, winner });
  }

  return (
    <section className="w-full h-full flex flex-col justify-center items-center gap-10">
      {gameState.end ? (
        <span className="flex">
          Game over!{" "}
          {gameState.winner === "X" ? (
            <>
              <X color="rgba(255,0,0,.5)" /> <p>Wins!</p>
            </>
          ) : gameState.winner === "O" ? (
            <>
              <Circle className="ml-2" color="rgba(0,0,255, 0.5)" /> <p className="ml-2">Wins!</p>
            </>
          ) : (
            <p className="ml-2">Game ended in a Draw!</p>
          )}{" "}
        </span>
      ) : (
        <span className="flex">
          Current Turn:{" "}
          {gameState.turn === "X" ? (
            <X color="rgba(255,0,0,.5)" />
          ) : (
            <Circle color="rgba(0,0,255, 0.5)" />
          )}
        </span>
      )}
      <table>
        {drawState.map((row, i) => (
          <tr className={`${i < 2 && "border-b-2 border-black"}`}>
            {row.map((val, j) => (
              <td
                onClick={() => onClick(i, j)}
                className={`${j < 2 && "border-r-2 border-black"} rounded-lg text-4xl font-bold p-10 ${!gameState.end ? (gameState.turn ? "hover:bg-red-100" : "hover:bg-blue-100") : ""} transition-all ease-in-out ${!gameState.end && "cursor-pointer"}`}
              >
                {val === null ? (
                  <Minus opacity={0.5} />
                ) : val === "O" ? (
                  <Circle color="rgba(0,0,255, 0.5)" />
                ) : (
                  <X color="rgba(255,0,0,.5)" />
                )}
              </td>
            ))}
          </tr>
        ))}
      </table>
    </section>
  );
}
