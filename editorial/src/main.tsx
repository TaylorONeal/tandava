import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import Game from "./Game";
import "./style.css";

createRoot(document.getElementById("root")!).render(<Game />);
