import { useRouter } from "../../lib/hooks";

const USERS = Array.from({ length: 50 }).map((_, i) => ({
  id: (i + 1).toString(),
  name: `User ${i + 1}`,
  bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.",
}));

export default function Home() {
  const { push } = useRouter();
  return (
    <div>
      <div className="navbar">
        <h1>Dashboard</h1>
        <button
          onClick={() => push("/settings")}
          style={{ position: "absolute", right: 16, top: 14 }}
        >
          ⚙️
        </button>
      </div>
      <div className="section-title">Users</div>
      <ul className="list">
        {USERS.slice(0, 4).map((u) => (
          <li
            key={u.id}
            className="list-item"
            onClick={() => push(`/user/${u.id}`)}
          >
            {u.name}
            <span className="badge">{u.id}</span>
          </li>
        ))}
      </ul>
      <div className="section-title">Explore</div>
      <div className="card-grid">
        {USERS.slice(4).map((u) => (
          <div
            key={u.id}
            className="card"
            onClick={() => push(`/user/${u.id}`)}
          >
            <h3>{u.name}</h3>
            <p>{u.bio.slice(0, 60)}…</p>
          </div>
        ))}
      </div>
      <div className="footer-hint">Swipe от левого края для back</div>
    </div>
  );
}
