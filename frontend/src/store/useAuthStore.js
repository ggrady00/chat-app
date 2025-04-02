import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {io} from "socket.io-client"

const BASE_URL = import.meta.env.MODE == "development" ? "http://localhost:3000" : "/"

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,

  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/profile");

      set({ authUser: res.data });
      get().connectSocket()
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
      get().connectSocket()
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
      get().disconnectSocket()
    } catch (error) {
      toast.error(error.response.data.message)
    }
  },
  login: async (data) => {
    set({isLoggingIn: true})
    try {
      const res = await axiosInstance.post("/auth/login", data)
      set({authUser: res.data})
      await get().checkAuth() // added as get().connectSocket() wasn't making a connection in just this method
      toast.success("Logged In")
    } catch (error) {
      console.log(error)
      toast.error(error.response.data.msg)
    } finally {
      set({isLoggingIn: false})
    }
  },
  updateProfile: async (data) => {
    set({isUpdatingProfile: true})
    try {
      const res = await axiosInstance.patch("/auth/profile", data)
      set({authUser: res.data})
      toast.success("Updated Profile Photo")
    } catch (error) {
      toast.error(error.response.data.msg)
    } finally {
      set({isUpdatingProfile: false})
    }
  },

  connectSocket: () => {
    const {authUser} = get()
    if(!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser.profile._id
      }
    })
    socket.connect()
    set({socket: socket})

    socket.on("getOnlineUsers", (userIds) => {
      set({onlineUsers: userIds})
    })

  },

  disconnectSocket: () => {
    if(get().socket?.connected) get().socket.disconnect()
  },
}));
