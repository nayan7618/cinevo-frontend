import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Smartphone } from "lucide-react";

// Apne existing authSlice mein agar registerUser already hai,
// toh usko yahan import karna:
import { registerUser } from "../features/auth/authSlice";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error } = useSelector(
    (state) => state.auth
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [localError, setLocalError] = useState("");

 const handleRegister = async (e) => {
  e.preventDefault();
  setLocalError("");

  if (password !== confirmPassword) {
    setLocalError("Passwords do not match.");
    return;
  }

  if (password.length < 6) {
    setLocalError(
      "Password must be at least 6 characters."
    );
    return;
  }

  try {
    await dispatch(
      registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
    ).unwrap();

    console.log("✅ Registration successful");

    navigate("/login");
  } catch (error) {
    console.error("❌ Registration failed:", error);
  }
};

  const handleGoogleRegister = () => {
    console.log("Google registration clicked");
  };



  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      <div className="flex min-h-screen">

        {/* LEFT */}
        <div className="relative hidden flex-1 overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-black to-black" />

          <div className="relative flex h-full items-center justify-center px-12">
            <div className="max-w-lg">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-red-500">
                CINEBOX
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Start your
                <br />
                streaming journey.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">
                Create your account and enjoy movies, series,
                personalized recommendations and more.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex w-full items-center justify-center px-5 py-10 lg:w-[500px] lg:px-10">
          <div className="w-full max-w-md">

            {/* LOGO */}
            <div className="mb-8">
              <p className="text-2xl font-black tracking-tight">
                CINE<span className="text-red-600">BOX</span>
              </p>

              <h2 className="mt-6 text-3xl font-bold">
                Create account
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Join CINEBOX and start watching
              </p>
            </div>

            {/* GOOGLE */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-semibold transition hover:bg-white/[0.08]"
            >
              <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[11px] font-bold text-black">
                G
              </div>

              Continue with Google
            </button>

            {/* DIVIDER */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-wider text-zinc-600">
                or
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >
              {/* NAME */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-600/60 focus:bg-white/[0.06]"
                    required
                  />
                </div>
              </div>

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
                      setEmail(e.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-600/60 focus:bg-white/[0.06]"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Password
                </label>

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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3.5 pl-10 pr-12 text-sm outline-none transition placeholder:text-zinc-700 focus:border-red-600/60 focus:bg-white/[0.06]"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {(localError || error) && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {localError || error}
                </div>
              )}

              {/* CREATE */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            {/* LOGIN */}
            <p className="mt-7 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-red-500 transition hover:text-red-400"
              >
                Sign In
              </Link>
            </p>

            <p className="mt-6 text-center text-[11px] leading-5 text-zinc-700">
              By creating an account, you agree to CINEBOX's
              Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;