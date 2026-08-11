import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import MiniMax from "./algos/MiniMax";
import Blank from "./algos/Blank";
import { useState } from "react";

const GAME_MAPPINGS = {
  blank: <Blank />,
  "MiniMax(Tic-Tac-Toe)": <MiniMax />,
};

export default function Explorer() {
  const [currentAlgo, setCurrentAlgo] =
    useState<keyof typeof GAME_MAPPINGS>("blank");
  return (
    <section className="w-screen h-screen overflow-hidden flex flex-col items-center py-5">
      <Combo algoSetter={setCurrentAlgo} />
      {GAME_MAPPINGS[currentAlgo]}
    </section>
  );
}

function Combo(props: {
  algoSetter: React.Dispatch<React.SetStateAction<keyof typeof GAME_MAPPINGS>>;
}) {
  const { algoSetter } = props;

  const Algorithms = ["MiniMax(Tic-Tac-Toe)"];
  return (
    <Combobox
      items={Algorithms}
      onValueChange={(item: any) => algoSetter(item)}
    >
      <ComboboxInput placeholder="Choose an Algorithm" />
      <ComboboxContent>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
