import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { fetchProfileById, normalizeProfile, upsertProfile } from "../services/profiles";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aal, setAal] = useState("aal1");
  const [nextAal, setNextAal] = useState("aal1");
  const [hasTotpFactor, setHasTotpFactor] = useState(false);
  const isFetching = useRef(false);
  const sessionRefreshRef = useRef(null);
  const authSyncRef = useRef(Promise.resolve());
  const mountedRef = useRef(true);
  const resumeThrottleRef = useRef(0);
  const lastSessionCheckRef = useRef(0);
  const latestUserRef = useRef(null);
  const latestProfileRef = useRef(null);

  const ensureProfile = async (authUser) => {
    const fallbackName =
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split("@")[0] ||
      "User";

    const payload = {
      id: authUser.id,
      email: authUser.email || null,
      full_name: fallbackName,
      phone: authUser?.user_metadata?.phone || null,
      date_of_birth: authUser?.user_metadata?.date_of_birth || null,
      gender: authUser?.user_metadata?.gender || null,
      city: authUser?.user_metadata?.city || null,
    };

    const { error } = await upsertProfile(payload, { onConflict: "id" });
    if (error) console.error("Profile ensure error:", error.message);
  };

  const fetchProfile = async (authUser) => {
    if (!authUser?.id || isFetching.current) return;
    isFetching.current = true;

    try {
      let { data, error, status } = await fetchProfileById(authUser.id);

      if (error && status !== 406) {
        console.error("Profile fetch error:", error.message);
        setProfile(null);
        latestProfileRef.current = null;
        return;
      }

      if (!data) {
        await ensureProfile(authUser);
        const result = await fetchProfileById(authUser.id);
        data = normalizeProfile(result.data) || null;
      }

      setProfile(data);
      latestProfileRef.current = data;
    } catch (err) {
      console.error("Unexpected profile error:", err.message);
      setProfile(null);
      latestProfileRef.current = null;
    } finally {
      isFetching.current = false;
    }
  };

  const refreshSecurityState = async () => {
    const securityState = {
      aal: "aal1",
      nextAal: "aal1",
      hasTotpFactor: false,
    };
    setAal(securityState.aal);
    setNextAal(securityState.nextAal);
    setHasTotpFactor(securityState.hasTotpFactor);
    return securityState;
  };

  const syncAuthState = async (authUser) => {
    if (!authUser) {
      if (!mountedRef.current) return null;
      setUser(null);
      setProfile(null);
      latestUserRef.current = null;
      latestProfileRef.current = null;
      setAal("aal1");
      setNextAal("aal1");
      setHasTotpFactor(false);
      return null;
    }

    if (!mountedRef.current) return null;
    setUser(authUser);
    latestUserRef.current = authUser;
    await fetchProfile(authUser);
    await refreshSecurityState();
    return authUser;
  };

  const queueAuthSync = async (authUser, { setLoadingState = false } = {}) => {
    authSyncRef.current = authSyncRef.current
      .catch(() => null)
      .then(async () => {
        if (setLoadingState && mountedRef.current) {
          setLoading(true);
        }

        try {
          isFetching.current = false;
          return await syncAuthState(authUser);
        } finally {
          if (setLoadingState && mountedRef.current) {
            setLoading(false);
          }
        }
      });

    return authSyncRef.current;
  };

  const resumeSessionState = async () => {
    if (sessionRefreshRef.current) {
      return sessionRefreshRef.current;
    }

    sessionRefreshRef.current = (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      lastSessionCheckRef.current = Date.now();
      const authUser = session?.user ?? null;
      await queueAuthSync(authUser);
      return authUser;
    })();

    try {
      return await sessionRefreshRef.current;
    } finally {
      sessionRefreshRef.current = null;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    latestUserRef.current = null;
    latestProfileRef.current = null;
    setAal("aal1");
    setNextAal("aal1");
    setHasTotpFactor(false);
  };

  const refreshProfile = async () => {
    if (!user?.id) return null;
    await fetchProfile(user);
    return true;
  };

  useEffect(() => {
    let initialized = false;
    mountedRef.current = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      initialized = true;
      lastSessionCheckRef.current = Date.now();
      await queueAuthSync(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!initialized) return;

      // Avoid running nested Supabase reads directly inside the auth callback lock.
      setTimeout(() => {
        void queueAuthSync(session?.user ?? null, { setLoadingState: true });
      }, 0);
    });

    const handleResume = async () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - resumeThrottleRef.current < 1500) return;
      resumeThrottleRef.current = now;

      const shouldRefresh =
        !latestUserRef.current ||
        !latestProfileRef.current ||
        now - lastSessionCheckRef.current > 5 * 60 * 1000;

      if (!shouldRefresh) {
        return;
      }

      if (mountedRef.current && !latestUserRef.current) {
        setLoading(true);
      }

      try {
        await resumeSessionState();
      } finally {
        if (mountedRef.current && !latestUserRef.current) {
          setLoading(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("pageshow", handleResume);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        logout,
        refreshProfile,
        refreshSecurityState,
        aal,
        nextAal,
        hasTotpFactor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
