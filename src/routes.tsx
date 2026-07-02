import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { useAuth } from "./core/AuthContext";
import { CircularProgress, Box } from "@mui/material";

// Import features lazily or directly. Direct import is reliable and fast.
import { Login } from "./features/auth/Login";
import { Register } from "./features/auth/Register";
import { ProductList } from "./features/products/ProductList";
import { StoreList } from "./features/stores/StoreList";
import { FloorPlanDashboard } from "./features/floorplan/FloorPlanDashboard";
import { SearchHistory } from "./features/history/SearchHistory";
import { NotificationsDashboard } from "./features/notifications/NotificationsDashboard";
import { PromotionsDashboard } from "./features/promotions/PromotionsDashboard";


// Route protector component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: <Navigate to="/products" replace />,
      },
      {
        path: "products",
        element: <ProductList />,
      },
      {
        path: "stores",
        element: <StoreList />,
      },
      {
        path: "floorplan",
        element: <FloorPlanDashboard />,
      },
      {
        path: "history",
        element: <SearchHistory />,
      },
      {
        path: "notifications",
        element: <NotificationsDashboard />,
      },
      {
        path: "promotions",
        element: <PromotionsDashboard />,
      },

    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
