# tiny-router

Минималистичный hash‑роутер (zero‑deps кроме React) с iOS‑стилем анимаций для mini‑apps (VK / Telegram).

## Возможности

- Объявление роутов массивом `{ path, element, lazy? }`
- Динамические параметры `:id`
- `push / replace / back` + собственная история
- Типизированный контекст + хуки: `useRouter`, `useViewTransition`
- Данные о переходе (`from`, `to`, `action`) для анимаций
- iOS‑подобные push/back анимации
- Lazy routes (отложенная загрузка)
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
import { RouterProvider, useRouter } from "tiny-router";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/user/:id", element: <User /> },
  {
    path: "/settings",
    element: <Settings />,
    lazy: () => import("./Settings"),
  },
];

function Home() {
  const { push } = useRouter();
  return <button onClick={() => push("/user/42")}>User 42</button>;
}

export function App() {
  return <RouterProvider routes={routes} />;
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
{ path: '/settings', element: <div /> , lazy: () => import('./Settings') }
```

Коллбек выполнится при первом заходе на маршрут. Вы можете внутри лениво загруженного модуля экспортировать компонент по умолчанию.

## Навигация и анимации

Роутер автоматически определяет направление (push / back) и назначает CSS‑классы для анимаций.

## CSS / Анимации

Базовые классы и keyframes поставляются в `router.module.css`.

## Тестирование

В репозитории используются `bun test` + `happy-dom` + Testing Library.

## Типы

Все публичные типы экспортируются из корневого пакета:

```ts
import type { RouteConfig, RouterViewTransition } from "tiny-router";
```

## Стоит ли вам это использовать?

Скорее всего нет! Это писалось для себя, ибо другие библиотеки кажется раздутыми, и имеют много не нужных мне фич. Да и хотелось бы из коробки базовые анимации переходов между страницами.

## Лицензия

MIT
