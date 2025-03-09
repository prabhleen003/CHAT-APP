import React, { useEffect, useState, useRef } from "react";
import defaultImage from "../Assets/default.jpeg";

import Input from "../Compnents/input";
import { io } from "socket.io-client";

const Dashboard = () => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  ); // user data from local storage

  const [messages, setmessages] = useState({
    messagess: [],
    receiver: null,
    conversationId: null,
  });

  // const [messages, setmessages] = useState({}); //messages of that conversationId
  const [message, setmessage] = useState("");
  const [socket, setSocket] = useState(null); // socket setup
  const messageRef = useRef(null);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [selectedImage, setSelectedImage] = useState(null);
  const [image, setImage] = useState(null);
  const [userId, setUserId] = useState(user?.id);
  const [conversations, setConversations] = useState([]); // all conversations of that user
  const [users, setUsers] = useState([]); // fetching other users
  const [profileClicked, setProfileClicked] = useState(false); // profile clicking
  const [editMode, setEditMode] = useState(false); // handle updation of fullname and image status

  const handlez = async (e) => {
    e.preventDefault();

    if (editMode) {
      if (!userId) {
        alert("User ID not found");
        return;
      }
      const formData = new FormData();
      formData.append("fullName", fullName);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      try {
        const response = await fetch(
          `http://localhost:9000/api/users/update/${userId}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (response.ok) {
          alert(data.message);

          const updatedUser = {
            ...user,
            fullName: fullName,
            images: data.updatedUser.images || user.images,
          };
          localStorage.setItem("user:detail", JSON.stringify(updatedUser));
          setUser(updatedUser);
        } else {
          alert(`Error: ${data.message}`);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while updating the profile.");
      }

      setEditMode(false);
    } else {
      setEditMode(true);
    }
  };

  const handleProfileClick = () => {
    setProfileClicked(true);
  };

  const fetchConversations = async () => {
    const isLoggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const url = `http://localhost:9000/api/conversations/${isLoggedInUser?.id}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const resdata = await res.json();

    setConversations(resdata);
  };

  const fetchUsers = async () => {
    const url = `http://localhost:9000/api/users/${user?.id}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // body: JSON.stringify({conversationId,  senderId: user?.id, message:"hello",receiverId:''})
    });
    const resdata = await res.json();
    setUsers(resdata);
  };

  const handleLogout = () => {
    const userResponse = window.confirm("Do you want to Log Out?");
    if (userResponse) {
      localStorage.removeItem("user:token");
      localStorage.removeItem("user:detail");
      window.location.reload();
    }
  };

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.messagess]);
  useEffect(() => {
    setSocket(io("http://localhost:9000"));
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, [users]);

  const fetchMessages = async (conversationId, receiver) => {
    const url = `http://localhost:9000/api/message/${conversationId}?senderId=${user?.id}&receiverId=${receiver?.recieverId}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resdata = await res.json();

      setmessages({ messagess: resdata, receiver: receiver, conversationId });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendmessage = async (e) => {
    const messageData = {
      conversationId: messages?.conversationId,
      senderId: user?.id,
      message,
      recieverId: messages?.receiver?.recieverId, // Corrected key name
    };

    // Emit the sendMessage event to the server
    socket?.emit("sendMessage", messageData);

    // Save the message to the database via an API call
    const url = `http://localhost:9000/api/message`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });

    const resdata = await res.json();
    console.log("Message saved:", resdata);

    // Update the local state to reflect the new message
    setmessages((prev) => ({
      ...prev,
      messagess: prev.messagess
        ? [
            ...prev.messagess,
            {
              user: {
                id: user?.id,
                fullName: user?.fullName,
                email: user?.email,
              },
              message,
            },
          ]
        : [
            {
              user: {
                id: user?.id,
                fullName: user?.fullName,
                email: user?.email,
              },
              message,
            },
          ],
    }));

    setmessage("");
    fetchConversations();
  };

  useEffect(() => {
    // Load the user object from local storage if available
    const storedUser = localStorage.getItem("user:detail");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setFullName(parsedUser.fullName);
    }
  }, []);

  useEffect(() => {
    socket?.emit("addUser", user?.id);
    socket?.on("getUsers", (users) => {
      console.log("i am aconsole log user", users);
    });
    socket?.on("getMessage", (data) => {
      setmessages((prev) => ({
        ...prev,
        messagess: [
          ...prev.messagess,
          { user: data.user, message: data.message },
        ],

        // messagess: prev.messagess ? [...prev.messagess, { user: data.user, message: data.message }] : [{ user: data.user, message: data.message }]
      }));
      fetchConversations();

    });
    return () => {
      socket?.off("getMessage"); // Cleanup on unmount
    };
  }, [socket]);

  return (
    <div className="w-screen flex bg-black  text-white  h-screen ">
      <div className="w-[20%] border-r border-white h-screen flex flex-col">
        {/* User Profile Section */}
        <div
          className="cursor-pointer flex items-center p-4"
          style={{ height: "20%" }}
          onClick={handleProfileClick}
        >
          {/* Profile Image */}
          <div className="flex w-1/3 justify-center">
            <div className="border border-primary p-[2px] rounded-full">
              <img
                // src={user?.images}

                src={`http://localhost:9000${user.images}`}
                // src={getImageUrl(user?.images)}
                // src={imagez}
                // src={`${process.env.PUBLIC_URL}../Assets/${user?.images}`}
                width={75}
                height={75}
                alt="avatar"
                className="rounded-full"
              />
            </div>
          </div>
          {/* Profile Details */}
          <div className="ml-4 overflow-x-auto whitespace-nowrap w-2/3">
            <h3 className="text-2xl text-white">{user?.fullName}</h3>
            <p className="text-lg font-light text-gray-400">{user?.email}</p>
          </div>
        </div>

        <hr />

        {/* Messages Heading */}
        <div
          className="flex items-center justify-center text-green-500 text-lg font-bold"
          style={{ height: "5%" }}
        >
          Messages
        </div>

        {/* Conversations Section */}
        <div
          className="flex-grow overflow-y-auto overflow-x-hidden p-4"
          style={{ height: "65%" }}
        >
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                className="flex items-center py-4 border-b border-gray-300"
              >
                <div
                  className="cursor-pointer flex items-center bg-black-100 rounded-lg p-4 w-full h-20"
                  onClick={() =>
                    fetchMessages(
                      conversation.conversationId,
                      conversation.user
                    )
                  }
                >
                  {/* Conversation Image */}
                  <div className="flex w-1/3 justify-center">
                    <img
                      // src={avatar}
                      src={`http://localhost:9000${conversation.user.images}`}
                      width={50}
                      height={50}
                      alt="avatar"
                      className="rounded-full"
                    />
                  </div>
                  {/* Conversation Details */}
                  <div className="ml-4 overflow-x-auto whitespace-nowrap w-2/3">
                    <h3 className="text-lg font-semibold text-white">
                      {conversation.user.fullName}
                    </h3>
                    <p className="text-sm font-light text-gray-600">
                      {conversation.user.email}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-lg font-semibold text-gray-600">
              No conversations
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center p-4 text-red-600 font-semibold cursor-pointer"
          style={{ height: "10%" }}
          onClick={handleLogout}
        >
          Log Out
        </div>
      </div>

      <div className="w-[60%] h-full bg-black flex flex-col items-center justify-center">
        {messages?.receiver?.fullName && (
          <div className="w-[75%]  h-[15%] flex items-center px-14">
            <div className="cursor-pointer ">
              <img
                src={`http://localhost:9000${messages?.receiver?.images}`}
                width={50}
                height={60}
                alt="avatar"
                className="rounded-full"
              />
            </div>
            {console.log("iam areciever" + JSON.stringify(messages))}
            <div className="ml-6 mr-auto">
              <h3 className="text-lg text-green-500">
                {messages?.receiver?.fullName}
              </h3>
              <p className="text-sm font-light text-gray-600">
                {messages?.receiver?.email}
              </p>
            </div>
            <div className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-phone-outgoing"
                width="34"
                height="34"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
                <path d="M15 9l5 -5" />
                <path d="M16 4l4 0l0 4" />
              </svg>
            </div>
          </div>
        )}

        <div className="h-[75%] w-full overflow-scroll shadow-sm color-white">
          <div className="px-10 py-10">
            <div>
              {messages?.messagess?.length > 0 ? (
                messages.messagess.map(({ message, user: { id } = {} }) => {
                  return (
                    <>
                      <div
                        className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${
                          id === user.id
                            ? "bg-gray-700 rounded-tl-xl ml-auto"
                            : "bg-green-400 rounded-tr-xl text-white"
                        } `}
                      >
                        {message}
                      </div>
                      <div ref={messageRef}></div>
                    </>
                  );
                })
              ) : (
                <div className="max-w-[40%] text-red-400 rounded-b-xl rounded-tl-xl ml-auto p-4 mb-6 text-xl">
                  No message🙅
                </div>
              )}
            </div>
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-4 w-full flex items-center h-[10%]">
            {/* <div className="flex w-[75%]  rounded-full  border-red-900 bg-black-600 text-yellow-400">
      <Input
        placeholder="Type your message "
        value={message}
        onChange={(e) => setmessage(e.target.value)}
        inputClassName="w-full"
        className="p-4 border-0 shadow-md focus:ring-0 focus:border-0 outline-none "
      />
    </div> */}
            <div className="flex w-[100%] rounded-full bg-black border border-white">
              <Input
                placeholder="Type your message"
                value={message}
                onChange={(e) => setmessage(e.target.value)}
                inputClassName="w-full "
                className="p-4 border-0 shadow-md focus:ring-0 focus:border-0 outline-none bg-black placeholder-white text-white  rounded-full"
              />
            </div>

            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
              onClick={() => sendmessage()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-send"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 14l11 -11" />
                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
              </svg>
            </div>
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !message && "pointer-events-none"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-circle-plus"
                width="30"
                height="30"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="#2c3e50"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                <path d="M9 12h6" />
                <path d="M12 9v6" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="w-[20%] border-l border-gray-300  h-screen bg-black shadow-lg flex flex-col">
        <div
          className="flex items-center justify-center text-green-500 text-2xl font-bold px-10 py-8"
          style={{ height: "15%" }}
        >
          {!profileClicked ? "All Contacts" : "your Profile"}
        </div>
        {!profileClicked ? (
          <>
            <div className="flex-grow overflow-y-auto overflow-x-hidden px-10 py-8">
              {users.length > 0 ? (
                users
                  .sort((a, b) =>
                    a.user.fullName.localeCompare(b.user.fullName)
                  ) // Sort users alphabetically by fullName
                  .map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center py-4 border-b border-gray-200 transition duration-300 ease-in-out cursor-pointer"
                      onClick={() => fetchMessages("new", user.user)}
                    >
                      <div className="flex items-center overflow-x-auto">
                        <img
                          // src={"http://localhost:9000/uploads/React.png"}
                          src={`http://localhost:9000${user.user.images}`} // Construct full URL if necessary
                          // src={avatar}
                          width={50}
                          height={50}
                          alt="avatar"
                          className="rounded-full"
                        />
                        <div className="ml-4 overflow-x-auto">
                          <h3 className="text-lg font-semibold text-white whitespace-nowrap">
                            {user.user.fullName}
                          </h3>
                          <p className="text-sm text-gray-500 whitespace-nowrap">
                            {user.user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center text-lg font-semibold text-gray-600">
                  No users
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-gray-700 px-10 py-8 flex flex-col items-center relative">
            <form onSubmit={handlez} className="w-full">
              <div className="mb-4">
                <p className="text-lg font-light text-gray-400">
                  {user?.email}
                </p>
              </div>
              <hr className="my-6" />

              <div className="flex flex-col items-center mb-6 space-y-4">
                <div className="border border-primary p-[2px] rounded-full">
                  {editMode ? (
                    <div className="relative">
                      <img
                        src={
                          selectedImage
                            ? URL.createObjectURL(selectedImage)
                            : defaultImage
                        }
                        width={100}
                        height={100}
                        alt="Profile"
                        className="rounded-full"
                      />
                      {!selectedImage && (
                        <span className="absolute inset-0 flex items-center justify-center text-white font-semibold">
                          an AI image
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedImage(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <img
                      src={
                        `http://localhost:9000${user.images}` || defaultImage
                      } // Construct full URL if necessary
                      // src={user?.images || defaultImage}
                      width={100}
                      height={100}
                      alt="Profile"
                      className="rounded-full"
                    />
                  )}
                </div>

                {editMode ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black-500 bg-gray-700"
                  />
                ) : (
                  <h3 className="mt-4 text-2xl font-semibold">{fullName}</h3>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editMode ? "Save" : "Edit Profile"}
                </button>
              </div>
            </form>

            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setProfileClicked(false)}
            >
              ❌
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
