import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";
import GradientWaves from "@/components/GradientWaves";

function App() {
  return (
    <section className="w-screen h-screen overflow-hidden flex flex-col justify-center items-center">
      <h1 className="text-8xl font-bold z-50">SearchViz</h1>
      <p className="text-2xl z-50">Search Algorithms Visualized</p>

      <a href="/explorer" className="my-5 z-50 cursor-pointer">
        <Button>
          Get Started <MoveRight />
        </Button>
      </a>

      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: "0",
        }}
      >
        <div style={{ width: "100%", height: "100%", position: "absolute" }}>
          <GradientWaves
            horizonColor="#5227FF"
            waveColor="#FF9FFC"
            crestColor="#FFFFFF"
            speed={0.4}
            amplitude={2.5}
            waveScale={0.6}
            waveRatio={0.9}
            swell={35}
            turbulence={20}
            tilt={1.11}
            zoom={1}
            height={5.5}
            fogDepth={15}
            detail="medium"
            brightness={1}
            opacity={1}
            mouseInteraction
            parallaxStrength={0.5}
            grain
            grainIntensity={0.05}
          />
        </div>
      </div>
    </section>
  );
}

export default App;
