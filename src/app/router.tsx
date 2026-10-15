import { createBrowserRouter } from "react-router";
import { MainLayout } from "@/app/layout/MainLayout";
import { HomePage } from "@/pages/HomePage";
import { CatalogPage } from "@/pages/CatalogPage";
import { MapPage } from "@/pages/MapPage";
import { ClubPage } from "@/pages/ClubPage";
import { BookingPage } from "@/pages/BookingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "clubs", element: <CatalogPage /> },
      { path: "clubs/:clubId", element: <ClubPage /> },
      { path: "clubs/:clubId/booking", element: <BookingPage /> },
      { path: "map", element: <MapPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
