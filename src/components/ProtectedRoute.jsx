import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const location = useLocation();

  const { isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  // Auth check complete hone tak
  // redirect mat karo
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08080c] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-red-500" />

          <p className="text-sm text-zinc-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Auth check complete + login nahi hai
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;