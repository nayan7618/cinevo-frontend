import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

// ==========================================
// LOGIN USER
// ==========================================

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed",
      );
    }
  },
);

// ==========================================
// GOOGLE LOGIN
// ==========================================

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (credential, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/google-login", {
        credential,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Google login failed",
      );
    }
  },
);

// ==========================================
// GET CURRENT USER
// ==========================================

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/me");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Authentication failed",
      );
    }
  },
);

// ==========================================
// REGISTER USER
// ==========================================

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed",
      );
    }
  },
);

// ==========================================
// LOGOUT USER
// ==========================================

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/logout");

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Logout failed",
      );
    }
  },
);

// ==========================================
// INITIAL STATE
// ==========================================

const initialState = {
  user: null,

  isAuthenticated: false,

  loading: true,

  error: null,
};

// ==========================================
// AUTH SLICE
// ==========================================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // ======================================
    // CLEAR AUTH
    // ======================================

    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },

    // ======================================
    // CLEAR AUTH ERROR
    // ======================================

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ======================================
      // LOGIN
      // ======================================

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;

        state.isAuthenticated = true;

        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;

        state.user = null;

        state.isAuthenticated = false;

        state.error = action.payload;
      })

      // ======================================
      // GOOGLE LOGIN
      // ======================================

      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;

        state.isAuthenticated = true;

        state.error = null;
      })

      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;

        state.user = null;

        state.isAuthenticated = false;

        state.error = action.payload;
      })

      // ======================================
      // REGISTER
      // ======================================

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ======================================
      // GET CURRENT USER
      // ======================================

      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;

        state.isAuthenticated = true;

        state.error = null;
      })

      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;

        state.user = null;

        state.isAuthenticated = false;
      })

      // ======================================
      // LOGOUT
      // ======================================

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;

        state.user = null;

        state.isAuthenticated = false;

        state.error = null;
      })

      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload;
      });
  },
});

// ==========================================
// EXPORT ACTIONS
// ==========================================

export const {
  clearAuth,
  clearAuthError,
} = authSlice.actions;

// ==========================================
// EXPORT REDUCER
// ==========================================

export default authSlice.reducer;