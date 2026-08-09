import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import MiniMax from "./algos/MiniMax";

export default function Explorer() {
  return (
    <section className="w-screen h-screen overflow-hidden flex flex-col items-center py-5">
      <Combo />
      <MiniMax />
    </section>
  );
}

function Combo() {
  const Algorithms = ["MiniMax(Tic-Tac-Toe)"];
  return (
    <Combobox items={Algorithms}>
      <ComboboxInput placeholder="Select a framework" />
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
