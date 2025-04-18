import React, { useEffect, useState, useRef } from "react"; // useRef 추가
import { useNavigate, useLocation } from "react-router-dom"; // useLocation 훅을 사용하여 location 객체 받기
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import InviteModal from "../component/chat/InviteModal"; // 🔥 import 추가
import "../component/chat/ChatPage.css";

const ChatListPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // useLocation 훅을 사용하여 location 객체 받기
  const userId = localStorage.getItem("userId");
  const currentUserId = localStorage.getItem("userId");
  const [chatRooms, setChatRooms] = useState([]); // 채팅방 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const socketRef = useRef(null); // WebSocket을 위한 ref 설정

  // ✅ 채팅방 목록 불러오기
  const fetchChatRooms = () => {
    fetch(`http://192.168.219.184:8085/api/croom/myrooms?userId=${userId}`)
      .then((res) => res.json())
      .then(setChatRooms)
      .catch(console.error);
  };

  useEffect(() => {
    fetchChatRooms(); // 처음에 한번 호출

    const checkUpdate = () => {
      const updated = localStorage.getItem("titleUpdated");
      if (updated === "true") {
        fetchChatRooms(); // 목록 갱신
        localStorage.removeItem("titleUpdated");
      }
    };

    const interval = setInterval(checkUpdate, 1000); // 1초마다 확인

    return () => clearInterval(interval);
  }, []);

  // ✅ WebSocket 연결하여 실시간 메시지 수신
  useEffect(() => {
    const socket = new WebSocket("ws://192.168.219.184:8085/ws/chat");
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("🟢 WebSocket 연결 성공");
    };

    // WebSocket에서 메시지 받기
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("💬 받은 메시지:", msg);
      
      // 새로운 메시지가 오면 채팅방 목록을 업데이트
      setChatRooms((prevRooms) => {
        return prevRooms.map((room) => {
          if (room.croomId === msg.croomIdx) {
            return {
              ...room,
              lastMessage: msg.content,
              lastMessageTime: msg.createdAt,
              lastMessageSenderId: msg.senderId,
            };
          }
          return room;
        });
      });
    };

    return () => {
      socket.close(); // 컴포넌트가 unmount될 때 소켓을 닫아줍니다.
    };
  }, []);

  // ✅ 채팅방 생성 및 초대
  const handleInviteAndCreate = async (selectedUserIds) => {
    try {
      // 0️⃣ 유저 ID 문자열로 정리 (모두 문자열로 변환 후 정렬)
      const allUserIds = [...selectedUserIds, userId]
        .map(String)
        .sort((a, b) => a.localeCompare(b)); // 문자열 정렬

      const query = allUserIds.join(",");

      // 1️⃣ 동일한 채팅방 존재 여부 확인
      const token = localStorage.getItem("token"); // JWT 가져오기

      const resCheck = await fetch(`http://192.168.219.184:8085/api/croom/exists?userIds=${query}`, {
        headers: {
          Authorization: `Bearer ${token}` // ✅ 헤더 추가
        }
      });

      if (!resCheck.ok) {
        const errorText = await resCheck.text();
        console.error("❌ 채팅방 존재 확인 실패:", errorText);
        alert("채팅방 중복 검사에 실패했습니다.");
        return;
      }

      const checkData = await resCheck.json();

      if (checkData.exists) {
        alert("이미 존재하는 채팅방입니다.");
        setIsInviteOpen(false);
        navigate(`/chatroom/${checkData.roomId}?user`);
        return;
      }

      // 2️⃣ 채팅방 생성 요청
      const res = await fetch("http://192.168.219.184:8085/api/croom/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ creatorUserId: userId })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ 채팅방 생성 실패 응답:", errorText);
        alert("채팅방 생성에 실패했습니다.");
        return;
      }

      const data = await res.json();

      // 3️⃣ 초대 유저 존재 시 invite 요청
      if (selectedUserIds.length > 0) {
        // 중복 유저 방지: 이미 초대된 유저가 있으면 제거
        const currentInvitedUsers = await fetch(`http://192.168.219.184:8085/api/croom/${data.id}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json());

        const existingUserIds = currentInvitedUsers.map(user => user.userId);
        const newUserIds = selectedUserIds.filter(id => !existingUserIds.includes(id)); // 중복 유저 제거

        if (newUserIds.length > 0) {
          const inviteRes = await fetch("http://192.168.219.184:8085/api/croom/invite", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chatroomId: parseInt(data.id),
              userIds: newUserIds.map(String)
            })
          });

          if (!inviteRes.ok) {
            const inviteText = await inviteRes.text();
            console.error("❌ 초대 실패 응답:", inviteText);
            alert("유저 초대에 실패했습니다.");
            return;
          }
        }
      }

      // 4️⃣ 채팅방으로 이동
      setIsInviteOpen(false);
      navigate(`/chatroom/${data.id}?user`);

    } catch (err) {
      console.error("❌ 채팅방 생성 또는 초대 실패:", err);
      alert("채팅방 생성 중 오류가 발생했어요.");
    }
  };

  const goToChatRoom = (chatId) => {
    const userNick = localStorage.getItem('userNick') || "익명"; // localStorage에서 userNick을 가져옵니다.
    navigate(`/chatroom/${chatId}?user=${userNick}`); // 쿼리 파라미터로 전달
  };

  /*채팅방 최신순 정렬*/
  const filteredRooms = [...chatRooms]
    .filter(room =>
      room.croomTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aTime = new Date(a.lastMessageTime || 0);
      const bTime = new Date(b.lastMessageTime || 0);
      return bTime - aTime; // 최신 메시지가 위로
    });

  return (
    <div className="chatlist-container">
      {/* 🔍 검색창 */}
      <div className="search-box">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          placeholder="채팅방 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ➕ 채팅방 생성 */}
      <div className="chatlist-header">
        <button className="add-btn" onClick={() => setIsInviteOpen(true)}>
          <AddIcon />
        </button>
      </div>

      {/* 📄 채팅방 목록 */}
      <div className="chatlist">
        {filteredRooms.map((chat) => {
          const lastRead = localStorage.getItem(`lastRead_croomId_${chat.croomId}`);
          const isNew = chat.lastMessageTime && new Date(chat.lastMessageTime) > new Date(lastRead) && chat.lastMessageSenderId !== currentUserId;

          return (
            <div key={chat.croomId} className="chat-item" onClick={() => {
              localStorage.setItem(`lastRead_croomId_${chat.croomId}`, new Date().toISOString());
              goToChatRoom(chat.croomId);
            }}>
              <img
                src={chat.creatorProfileImg
                  ? `http://192.168.219.184:8085/profile_images/${chat.creatorProfileImg}`
                  : "/default-avatar.png"}
                alt="프로필"
                className="chat-avatar"
              />
              <div className="chat-info">
                <div className="chat-name">
                  {chat.isAutoTitle
                    ? `${chat.participantNicks?.join(", ")} 님의 채팅방`
                    : chat.croomTitle?.includes("채팅방")
                      ? chat.croomTitle
                      : chat.croomTitle + " 채팅방"}
                </div>
                <div className="chat-msg">
                  {chat.lastMessage || "메시지가 없습니다"}
                </div>
              </div>

              <div className="chat-time">
                {chat.lastMessageTime && new Date(chat.lastMessageTime).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 👥 맞팔 유저 초대 모달 */}
      {isInviteOpen && (
        <InviteModal
          currentUserId={userId}
          onClose={() => setIsInviteOpen(false)}
          onInvite={handleInviteAndCreate}
        />
      )}
    </div>
  );
};

export default ChatListPage;
