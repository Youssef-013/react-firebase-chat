import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {

  const [user, setUser] = useState(null);

  const { currentUser } = useUserStore();


  const handleSearch = async(e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username  = formData.get("username");

    try {
      const userRef = collection(db, "users");

      const q = query(userRef, where("username", "==", username));

      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
      }
    } catch (err) {
      console.log(err);
    }
  } 

  const handleAdd = async () => {
    if (!user) return; // Ensure there's a user before adding
  
    const chatRef = collection(db, "chats");
    const userChatsRef = doc(db, "userchats", currentUser.id);
  
    try {
      // Get current user's chats
      const userChatsSnap = await getDoc(userChatsRef);
      if (userChatsSnap.exists()) {
        const userChatsData = userChatsSnap.data().chats || [];
  
        // Check if the user is already in the chat list
        const userExists = userChatsData.some(chat => chat.receiverId === user.id);
        if (userExists) {
          alert("User is already in your chat list.");
          return; // Stop execution if user already exists
        }
      }
  
      // Create a new chat if the user is not in the list
      const newChatRef = doc(chatRef);
  
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
  
      // Add chat to both users' chat lists
      await updateDoc(doc(db, "userchats", user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });
  
      await updateDoc(userChatsRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
  
      console.log("User added successfully!");
    } catch (err) {
      console.log(err);
    }
  };
  

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button>Search</button>
      </form>
      {user && <div className="user">
        <div className="detail">
          <img src="./avatar.png" alt="" />
          <span>{user.username}</span>
        </div>
        <button onClick={handleAdd} >Add User </button>
      </div>}
    </div>
  );
};

export default AddUser;