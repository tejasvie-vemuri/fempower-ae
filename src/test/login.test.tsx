import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// ── Global teardown ───────────────────────────────────────────────────────────
// Restore real timers after every test so fake-timer leaks don't cascade.
afterEach(() => vi.useRealTimers());

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  },
}));

vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: null, session: null, loading: false, signOut: vi.fn() })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/useIsAdmin", () => ({
  useIsAdmin: vi.fn(() => ({ isAdmin: false, loading: false })),
}));

// ── Deferred imports (after mocks are hoisted) ────────────────────────────────

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import AuthPage from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderWithRouter = (ui: React.ReactElement, path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      {ui}
    </MemoryRouter>
  );

const setAuthState = (
  overrides: { user?: object | null; loading?: boolean } = {}
) => {
  vi.mocked(useAuth).mockReturnValue({
    user: (overrides.user ?? null) as any,
    session: overrides.user ? ({} as any) : null,
    loading: overrides.loading ?? false,
    signOut: vi.fn(),
  });
};

// Helper: get the active tab panel's scoped queries
const activePanel = () => screen.getByRole("tabpanel");

// ══════════════════════════════════════════════════════════════════════════════
// 1. AuthPage – Sign In
// ══════════════════════════════════════════════════════════════════════════════

describe("AuthPage – Sign In", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  it("renders the sign-in tab as active by default", () => {
    renderWithRouter(<AuthPage />);
    expect(screen.getByRole("tab", { name: /sign in/i })).toHaveAttribute(
      "data-state",
      "active"
    );
    expect(
      within(activePanel()).getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows field errors on empty form submit", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await user.type(within(activePanel()).getByLabelText(/email/i), "not-an-email");
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("clears field error as the user starts correcting email", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    await user.type(within(activePanel()).getByLabelText(/email/i), "a");
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it("calls signInWithPassword with trimmed email and password", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: {}, user: {} } as any,
      error: null,
    });
    renderWithRouter(<AuthPage />);
    await user.type(within(activePanel()).getByLabelText(/email/i), "  test@example.com  ");
    await user.type(within(activePanel()).getByLabelText(/password/i), "secret123");
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "secret123",
      })
    );
  });

  it("shows success toast and navigates home on valid credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: {}, user: {} } as any,
      error: null,
    });
    renderWithRouter(<AuthPage />);
    await user.type(within(activePanel()).getByLabelText(/email/i), "test@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "secret123");
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Welcome back");
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("navigates to custom redirect path on success", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: {}, user: {} } as any,
      error: null,
    });
    renderWithRouter(<AuthPage />, "/auth?redirect=%2Fcircle");
    await user.type(within(activePanel()).getByLabelText(/email/i), "test@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "secret123");
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/circle", { replace: true })
    );
  });

  it("shows error toast on invalid credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: null as any,
      error: { message: "Invalid login credentials" } as any,
    });
    renderWithRouter(<AuthPage />);
    await user.type(within(activePanel()).getByLabelText(/email/i), "test@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "wrongpass");
    await user.click(within(activePanel()).getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Invalid login credentials")
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. AuthPage – Sign Up
// ══════════════════════════════════════════════════════════════════════════════

describe("AuthPage – Sign Up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  const switchToSignUp = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("tab", { name: /create account/i }));
  };

  it("switches to the sign-up tab", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    expect(screen.getByRole("tab", { name: /create account/i })).toHaveAttribute(
      "data-state",
      "active"
    );
  });

  it("shows name error for empty name", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    await user.click(within(activePanel()).getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it("shows email error for invalid email", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    await user.type(within(activePanel()).getByLabelText(/name/i), "Alice");
    await user.type(within(activePanel()).getByLabelText(/email/i), "bad-email");
    await user.click(within(activePanel()).getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("shows password error for fewer than 6 characters", async () => {
    const user = userEvent.setup();
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    await user.type(within(activePanel()).getByLabelText(/name/i), "Alice");
    await user.type(within(activePanel()).getByLabelText(/email/i), "alice@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "abc");
    await user.click(within(activePanel()).getByRole("button", { name: /create account/i }));
    expect(await screen.findByText(/at least 6/i)).toBeInTheDocument();
  });

  it("calls signUp with correct data on valid form", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: {}, session: null } as any,
      error: null,
    });
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    await user.type(within(activePanel()).getByLabelText(/name/i), "Alice");
    await user.type(within(activePanel()).getByLabelText(/email/i), "alice@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "secure123");
    await user.click(within(activePanel()).getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "alice@example.com",
          password: "secure123",
          options: expect.objectContaining({ data: { name: "Alice" } }),
        })
      )
    );
  });

  it("shows confirmation toast after successful sign-up", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: {}, session: null } as any,
      error: null,
    });
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    await user.type(within(activePanel()).getByLabelText(/name/i), "Alice");
    await user.type(within(activePanel()).getByLabelText(/email/i), "alice@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "secure123");
    await user.click(within(activePanel()).getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Check your email to confirm your account")
    );
  });

  it("shows error toast on sign-up failure", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: null as any,
      error: { message: "Email already registered" } as any,
    });
    renderWithRouter(<AuthPage />);
    await switchToSignUp(user);
    await user.type(within(activePanel()).getByLabelText(/name/i), "Alice");
    await user.type(within(activePanel()).getByLabelText(/email/i), "alice@example.com");
    await user.type(within(activePanel()).getByLabelText(/password/i), "secure123");
    await user.click(within(activePanel()).getByRole("button", { name: /create account/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Email already registered")
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. AuthPage – Google OAuth
// ══════════════════════════════════════════════════════════════════════════════

describe("AuthPage – Google OAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  it("calls signInWithOAuth with google provider on button click", async () => {
    const user = userEvent.setup();
    vi.mocked(lovable.auth.signInWithOAuth).mockResolvedValue({} as any);
    renderWithRouter(<AuthPage />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() =>
      expect(lovable.auth.signInWithOAuth).toHaveBeenCalledWith(
        "google",
        expect.objectContaining({ redirect_uri: expect.any(String) })
      )
    );
  });

  it("shows error toast when Google OAuth fails", async () => {
    const user = userEvent.setup();
    vi.mocked(lovable.auth.signInWithOAuth).mockResolvedValue({
      error: new Error("OAuth denied"),
    } as any);
    renderWithRouter(<AuthPage />);
    await user.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Google sign-in failed")
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. AuthPage – Already-authenticated redirect
// ══════════════════════════════════════════════════════════════════════════════

describe("AuthPage – Redirect when already authenticated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to / when user is already logged in", async () => {
    setAuthState({ user: { id: "u1" } });
    renderWithRouter(<AuthPage />);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true })
    );
  });

  it("redirects to the redirect param when user is logged in", async () => {
    setAuthState({ user: { id: "u1" } });
    renderWithRouter(<AuthPage />, "/auth?redirect=%2Fdirectory");
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/directory", { replace: true })
    );
  });

  it("does not redirect while auth is still loading", () => {
    setAuthState({ loading: true, user: null });
    renderWithRouter(<AuthPage />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ForgotPassword
// ══════════════════════════════════════════════════════════════════════════════

describe("ForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email field and submit button", () => {
    renderWithRouter(<ForgotPassword />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows error for empty email", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it("shows error for invalid email format", async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPassword />);
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it("calls resetPasswordForEmail with the entered email", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {} as any,
      error: null,
    });
    renderWithRouter(<ForgotPassword />);
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("/reset-password") })
      )
    );
  });

  it("shows confirmation message after successful submission", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {} as any,
      error: null,
    });
    renderWithRouter(<ForgotPassword />);
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(
      await screen.findByText(/if an account exists/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send reset link/i })).not.toBeInTheDocument();
  });

  it("shows error toast when reset request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: null as any,
      error: { message: "Rate limit exceeded" } as any,
    });
    renderWithRouter(<ForgotPassword />);
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Rate limit exceeded")
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. ResetPassword
// ══════════════════════════════════════════════════════════════════════════════

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as any);
  });

  it("shows a spinner while waiting for session", async () => {
    // getSession never resolves → stuck in loading state
    vi.mocked(supabase.auth.getSession).mockReturnValue(new Promise(() => {}));
    renderWithRouter(<ResetPassword />);
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("shows the form when getSession returns an active session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u1" } } } as any,
    });
    renderWithRouter(<ResetPassword />);
    expect(await screen.findByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows invalid-link message when session is absent after timeout", async () => {
    // Component has an 800 ms setTimeout; wait up to 3 s for it to fire.
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null } as any,
    });
    renderWithRouter(<ResetPassword />);
    expect(
      await screen.findByText(/invalid or has expired/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  }, 5000);

  it("shows password length error for fewer than 6 characters", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u1" } } } as any,
    });
    renderWithRouter(<ResetPassword />);
    await screen.findByLabelText(/new password/i);
    await user.type(screen.getByLabelText(/new password/i), "abc");
    await user.type(screen.getByLabelText(/confirm password/i), "abc");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByText(/at least 6/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u1" } } } as any,
    });
    renderWithRouter(<ResetPassword />);
    await screen.findByLabelText(/new password/i);
    await user.type(screen.getByLabelText(/new password/i), "password1");
    await user.type(screen.getByLabelText(/confirm password/i), "password2");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(await screen.findByText(/don't match/i)).toBeInTheDocument();
  });

  it("calls updateUser with new password on valid form submit", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u1" } } } as any,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {} as any,
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    renderWithRouter(<ResetPassword />);
    await screen.findByLabelText(/new password/i);
    await user.type(screen.getByLabelText(/new password/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm password/i), "newpass1");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() =>
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: "newpass1" })
    );
  });

  it("signs out and redirects to /auth after successful password update", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u1" } } } as any,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: {} as any,
      error: null,
    });
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });
    renderWithRouter(<ResetPassword />);
    await screen.findByLabelText(/new password/i);
    await user.type(screen.getByLabelText(/new password/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm password/i), "newpass1");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/auth", { replace: true });
    });
  });

  it("shows error toast when password update fails", async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: "u1" } } } as any,
    });
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: null as any,
      error: { message: "Token expired" } as any,
    });
    renderWithRouter(<ResetPassword />);
    await screen.findByLabelText(/new password/i);
    await user.type(screen.getByLabelText(/new password/i), "newpass1");
    await user.type(screen.getByLabelText(/confirm password/i), "newpass1");
    await user.click(screen.getByRole("button", { name: /update password/i }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Token expired")
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. ProtectedRoute
// ══════════════════════════════════════════════════════════════════════════════

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Note: <Navigate> internally uses the mocked useNavigate, so real DOM
  // navigation doesn't happen. We verify protection via children visibility
  // and via the mockNavigate calls that <Navigate> triggers.

  const renderProtected = (authState: Parameters<typeof setAuthState>[0] = {}) => {
    setAuthState(authState);
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
  };

  it("shows a spinner while auth is loading", () => {
    renderProtected({ loading: true, user: null });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("hides children and triggers navigation to /auth when not logged in", async () => {
    renderProtected({ user: null });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/auth" }),
        expect.anything()
      )
    );
  });

  it("includes the original path as a redirect query param", async () => {
    setAuthState({ user: null });
    render(
      <MemoryRouter initialEntries={["/dashboard?view=list"]}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/auth",
          search: expect.stringContaining("redirect"),
        }),
        expect.anything()
      )
    );
  });

  it("renders children when user is authenticated", () => {
    renderProtected({ user: { id: "u1" } });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. AdminRoute
// ══════════════════════════════════════════════════════════════════════════════

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAdmin = (
    authState: Parameters<typeof setAuthState>[0] = {},
    adminState = { isAdmin: false, loading: false }
  ) => {
    setAuthState(authState);
    vi.mocked(useIsAdmin).mockReturnValue(adminState);
    return render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AdminRoute>
          <div>Admin panel</div>
        </AdminRoute>
      </MemoryRouter>
    );
  };

  it("shows a spinner while auth or admin check is loading", () => {
    renderAdmin({ loading: true }, { isAdmin: false, loading: true });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    expect(screen.queryByText("Admin panel")).not.toBeInTheDocument();
  });

  it("hides panel and navigates to /auth when not logged in", async () => {
    renderAdmin({ user: null }, { isAdmin: false, loading: false });
    expect(screen.queryByText("Admin panel")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/auth" }),
        expect.anything()
      )
    );
  });

  it("hides panel and navigates to / when user is logged in but not admin", async () => {
    renderAdmin({ user: { id: "u1" } }, { isAdmin: false, loading: false });
    expect(screen.queryByText("Admin panel")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/" }),
        expect.anything()
      )
    );
  });

  it("renders children when user is an admin", () => {
    renderAdmin({ user: { id: "u1" } }, { isAdmin: true, loading: false });
    expect(screen.getByText("Admin panel")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
