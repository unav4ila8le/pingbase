import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dashboard")({
  component: Dashboard,
  loader: ({ context }) => {
    return {
      user: context.user,
    };
  },
});

function Dashboard() {
  const data = Route.useLoaderData();

  return <p>Hello {data.user.email}</p>;
}
