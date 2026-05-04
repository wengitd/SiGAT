import "./App.css";

const API_URL = "http://localhost:8000";

export default function App() {
  return (
    <main className="app">
      <section className="card">
        <h1>SiGAT</h1>
        <p>Sistema de Gestion de Activos Tecnologicos</p>
        <p className="hint">
          Frontend base creado con React + Vite.
          <br />
          API esperada en: <code>{API_URL}</code>
        </p>
        <button
          type="button"
          onClick={() => window.open(`${API_URL}/docs`, "_blank")}
        >
          Ver documentacion API
        </button>
      </section>
    </main>
  );
}
