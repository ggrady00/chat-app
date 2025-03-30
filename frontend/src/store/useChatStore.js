import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,


    getUsers: async () => {
        set({isUsersLoading: true})
        try {
            const res = await axiosInstance.get("/message/users")
            set({users: res.data.users})
        } catch (error) {
            toast.error(error.response.data.msg)
        } finally {
            set({isUsersLoading: false})
        }
    },

    getMessages: async (userId) => {
        set({isMessagesLoading: true})
        try {
            const res = await axiosInstance.get(`/message/${userId}`)
            set({messages: res.data.messages})
        } catch (error) {
            toast.error(error.response.data.msg)
        } finally {
            set({isMessagesLoading: false})
        }
    },

    sendMessage: async (data) => {
        const {selectedUser, messages} = get()
        try {
            const res = await axiosInstance.post(`/message/${selectedUser._id}`, data)
            set({messages: [...messages, res.data.message]})
        } catch (error) {
            console.log("store", error)
            toast.error(error.response.data.msg)
        }
    },

    setSelectedUser: (selectedUser) => {
        set({selectedUser})
    }
}))