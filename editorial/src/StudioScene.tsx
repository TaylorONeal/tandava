import { useEffect, useRef } from "react";

/** A decorative canvas; the equivalent occupancy information is available as HTML. */
export function StudioScene({
  occupancy,
  week,
  reducedMotion,
}: {
  occupancy: number;
  week: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    const start = performance.now();
    const people = Math.round(Math.min(1, occupancy) * 12);
    function draw(now: number) {
      const c = ctx!;
      const t = reducedMotion ? 1 : Math.min(1, (now - start) / 650);
      c.clearRect(0, 0, 800, 460);
      c.fillStyle = "#eee6d1";
      c.fillRect(0, 0, 800, 460);
      c.fillStyle = "#dbe9d6";
      c.fillRect(45, 35, 290, 230);
      c.fillStyle = "#f8d47a";
      c.beginPath();
      c.arc(248, 95, 42, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#a1bfa5";
      c.beginPath();
      c.ellipse(140, 240, 220, 100, -0.2, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#fff9e9";
      c.lineWidth = 12;
      c.strokeRect(45, 35, 290, 230);
      c.beginPath();
      c.moveTo(190, 35);
      c.lineTo(190, 265);
      c.moveTo(45, 160);
      c.lineTo(335, 160);
      c.stroke();
      c.fillStyle = "#fff9e9";
      c.fillRect(404, 70, 238, 106);
      c.fillStyle = "#355748";
      c.font = "26px Georgia";
      c.textAlign = "center";
      c.fillText("a little room", 523, 115);
      c.fillText("to grow", 523, 148);
      c.fillStyle = "#dcc5a4";
      c.beginPath();
      c.moveTo(0, 276);
      c.lineTo(800, 276);
      c.lineTo(800, 460);
      c.lineTo(0, 460);
      c.fill();
      c.strokeStyle = "#c8ad88";
      c.lineWidth = 1;
      for (let i = 0; i < 9; i++) {
        c.beginPath();
        c.moveTo(i * 100, 276);
        c.lineTo(i * 140 - 150, 460);
        c.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const x = 120 + (i % 4) * 157,
          y = 305 + Math.floor(i / 4) * 58;
        c.fillStyle = ["#6c9685", "#cc8570", "#b69ab9"][i % 3];
        c.beginPath();
        c.ellipse(x, y + 20, 53, 17, 0, 0, Math.PI * 2);
        c.fill();
        if (i < people) {
          const grow = Math.min(1, t * 2 - i * 0.06);
          if (grow <= 0) continue;
          c.save();
          c.translate(x, y + 10);
          c.scale(grow, grow);
          c.strokeStyle = ["#40594d", "#725974", "#a0523e"][i % 3];
          c.lineWidth = 12;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(-21, 0);
          c.quadraticCurveTo(0, -12, 21, 0);
          c.moveTo(0, -5);
          c.lineTo(0, -24);
          c.stroke();
          c.fillStyle = ["#875b40", "#c38a63", "#e3b78c"][i % 3];
          c.beginPath();
          c.arc(0, -35, 10, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }
      }
      c.fillStyle = "#bc7759";
      c.fillRect(708, 239, 40, 45);
      for (let i = 0; i < 5 + week; i++) {
        c.fillStyle = i % 2 ? "#577c53" : "#769664";
        c.beginPath();
        c.ellipse(
          727 + Math.sin(i * 2) * 21,
          235 - i * 10,
          12,
          25,
          Math.sin(i),
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      if (t < 1) frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [occupancy, week, reducedMotion]);
  return <canvas ref={ref} width={800} height={460} aria-hidden="true" />;
}
