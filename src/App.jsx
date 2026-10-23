import { useEffect } from "react";
import LightSwitch from "./components/LightSwitch/LightSwitch.jsx";

// body[data-task] is used by styles/base.css for this task's page background.
const TASK_ID = "7";

export default function App() {
  useEffect(() => {
    document.body.dataset.task = TASK_ID;
    return () => { delete document.body.dataset.task; };
  }, []);

  return (
    <main className="page">
      <div className="page-head">
        <span className="task-chip">Task 7</span>
        <h1 className="page-title">Light Switch</h1>
        <p className="page-sub">Switch the light on and off using a toggle button.</p>
      </div>
      <LightSwitch />
    </main>
  );
}
