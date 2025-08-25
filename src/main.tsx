import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import ExampleApp from "./example/ExampleApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ExampleApp />
  </StrictMode>,
);
