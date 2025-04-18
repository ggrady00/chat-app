import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "../components/ChatHeader";
import MessageInput from "../components/MessageInput";
import MessageSkeleton from "../components/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const Chat = () => {
  const { messages, getMessages, isMessagesLoading, selectedUser, subscribeMessages, unsubscribeMessages } = useChatStore();
  const { authUser } = useAuthStore();
  const chatEndRef = useRef(null)


  const messagesByDate = messages.reduce((acc, msg) => {
    const messageDate = new Date(msg.createdAt).toLocaleDateString("en-GB")
    if(!acc[messageDate]) {
      acc[messageDate] = []
    }
    acc[messageDate].push(msg)

    return acc
  }, {})


  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeMessages()

    return () => unsubscribeMessages()
  }, [selectedUser._id, getMessages, subscribeMessages, unsubscribeMessages]);

  useEffect(()=>{
    if(chatEndRef.current && messages){
      chatEndRef.current?.scrollIntoView({behavior:"smooth"})
    }
  },[messages])

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messagesByDate).map(([date, messageDates]) => (
          <div key={date}>
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-primary/75"></div>
              <span className="text-center text-s opacity-75 px-2">{date}</span>
              <div className="flex-grow border-t border-primary/75"></div>
            </div>
            
            

            {messageDates.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser.profile._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser.profile._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}


          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default Chat;


// {messages.map((message) => (
//   <div
//     key={message._id}
//     className={`chat ${
//       message.senderId === authUser.profile._id ? "chat-end" : "chat-start"
//     }`}
//   >
//     <div className="chat-image avatar">
//       <div className="size-10 rounded-full border">
//         <img
//           src={
//             message.senderId === authUser.profile._id
//               ? authUser.profilePic || "/avatar.png"
//               : selectedUser.profilePic || "/avatar.png"
//           }
//           alt="profile pic"
//         />
//       </div>
//     </div>
//     <div className="chat-header mb-1">
//       <time className="text-xs opacity-50 ml-1">
//         {formatMessageTime(message.createdAt)}
//       </time>
//     </div>
//     <div className="chat-bubble flex flex-col">
//       {message.image && (
//         <img
//           src={message.image}
//           alt="attachment"
//           className="sm:max-w-[200px] rounded-md mb-2"
//         />
//       )}
//       {message.text && <p>{message.text}</p>}
//     </div>
//   </div>
// ))}