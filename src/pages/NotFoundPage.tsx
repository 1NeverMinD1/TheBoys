import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <Link to="/" className="text-violet-400 hover:underline">
        На главную
      </Link>
    </div>
  );
}
