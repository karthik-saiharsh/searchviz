import { Circle, X, Minus } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type ReactFlowInstance
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

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

/***** Helpers *****/
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
    if (v1 === "X" && v2 === "X" && v3 === "X") {
      end = true;
      winner = "X";
      break;
    }
    if (v1 === "O" && v2 === "O" && v3 === "O") {
      end = true;
      winner = "O";
      break;
    }
  }

  if (!end && !boardState.includes(null)) {
    end = true;
    winner = "Draw";
  }

  return { end, winner };
}

function getBoardId(board: gameCell[]) {
  return board.map((c) => c || "-").join("");
}

function isMaxTurn(board: gameCell[]) {
  const xCount = board.filter((c) => c === "X").length;
  const oCount = board.filter((c) => c === "O").length;
  return xCount > oCount; // If X has played more, it's O's turn (AI = MAX)
}

function createNode(board: gameCell[], id: string, isMax: boolean, score: number | null): Node {
  return {
    id,
    type: "boardNode",
    data: { board: [...board], isMax, score, isPath: false },
    position: { x: 0, y: 0 },
  };
}

function applyLayout(nodesMap: Map<string, Node>, edgesMap: Map<string, Edge>) {
  const nodes = Array.from(nodesMap.values());
  const edges = Array.from(edgesMap.values());

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", ranksep: 60, nodesep: 40 });

  nodes.forEach((n) => {
    dagreGraph.setNode(n.id, { width: 80, height: 100 });
  });

  edges.forEach((e) => {
    dagreGraph.setEdge(e.source, e.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((n) => {
    const pos = dagreGraph.node(n.id);
    return {
      ...n,
      position: { x: pos.x - 40, y: pos.y - 50 },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}

/***** Custom React Flow Node *****/
function BoardNode({ data }: { data: any }) {
  const isMax = data.isMax;
  const isPath = data.isPath;

  return (
    <div
      className={`flex flex-col items-center bg-white border-2 rounded p-1 w-[80px] ${
        isPath
          ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)]"
          : isMax
          ? "border-red-500"
          : "border-blue-500"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2" />
      <div className={`text-[9px] font-bold mb-1 leading-none ${isMax ? "text-red-600" : "text-blue-600"}`}>
        {isMax ? "MAX (O)" : "MIN (X)"}
      </div>
      <div className="grid grid-cols-3 gap-[2px] bg-gray-300 p-[2px] rounded-sm w-full">
        {data.board.map((cell: any, i: number) => (
          <div
            key={i}
            className="w-5 h-5 bg-white flex items-center justify-center font-bold text-xs"
          >
            {cell === "X" ? (
              <X size={14} color="red" />
            ) : cell === "O" ? (
              <Circle size={14} color="blue" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="text-[10px] mt-1 font-bold leading-none whitespace-nowrap">
        Score: {data.score === null ? "?" : data.score}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2" />
    </div>
  );
}

const nodeTypes = {
  boardNode: BoardNode,
};

export default function MiniMax() {
  const [gameState, setGameState] = useState<GameState>({
    turn: "X",
    end: false,
    winner: null,
  });

  const [boardState, setBoardState] = useState<gameCell[]>(Array(9).fill(null));
  const [depthLimit, setDepthLimit] = useState<number>(5);
  const [graphView, setGraphView] = useState<"hidden" | "split" | "fullscreen">("split");
  const [showOnlyPath, setShowOnlyPath] = useState<boolean>(false);

  const nodesRef = useRef<Map<string, Node>>(new Map());
  const edgesRef = useRef<Map<string, Edge>>(new Map());
  const historyRef = useRef<string[]>([]);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const drawState: gameCell[][] = [
    boardState.slice(0, 3),
    boardState.slice(3, 6),
    boardState.slice(6, 9),
  ];

  const updateGraph = useCallback((endGame = false) => {
    let nodesToLayout = nodesRef.current;
    let edgesToLayout = edgesRef.current;

    if (showOnlyPath) {
      nodesToLayout = new Map();
      edgesToLayout = new Map();
      for (const id of historyRef.current) {
        if (nodesRef.current.has(id)) nodesToLayout.set(id, nodesRef.current.get(id)!);
      }
      for (const [edgeId, edge] of edgesRef.current.entries()) {
        if (historyRef.current.includes(edge.source) && historyRef.current.includes(edge.target)) {
          edgesToLayout.set(edgeId, edge);
        }
      }
    }

    let { nodes, edges } = applyLayout(nodesToLayout, edgesToLayout);

    nodes = nodes.map((n) => ({
      ...n,
      data: { ...n.data, isPath: historyRef.current.includes(n.id) },
      style: historyRef.current.includes(n.id) ? { zIndex: 1000 } : {},
    }));

    edges = edges.map((e) => {
      const isPathEdge =
        historyRef.current.includes(e.source) &&
        historyRef.current.includes(e.target) &&
        historyRef.current.indexOf(e.target) === historyRef.current.indexOf(e.source) + 1;
      return {
        ...e,
        animated: isPathEdge,
        style: isPathEdge
          ? { stroke: "#facc15", strokeWidth: 3, zIndex: 1000 }
          : { opacity: endGame ? 0.2 : 0.5 },
      };
    });

    setRfNodes(nodes);
    setRfEdges(edges);
  }, [setRfNodes, setRfEdges, showOnlyPath]);

  useEffect(() => {
    // Init Graph
    if (nodesRef.current.size === 0) {
      const emptyBoard = Array(9).fill(null);
      const rootId = getBoardId(emptyBoard);
      nodesRef.current.set(rootId, createNode(emptyBoard, rootId, false, 0));
      historyRef.current = [rootId];
    }
    updateGraph(gameState.end);
  }, [updateGraph, gameState.end]);

  useEffect(() => {
    if (rfInstance) {
      // Give React Flow a moment to render the new nodes or container size before fitting
      setTimeout(() => {
        rfInstance.fitView({ padding: 0.2, duration: 800 });
      }, 50);
    }
  }, [showOnlyPath, graphView, rfInstance]);

  function runAITurn(currentBoard: gameCell[]) {
    const tempNodes = new Map(nodesRef.current);
    const tempEdges = new Map(edgesRef.current);

    function minimax(
      board: gameCell[],
      depth: number,
      alpha: number,
      beta: number,
      parentId: string | null
    ): number {
      const id = getBoardId(board);
      const isMax = isMaxTurn(board);
      const { end, winner } = checkEnd(board);

      if (!tempNodes.has(id)) {
        tempNodes.set(id, createNode(board, id, isMax, null));
      }

      if (parentId) {
        const edgeId = `${parentId}->${id}`;
        if (!tempEdges.has(edgeId)) {
          tempEdges.set(edgeId, {
            id: edgeId,
            source: parentId,
            target: id,
            type: "default",
          });
        }
      }

      if (end) {
        let score = 0;
        if (winner === "O") score = 10;
        else if (winner === "X") score = -10;
        tempNodes.get(id)!.data.score = score;
        return score;
      }
      if (depth === 0) {
        tempNodes.get(id)!.data.score = 0;
        return 0;
      }

      const emptyIdxs = board
        .map((c, i) => (c === null ? i : -1))
        .filter((i) => i !== -1);

      let bestScore = isMax ? -Infinity : Infinity;

      for (const idx of emptyIdxs) {
        const nextBoard = [...board];
        nextBoard[idx] = isMax ? "O" : "X";

        const score = minimax(nextBoard, depth - 1, alpha, beta, id);

        if (isMax) {
          bestScore = Math.max(bestScore, score);
          alpha = Math.max(alpha, bestScore);
        } else {
          bestScore = Math.min(bestScore, score);
          beta = Math.min(beta, bestScore);
        }

        if (beta <= alpha) {
          break; // Prune
        }
      }

      tempNodes.get(id)!.data.score = bestScore;
      return bestScore;
    }

    const rootId = getBoardId(currentBoard);
    let bestMove = -1;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    const emptyIdxs = currentBoard
      .map((c, i) => (c === null ? i : -1))
      .filter((i) => i !== -1);

    if (!tempNodes.has(rootId)) {
      tempNodes.set(rootId, createNode(currentBoard, rootId, true, null));
    }

    for (const idx of emptyIdxs) {
      const nextBoard = [...currentBoard];
      nextBoard[idx] = "O";

      const score = minimax(nextBoard, depthLimit - 1, alpha, beta, rootId);

      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
      alpha = Math.max(alpha, bestScore);
    }

    tempNodes.get(rootId)!.data.score = bestScore;

    return { bestMove, tempNodes, tempEdges };
  }

  function onClick(row: number, col: number) {
    const idx = 3 * row + col;

    if (boardState[idx] !== null || gameState.end || gameState.turn !== "X") return;

    // Human move
    const newBoardState = [...boardState];
    newBoardState[idx] = "X";

    const prevId = getBoardId(boardState);
    const newId = getBoardId(newBoardState);

    if (!nodesRef.current.has(newId)) {
      nodesRef.current.set(newId, createNode(newBoardState, newId, true, null));
    }
    const edgeId = `${prevId}->${newId}`;
    if (!edgesRef.current.has(edgeId)) {
      edgesRef.current.set(edgeId, {
        id: edgeId,
        source: prevId,
        target: newId,
        type: "default",
      });
    }
    historyRef.current.push(newId);

    const { end, winner } = checkEnd(newBoardState);
    setBoardState(newBoardState);

    if (end) {
      setGameState({ turn: "O", end, winner });
      updateGraph(true);
      return;
    }

    setGameState({ turn: "O", end, winner });

    // Allow UI to render human move before AI blocking
    setTimeout(() => {
      const { bestMove, tempNodes, tempEdges } = runAITurn(newBoardState);
      
      nodesRef.current = tempNodes;
      edgesRef.current = tempEdges;

      if (bestMove !== -1) {
        const aiBoardState = [...newBoardState];
        aiBoardState[bestMove] = "O";
        const aiId = getBoardId(aiBoardState);

        historyRef.current.push(aiId);

        const aiEndCheck = checkEnd(aiBoardState);
        setBoardState(aiBoardState);
        setGameState({ turn: "X", end: aiEndCheck.end, winner: aiEndCheck.winner });

        updateGraph(aiEndCheck.end);
      } else {
        updateGraph(true);
      }
    }, 50);
  }

  function resetGame() {
    setGameState({ turn: "X", end: false, winner: null });
    const emptyBoard = Array(9).fill(null);
    setBoardState(emptyBoard);
    
    nodesRef.current = new Map();
    edgesRef.current = new Map();
    const rootId = getBoardId(emptyBoard);
    nodesRef.current.set(rootId, createNode(emptyBoard, rootId, false, 0));
    historyRef.current = [rootId];
    
    updateGraph();
  }

  return (
    <section className="w-full h-full flex flex-col pt-4 overflow-hidden relative">
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="flex gap-2">
           <button onClick={() => setGraphView("hidden")} className={`px-3 py-1 rounded text-sm font-bold shadow transition-colors ${graphView === 'hidden' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>Hide Graph</button>
           <button onClick={() => setGraphView("split")} className={`px-3 py-1 rounded text-sm font-bold shadow transition-colors ${graphView === 'split' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>Split View</button>
           <button onClick={() => setGraphView("fullscreen")} className={`px-3 py-1 rounded text-sm font-bold shadow transition-colors ${graphView === 'fullscreen' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>Full Graph</button>
        </div>
        {graphView !== "hidden" && (
        <div className="bg-white/90 p-2 rounded shadow flex items-center gap-2">
           <input type="checkbox" id="show-path" checked={showOnlyPath} onChange={(e) => setShowOnlyPath(e.target.checked)} className="cursor-pointer" />
           <label htmlFor="show-path" className="text-sm font-bold cursor-pointer">Show chosen path</label>
        </div>
        )}
      </div>

      {/* Game UI Section */}
      {graphView !== "fullscreen" && (
      <div className={`flex flex-col justify-center items-center gap-4 px-4 pb-4 z-10 ${graphView === "hidden" ? "flex-1" : "flex-none bg-white/80 rounded-b-xl shadow-sm"}`}>
        {gameState.end ? (
          <div className="flex flex-col items-center">
            <span className="flex text-2xl font-bold items-center">
              Game over!{" "}
              {gameState.winner === "X" ? (
                <>
                  <X color="red" className="mx-2" size={32} /> <p>Wins!</p>
                </>
              ) : gameState.winner === "O" ? (
                <>
                  <Circle color="blue" className="mx-2" size={32} /> <p>Wins!</p>
                </>
              ) : (
                <p className="ml-2">Draw!</p>
              )}
            </span>
            <button onClick={resetGame} className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors">
              Play Again
            </button>
          </div>
        ) : (
          <span className="flex text-2xl font-bold items-center">
            Current Turn:{" "}
            {gameState.turn === "X" ? (
              <X color="red" className="ml-2" size={32} />
            ) : (
              <Circle color="blue" className="ml-2" size={32} />
            )}
          </span>
        )}

        <div className="flex items-center gap-4 my-2">
          <label htmlFor="depth-slider" className="font-bold whitespace-nowrap">
            AI Depth Limit: {depthLimit}
          </label>
          <input
            id="depth-slider"
            type="range"
            min="1"
            max="9"
            value={depthLimit}
            onChange={(e) => setDepthLimit(Number(e.target.value))}
            className="w-48 cursor-pointer"
          />
        </div>

        <table className="border-collapse">
          <tbody>
            {drawState.map((row, i) => (
              <tr key={i} className={`${i < 2 && "border-b-4 border-black"}`}>
                {row.map((val, j) => (
                  <td
                    key={j}
                    onClick={() => onClick(i, j)}
                    className={`${
                      j < 2 && "border-r-4 border-black"
                    } w-24 h-24 text-4xl font-bold p-0 ${
                      !gameState.end && gameState.turn === "X" && val === null
                        ? "hover:bg-red-100 cursor-pointer"
                        : ""
                    } transition-all ease-in-out text-center align-middle`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      {val === null ? (
                        <Minus opacity={0.1} />
                      ) : val === "O" ? (
                        <Circle color="blue" size={48} />
                      ) : (
                        <X color="red" size={48} />
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* React Flow Graph Section */}
      {graphView !== "hidden" && (
      <div className="flex-1 w-full relative bg-gray-50 border-t-2 border-gray-200 overflow-hidden">
        <div className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded shadow text-xs font-mono">
          <h3 className="font-bold mb-1 underline">Legend</h3>
          <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-red-500"></div> AI (MAX) Node</div>
          <div className="flex items-center gap-2 mt-1"><div className="w-3 h-3 border-2 border-blue-500"></div> Human (MIN) Node</div>
          <div className="flex items-center gap-2 mt-1"><div className="w-3 h-3 border-2 border-yellow-400 bg-yellow-100"></div> Chosen Path</div>
        </div>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
        >
          <Background color="#ccc" gap={16} />
          <Controls />
        </ReactFlow>
      </div>
      )}
    </section>
  );
}
