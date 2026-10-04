import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const MaintenanceGuard = () => {
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkSiteStatus = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/settings/public`,
          {
            withCredentials: true,
          }
        );

        const settings = response.data?.settings;

        setMaintenance(settings?.maintenanceMode === true);

        // Current logged-in user check
        try {
          const userResponse = await axios.get(
            `${API_URL}/auth/me`,
            {
              withCredentials: true,
            }
          );

          const user = userResponse.data?.user;

          setIsAdmin(user?.role === "ADMIN");
        } catch {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Maintenance check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSiteStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking site status...
      </div>
    );
  }

  // Admin maintenance bypass
  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">
            CINEVO
          </h1>

          <h2 className="text-2xl font-semibold mb-3">
            Under Maintenance
          </h2>

          <p className="text-gray-400">
            CINEVO is currently under maintenance.
            Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default MaintenanceGuard;