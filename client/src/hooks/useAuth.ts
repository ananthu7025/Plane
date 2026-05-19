import type { ApiUser } from "@/types/api";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import {
  setCredentials,
  updateTokens,
  clearCredentials,
  setHydrated,
} from "@/store/slices/authSlice";


function useAuthState() {
  return useSelector((state: RootState) => state.auth);
}

function useAuthDispatch() {
  const dispatch = useDispatch<AppDispatch>();

  return {
    setCredentials: (payload: {
      user: ApiUser;
      accessToken: string;
      refreshToken: string;
    }) => dispatch(setCredentials(payload)),
    updateTokens: (payload: { accessToken: string; refreshToken: string }) =>
      dispatch(updateTokens(payload)),
    logout: () => dispatch(clearCredentials()),
    setHydrated: () => dispatch(setHydrated()),
  };
}


export function useAuth() {
  const auth = useAuthState();
  const actions = useAuthDispatch();

  return {
    ...auth,
    ...actions,
  };
}
