import { useRouter, useViewTransition } from "../../lib/hooks";

export default function Settings() {
  const { back } = useRouter();
  const t = useViewTransition();
  return (
    <div>
      <div className="navbar">
        <button onClick={back}>Назад</button>
        <h2>Settings</h2>
      </div>
      <div className="detail">
        <h2>Settings</h2>
        <p>
          Здесь можно разместить настройки приложения. Текущее действие
          перехода: <code>{t?.action}</code>
        </p>
        <p>
          Отработал маршрут <code>{t?.from}</code> → <code>{t?.to}</code>
        </p>
      </div>
    </div>
  );
}
