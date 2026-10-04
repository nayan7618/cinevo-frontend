import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminProtectedRoute = () => {
  const { user, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  if (loading) {
    return null;
  }
  console.log("ADMIN CHECK:", {
  isAuthenticated,
  user,
  role: user?.role,
});

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "ADMIN") {
    console.log("Admin access denied. Role:", user?.role);
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;