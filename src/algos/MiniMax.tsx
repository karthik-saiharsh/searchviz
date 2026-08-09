import { Circle, X, Minus } from "lucide-react";
import { useState } from "react";

export default function MiniMax() {
  const [Grid2d, setGrid2d] = useState([
    [-1, -1, -1],
    [-1, -1, -1],
    [-1, -1, -1],
  ]);

  const [Turn, setTurn] = useState(true);
  const [Win, setWin] = useState(false);
  const [WonBy, setWonBy] = useState<null | 0 | 1>(null);

  function toggleTurn() {
    setTurn(!Turn);
  }

  function markValue(i: number, j: number) {
    if (Win) return;

    const val = Turn ? 1 : 0;

    if (Grid2d[i][j] !== -1) return;

    setGrid2d((old) => {
      old[i][j] = val;
      return old;
    });

    toggleTurn();
    checkWin();
  }

  function checkWin() {
    // Check Row wise for wins
    for (const row of Grid2d) {
      if (row.every((val) => val === 0)) {
        setWin(true);
        setWonBy(0);
        return;
      }

      if (row.every((val) => val === 1)) {
        setWin(true);
        setWonBy(1);
        return;
      }
    }

    // Check Column Wise for wins
    for (let i = 0; i < 3; i++) {
      const col = [Grid2d[0][i], Grid2d[1][i], Grid2d[2][i]];

      if (col.every((val) => val === 0)) {
        setWin(true);
        setWonBy(0);
        return;
      }

      if (col.every((val) => val === 1)) {
        setWin(true);
        setWonBy(1);
        return;
      }
    }

    // Check Diagonals for Win
    const leftDiag = [Grid2d[0][0], Grid2d[1][1], Grid2d[2][2]];
    const rightDiag = [Grid2d[0][2], Grid2d[1][1], Grid2d[2][0]];

    if (leftDiag.every((val) => val === 0)) {
      setWin(true);
      setWonBy(0);
      return;
    }

    if (leftDiag.every((val) => val === 1)) {
      setWin(true);
      setWonBy(1);
      return;
    }

    if (rightDiag.every((val) => val === 0)) {
      setWin(true);
      setWonBy(0);
      return;
    }

    if (rightDiag.every((val) => val === 1)) {
      setWin(true);
      setWonBy(1);
      return;
    }
  }

  return (
    <section className="w-full h-full flex flex-col justify-center items-center gap-10">
      {Win ? (
        <p>Game Over! Game Won by {WonBy}</p>
      ) : (
        <span className="flex gap-1">
          Current Turn:{" "}
          {Turn ? (
            <X color="rgba(255,0,0,.5)" />
          ) : (
            <Circle color="rgba(0,0,255, 0.5)" />
          )}
        </span>
      )}
      <table>
        {Grid2d.map((row, i) => (
          <tr className={`${i < 2 && "border-b-2 border-black"}`}>
            {row.map((val, j) => (
              <td
                onClick={() => markValue(i, j)}
                className={`${j < 2 && "border-r-2 border-black"} rounded-lg text-4xl font-bold p-10 ${!Win ? (Turn ? "hover:bg-red-100" : "hover:bg-blue-100") : ""} transition-all ease-in-out ${!Win && "cursor-pointer"}`}
              >
                {val === -1 ? (
                  <Minus opacity={0.5} />
                ) : val === 0 ? (
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
