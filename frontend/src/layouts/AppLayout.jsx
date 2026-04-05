import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
