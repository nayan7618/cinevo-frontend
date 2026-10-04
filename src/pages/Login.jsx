import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  loginUser,
  googleLogin,
} from "../features/auth/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // =========================================
  // AUTH STATE
  // =========================================

  const {
    loading,
    error,
    user,
  } = useSelector((state) => state.auth);

  // =========================================
  // FORM STATE
  // =========================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [googleLoading, setGoogleLoading] =
    useState(false);

  // =========================================
  // GOOGLE
  // =========================================

  const googleInitializedRef =
    useRef(false);

  // =========================================
  // ROLE BASED REDIRECT
  // =========================================

useEffect(() => {
  if (loading || !user) return;

  if (user.role === "ADMIN") {
    navigate("/admin", {
      replace: true,
    });
  } else {
    navigate("/home", {
      replace: true,
    });
  }
}, [user, loading, navigate]);

  // =========================================
  // GOOGLE SIGN-IN INITIALIZATION
  // =========================================

  useEffect(() => {
    let retryTimer;

    const initializeGoogle = () => {
      if (googleInitializedRef.current) {
        return true;
      }

      if (!window.google?.accounts?.id) {
        return false;
      }

      const clientId =
        import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        console.error(
          "❌ VITE_GOOGLE_CLIENT_ID is missing"
        );

        return true;
      }

      const button = document.getElementById(
        "google-login-button"
      );

      if (!button) {
        return false;
      }

      googleInitializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: (response) => {
          if (!response?.credential) {
            console.error(
              "❌ Google credential missing"
            );

            return;
          }

          handleGoogleLogin(
            response.credential
          );
        },
      });

      button.innerHTML = "";

      window.google.accounts.id.renderButton(
        button,
        {
          theme: "outline",
          size: "large",
          width: 380,
          text: "continue_with",
          shape: "rectangular",
        }
      );

      console.log(
        "✅ Google Sign-In initialized"
      );

      return true;
    };

    if (!initializeGoogle()) {
      retryTimer = window.setInterval(() => {
        if (initializeGoogle()) {
          window.clearInterval(
            retryTimer
          );
        }
      }, 300);
    }

    return () => {
      if (retryTimer) {
        window.clearInterval(
          retryTimer
        );
      }
    };
  }, []);

  // =========================================
  // NORMAL LOGIN
  // =========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          email: email.trim(),
          password,
        })
      ).unwrap();

      console.log(
        "✅ Login successful:",
        result?.user
      );

      // Do not navigate here.
      // The role-based redirect useEffect
      // handles ADMIN vs USER.
    } catch (error) {
      console.error(
        "❌ Login failed:",
        error
      );
    }
  };

  // =========================================
  // GOOGLE LOGIN
  // =========================================

  const handleGoogleLogin = async (
    credential
  ) => {
    if (!credential) {
      console.error(
        "❌ Google credential missing"
      );

      return;
    }

    if (googleLoading) {
      return;
    }

    try {
      setGoogleLoading(true);

      const result = await dispatch(
        googleLogin(credential)
      ).unwrap();

      console.log(
        "✅ Google login successful:",
        result?.user
      );

      // Do not navigate here.
      // The role-based redirect useEffect
      // handles ADMIN vs USER.
    } catch (error) {
      console.error(
        "❌ Google login failed:",
        error
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <div className="flex min-h-screen">

        {/* =====================================
            LEFT SIDE
        ===================================== */}

        <div className="relative hidden flex-1 overflow-hidden lg:block">

          <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-black to-black" />

          <div className="relative flex h-full items-center justify-center px-12">

            <div className="max-w-lg">

              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-red-500">
                CINEBOX
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Your entertainment.
                <br />
                Your way.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">
                Watch movies, series and more with
                a personalized streaming experience.
              </p>

            </div>
          </div>
        </div>

        {/* =====================================
            RIGHT SIDE
        ===================================== */}

        <div className="flex w-full items-center justify-center px-5 py-10 lg:w-[500px] lg:px-10">

          <div className="w-full max-w-md">

            {/* LOGO */}

            <div className="mb-8">

              <p className="text-2xl font-black tracking-tight">
                CINE
                <span className="text-red-600">
                  BOX
                </span>
              </p>

              <h2 className="mt-6 text-3xl font-bold">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Sign in to continue watching
              </p>
            </div>

            {/* GOOGLE */}

            <div className="relative">

              <div
                id="google-login-button"
                className="flex justify-center"
              />

              {googleLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#08080c]/60 backdrop-blur-sm">
                  <p className="text-sm text-zinc-300">
                    Signing in with Google...
                  </p>
                </div>
              )}
            </div>

            {/* DIVIDER */}

            <div className="my-6 flex items-center gap-3">

              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs uppercase tracking-wider text-zinc-600">
                or
              </span>

              <div className="h-px flex-1 bg-white/10" />

            </div>

            {/* EMAIL FORM */}

            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-600/60 focus:bg-white/[0.06]"
                    required
                  />

                </div>
              </div>

              {/* PASSWORD */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-zinc-300"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-red-500 transition hover:text-red-400"
                    onClick={() => {
                      console.log(
                        "Forgot password clicked"
                      );
                    }}
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-12 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-600/60 focus:bg-white/[0.06]"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* LOGIN */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>

            </form>

            {/* REGISTER */}

            <p className="mt-7 text-center text-sm text-zinc-500">
              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-red-500 transition hover:text-red-400"
              >
                Create account
              </Link>
            </p>

            {/* TERMS */}

            <p className="mt-6 text-center text-[11px] leading-5 text-zinc-700">
              By continuing, you agree to CINEBOX's
              Terms of Service and Privacy Policy.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;