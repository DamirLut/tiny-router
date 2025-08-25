// React import removed (unused with automatic JSX runtime)

import { useRouter } from "../../lib/hooks";

export default function UserDetail() {
  const { params, back, push } = useRouter();
  const id = params.id || "0";
  return (
    <div>
      <div className="navbar">
        <button onClick={back}>Назад</button>
        <h2>User {id}</h2>
      </div>
      <div className="detail">
        <h2>User {id}</h2>
        <p>
          Это подробная карточка пользователя. Здесь можно показать контент,
          вкладки, статистику и т.п. Для демонстрации iOS‑подобных переходов
          просто навигируйте обратно жестом или кнопкой.
        </p>
        <p>
          <strong>Navigation demo:</strong>
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => push(`/user/${Number(id) + 1}`)}>
            Next user
          </button>
          <button onClick={() => push("/settings")}>Settings</button>
        </div>
      </div>
    </div>
  );
}
