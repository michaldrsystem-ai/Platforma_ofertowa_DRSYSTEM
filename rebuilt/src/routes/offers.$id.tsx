import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Stara ścieżka edytora oferty — przekierowuje do kreatora /new z parametrem id,
 * dzięki czemu edycja istniejącej oferty wygląda tak samo jak jej tworzenie.
 */
export const Route = createFileRoute("/offers/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/new",
      search: { id: params.id },
    });
  },
  component: () => null,
});
