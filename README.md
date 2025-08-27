# tiny-router

Минималистичный hash‑роутер (zero‑deps кроме React) с iOS‑стилем анимаций для mini‑apps (VK / Telegram).

## Возможности

- Объявление роутов массивом `{ path, element, lazy? }`
- Динамические параметры `:id`
- `push / replace / back` + внутренняя история (без перезагрузок)
- Типизированный контекст + хуки: `useRouter`, `useViewTransition`
- Объект перехода (`from`, `to`, `action`, `customTransition?`) – можно использовать в своих эффектах
- iOS‑подобные push/back анимации по умолчанию
- Точечное переопределение анимации: `push(path, { transition: 'slideBackIn' | 'slideIn' | 'none' })`
- Lazy routes (ленивая загрузка кода) + глобальный спиннер `lazySpinner`
- Восстановление scroll позиции при возврате назад
- Zero dependencies (кроме peer React/ReactDOM)

## Установка

### Прямо из GitHub

```bash
bun add github.com/damirlut/tiny-router
# или
npm i github:damirlut/tiny-router
```

При установке через GitHub сработает `prepare` скрипт и соберёт `dist/`.

## Быстрый старт

```tsx
import { RouterProvider, useRouter, useViewTransition } from "tiny-router";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/user/:id", element: <User /> },
  {
    path: "/settings",
    element: <div />,
    lazy: () => import("./Settings"), // Settings.tsx -> export default Component
  },
  { path: "*", element: <NotFound /> },
];

function Home() {
  const { push } = useRouter();
  return (
    <>
      <button onClick={() => push("/user/42")}>User 42</button>
      <button onClick={() => push("/settings", { transition: "slideBackIn" })}>
        Open settings (custom anim)
      </button>
    </>
  );
}

function HeaderBreadcrumb() {
  const vt = useViewTransition();
  if (!vt) return null;
  return (
    <div style={{ fontSize: 12 }}>
      From: {vt.from} → To: {vt.to}
    </div>
  );
}

export function App() {
  return (
    <RouterProvider
      routes={routes}
      lazySpinner={<div className="spinner">Loading…</div>}
    >
      <HeaderBreadcrumb />
    </RouterProvider>
  );
}
```

## useRouter()

```ts
const {
  push,
  replace,
  back,
  currentPath,
  params, // Record<string,string>
  transition, // { from, to, action, fromElement?, toElement? }
} = useRouter();
```

`transition.action`: `push | replace | back | pop`.

## Параметры пути

`/user/:id/photo/:photoId` => `params.id`, `params.photoId`.

## Lazy routes

```ts
{ path: '/settings', element: <div />, lazy: () => import('./Settings') }
```

Коллбек выполняется при первом заходе. Пока модуль подгружается, если передан `lazySpinner`, он показывается глобально один раз (если несколько lazy страниц в очереди — спиннер остаётся пока все не завершатся).

## Навигация и анимации

Роутер сравнивает текущее действие: `push` → слайд слева направо (новая страница заезжает), `back` → обратная анимация. Можно принудительно задать анимацию либо отключить:

```ts
push("/profile", { transition: "slideBackIn" });
push("/plain", { transition: "none" });
```

Переопределение одноразовое – хранится только для ближайшего перехода.

## CSS / Анимации

Базовые классы и keyframes лежат в `global.css` (подключается автоматически). Вы можете переопределить их в своём проекте по селекторам:

```
.tiny-router-slideIn { /* ... */ }
.tiny-router-slideOutLeft { /* ... */ }
```

## Тестирование

В репо используются `bun test` + `happy-dom` + Testing Library. Покрытие >99%. Запуск:

```bash
bun test --coverage
```

## Типы

Все публичные типы экспортируются из корня:

```ts
import type {
  RouteConfig,
  RouterViewTransition,
  NavigationOptions,
} from "tiny-router";
```

## Стоит ли вам это использовать?

Чаще всего вам хватит существующих решений (wouter, react-router, tanstack router). Этот проект – эксперимент: минимальный hash‑роутер с готовыми анимациями + простым API.

## Лицензия

MIT
