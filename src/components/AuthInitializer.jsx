import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { getCurrentUser } from "../features/auth/authSlice";

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  return children;
};

export default AuthInitializer;