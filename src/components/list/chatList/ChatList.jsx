import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const items = res.data().chats;

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);

          const user = userDocSnap.data();

          return { ...item, user };
        });

        const chatData = await Promise.all(promises);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (chatId, receiverId) => {
    const userChatsRef = doc(db, "userchats", currentUser.id);
    const receiverChatsRef = doc(db, "userchats", receiverId);
    const chatRef = doc(db, "chats", chatId);

    try {
      const userChatsSnap = await getDoc(userChatsRef);
      if (userChatsSnap.exists()) {
        const userChats = userChatsSnap.data().chats || [];
        const updatedUserChats = userChats.filter(chat => chat.chatId !== chatId);
        await updateDoc(userChatsRef, { chats: updatedUserChats });
      }

      const receiverChatsSnap = await getDoc(receiverChatsRef);
      if (receiverChatsSnap.exists()) {
        const receiverChats = receiverChatsSnap.data().chats || [];
        const updatedReceiverChats = receiverChats.filter(chat => chat.chatId !== chatId);
        await updateDoc(receiverChatsRef, { chats: updatedReceiverChats });
      }

      await deleteDoc(chatRef);

      setChats(prev => prev.filter(chat => chat.chatId !== chatId));
    } catch (err) {
      console.log("Error deleting chat:", err);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => (
        <div
        className="item"
        key={chat.chatId}
        onClick={(e) => {
          if (!e.target.classList.contains("deleteBtn")) {
            handleSelect(chat);
          }
        }}
        style={{
          backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
        }}
      >
      
          <img src={"./avatar.png"} alt="" />
          <div className="texts">
            <span>{chat.user.blocked.includes(currentUser.id) ? "User" : chat.user.username}</span>
            <p>{chat.lastMessage}</p>
          </div>
          <button className="delete-btn" onClick={() => handleDelete(chat.chatId, chat.user.id)}>🗑️</button>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
