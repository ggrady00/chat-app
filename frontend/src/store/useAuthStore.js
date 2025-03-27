import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,

  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/profile");

      set({ authUser: res.data });
    } catch (error) {
        console.log("Err in check auth:", error)
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  register: async (data) => {
    set({isSigningUp: true})
    try {
      const res = await axiosInstance.post("/auth/register", data)
      set({authUser: res.data})
      toast.success("Account created")
    } catch (error) {
      toast.error(error.response.data.msg)
    } finally {
      set({isSigningUp: false})
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout")
      set({authUser: null})
      toast.success("Logged out")
    } catch (error) {
      toast.error(error.response.data.message)
    }
  },
  login: async (data) => {
    set({isLoggingIn: true})
    try {
      const res = await axiosInstance.post("/auth/login", data)
      set({authUser: res.data})
      toast.success("Logged In")
    } catch (error) {
      console.log(error)
      toast.error(error.response.data.msg)
    } finally {
      set({isLoggingIn: false})
    }
  }
}));
