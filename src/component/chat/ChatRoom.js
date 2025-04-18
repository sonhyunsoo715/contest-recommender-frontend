// ChatRoom.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import InviteModal from "./InviteModal";
import ParticipantModal from "./ParticipantModal";
import "./ChatRoom.css";
import Back from "../button/Back";
import Swal from "sweetalert2";
import Sched from "../Sched";

const ChatRoom = () => {
  const { roomId } = useParams();
  console.log("📌 useParams roomId:", roomId); // 꼭 찍어보자
  const [showMenu, setShowMenu] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [croomIdx, setCroomIdx] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantsFetched, setParticipantsFetched] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const [roomInfo, setRoomInfo] = useState(null); // ✅ 채팅방 정보
  const [editing, setEditing] = useState(false); // ✅ 제목 수정 모드
  const [newTitle, setNewTitle] = useState(""); // ✅ 수정할 제목

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const userNick = params.get("user") || localStorage.getItem("userNick");

  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const teamId = roomInfo?.teamId;



  // 캘린더 
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const pathRoomId = location.pathname.split("/chatroom/")[1];
    const roomIdOnly = pathRoomId?.split("?")[0];
    if (roomIdOnly && roomIdOnly !== "undefined") {
      setCroomIdx(roomIdOnly);
    }
  }, [location.pathname]);


  const handleOpenCalendar = () => {
    setShowCalendar(true);
    localStorage.setItem("calendarOpen", `room-${croomIdx}`);
  };
  
  const handleCloseCalendar = () => {
    setShowCalendar(false);
    localStorage.removeItem("calendarOpen");
  };
//캘린더 끝


useEffect(() => {
  const idFromPath = location.pathname.split("/chatroom/")[1]?.split("?")[0];
  const validRoomId = idFromPath && idFromPath !== "undefined" ? idFromPath : roomId;
  if (validRoomId) setCroomIdx(validRoomId);
}, [location.pathname, roomId]);


  // 방정보 가져오기
  useEffect(() => {
    if (!roomId || roomId === "undefined") return;

    const fetchRoom = async () => {
      const res = await fetch(`http://192.168.219.184:8085/api/croom/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRoomInfo(data);
    };
    fetchRoom();
  }, [roomId]);


  // 참여자 가져오기
  useEffect(() => {
    if (!croomIdx || !token) return;
  
    const fetchParticipants = async () => {
      try {
        const res = await axios.get(`http://192.168.219.184:8085/api/croom/${croomIdx}/participants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setParticipants(res.data);
      } catch (err) {
        console.error("❌ 참가자 로딩 실패:", err);
      }
    };
  
    fetchParticipants(); // 무조건 불러오기
  }, [croomIdx, token]);
    // showParticipants 상태가 변경될 때만 실행

  useEffect(() => {
    if (roomId) {
      setCroomIdx(roomId);
    }
  }, [roomId]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [croomIdx]);

  useEffect(() => {
    if (!croomIdx) return;
    fetch(`http://192.168.219.184:8085/api/croom/${croomIdx}/messages`)
      .then((res) => res.json())
      .then(setMessages)
      .catch(console.error);
  }, [croomIdx]);

  useEffect(() => {
    if (!croomIdx) return;
  
    const socket = new WebSocket(`ws://192.168.219.184:8085/ws/chat?roomId=${croomIdx}`);
    socketRef.current = socket;
  
    socket.onopen = () => {
      console.log("🟢 WebSocket 연결 성공");
    };
  
    // WebSocket에서 강퇴 알림 처리
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        console.log("💬 받은 메시지:", msg);
        setMessages((prev) => [...prev, msg]);

        // 강퇴 처리
        if (msg.type === "KICK" && msg.targetUserId === currentUserId) {
          alert("⚠️ 방에서 강퇴되었습니다.");
          navigate("/third"); // 채팅방 나가기 후 특정 페이지로 리디렉션
          return;
        }
  
        // 강퇴된 사용자 목록에서 삭제
        if (msg.type === "KICK" && msg.targetUserId !== currentUserId) {
          setParticipants((prevParticipants) =>
            prevParticipants.filter((user) => user.userId !== msg.targetUserId)
          );
        }
      } catch (err) {
        console.error("WebSocket parsing error:", err);
      }
    };
  
    return () => socket.close();
  }, [croomIdx]); // croomIdx가 변경될 때마다 소켓을 재설정합니다.
  
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const sendMessage = async () => {
    if (!message.trim()) return;
    const payload = {
      senderId: currentUserId,
      content: message,
      croomIdx,
      createdAt: new Date().toISOString(),
    };
    console.log("📤 보내는 메시지:", payload);
    socketRef.current?.send(JSON.stringify(payload));
    setMessage("");
    try {
      await axios.post(`http://192.168.219.184:8085/api/croom/${croomIdx}/chat`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
    } catch (err) {
      console.error("Chat save failed:", err);
    }
  };

  // 방제목 수정
  // 방제목 수정
  const handleTitleChange = async () => {
  
    if (!roomId) {
      alert("❌ 채팅방 ID가 없습니다.");
      return;
    }
  
    if (typeof newTitle !== "string" || newTitle.trim() === "") {
      alert("❌ 제목을 입력해주세요.");
      return;
    }
  
    const encodedTitle = encodeURIComponent(newTitle.trim());
  
    try {
      const res = await fetch(`http://192.168.219.184:8085/api/croom/${roomId}/title`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newTitle: newTitle.trim() }) // ✅ 여기에 추가
      });
  
      const msg = await res.text();
      if (!res.ok) {
        alert("❌ 제목 변경 실패: " + msg);
        return;
      }
  
      Swal.fire({
        icon: "success",
        text: `제목이 변경 되었습니다 : ${newTitle}`,
        timer: 1500,
        showConfirmButton: false,
        width : '400px'
      });
      setEditing(false);
      setRoomInfo((prev) => ({ ...prev, croomTitle: newTitle }));
      localStorage.setItem("titleUpdated", "true");
    } catch (err) {
      console.error("❌ 제목 변경 오류:", err);
      alert("요청 중 오류 발생");
    }
  };
  
  


  // 제목 변경 후 조회
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = localStorage.getItem("titleUpdated");
      if (updated === "true" && croomIdx) {
        fetch(`http://192.168.219.184:8085/api/croom/${croomIdx}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setRoomInfo(data);
            localStorage.removeItem("titleUpdated");
          });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [croomIdx]);




    // 파일 올리기
    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
    
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sender", userNick);
      formData.append("croomIdx", croomIdx);
    
      try {
        const res = await fetch("http://192.168.219.184:8085/api/upload", {
          method: "POST",
          body: formData,
        });
    
        if (!res.ok) {
          throw new Error("업로드 실패");
        }
    
        const result = await res.text();
        const filename = result.replace("파일 업로드 성공: ", "").trim();
    
        // 🔥 메시지 전송 payload 직접 구성
        const payload = {
          senderId: currentUserId,
          content: `[파일] ${filename}`,
          croomIdx,
          createdAt: new Date().toISOString(),
        };
    
        // WebSocket을 통해 파일 메시지를 다른 사용자에게 실시간으로 전송
        socketRef.current?.send(JSON.stringify(payload));
    
        // DB 저장
        await axios.post(`http://192.168.219.184:8085/api/croom/${croomIdx}/chat`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
    
        console.log("📎 파일 메시지 전송 완료");
    
      } catch (err) {
        console.error("❌ 파일 업로드 또는 전송 실패:", err);
        alert("파일 메시지 전송 실패");
      }
    };
    const ChatRoom = () => {
      const [croomId, setCroomId] = useState(null);
    
      useEffect(() => {
        // croomId를 채팅방의 ID로 설정하는 예시 (여기선 임시로 1로 설정)
        setCroomId(1); // 실제로는 동적으로 설정해야 합니다.
      }, []);
    
      return (
        <div>
          <h1>채팅방</h1>
          {/* croomId를 MyBigCalendar에 전달 */}
          {croomId && <Sched croomId={croomId} />}
        </div>
      );
    };

  const handleInviteUsers = async (userIds) => {
    if (!token || !croomIdx) return;
    try {
      const currentIds = participants.map((p) => p.userId);
      const newUserIds = userIds.filter((id) => !currentIds.includes(id));
      if (newUserIds.length === 0) {
        Swal.fire({
                    icon: 'error',
                    text: '이미 초대된 유저입니다.',
                    width:'400px'
                  });
        setShowInviteModal(false);
        return;
      }

      await fetch("http://192.168.219.184:8085/api/croom/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatroomId: parseInt(croomIdx), userIds: newUserIds }),
      });

      setShowInviteModal(false);
       Swal.fire({
              text: '초대가 완료되었습니다.',
              icon: 'success',
              width: '300px',
              customClass: {
                popup: 'my-mini-popup',
                icon: 'my-mini-icon'
              }
            });
            
      const res = await fetch(`http://192.168.219.184:8085/api/croom/${croomIdx}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setParticipants(data);
        setParticipantsFetched(true);
        setShowParticipants(true);
      }
    } catch (err) {
      console.error("❌ 초대 또는 참여자 갱신 실패:", err);
      alert("초대 중 오류가 발생했습니다.");
    }
  };

  const handleExitRoom = async () => {
    const result = await Swal.fire({
      title: '정말 나가시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '나가기',
      cancelButtonText: '취소',
      width :'400px'
    });
    
    if (!result.isConfirmed) return;
    try {
      const response = await fetch(
        `http://192.168.219.184:8085/api/croom/${croomIdx}/exit?userId=${currentUserId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const resultText = await response.text();
      if (response.ok) {
        Swal.fire({
          text: '채팅방 삭제 완료',
          icon: 'success',
        });
        socketRef.current?.close();
        navigate("/third");
      } else {
        alert(`❌ 실패: ${resultText}`);
      }
    } catch (err) {
      console.error("❌ 나가기/삭제 에러:", err);
      alert("채팅방 나가기 중 오류가 발생했어요.");
    }
  };

  const fetchParticipants = async () => {
    if (participantsFetched) {
      setShowParticipants(true);
      setShowMenu(false);
      return;
    }
    try {
      const res = await fetch(`http://192.168.219.184:8085/api/croom/${croomIdx}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setParticipants(data);
        setParticipantsFetched(true);
        setShowParticipants(true);
        setShowMenu(false);
      }
    } catch (err) {
      console.error("Failed to load participants:", err);
    }
  };

  const resolveProfileImg = (img) => {
    if (!img || img === "null" || img.trim() === "") {
      return "/default-avatar.png"; // 기본 이미지 경로
    }
    return `http://192.168.219.184:8085/profile_images/${img}`; // 실제 프로필 이미지 경로
  };

  // useState, useRef 등 선언한 후
// 아래 useEffect()들 전/후에 위치 가능
// 강퇴 기능
// handleKickUser 함수에서 targetUserId를 강퇴할 참여자의 ID로 정의
const handleKickUser = async (targetUserId) => {
  if (!roomInfo?.teamId || !currentUserId || !targetUserId) {
    alert("❌ 필요한 정보가 없습니다.");
    return;
  }

  const url = `http://192.168.219.184:8085/api/team/kick/${roomInfo.teamId}?userId=${currentUserId}&targetUserId=${targetUserId}`;
  console.log("🔥 강퇴 요청 URL:", url);

  const confirmKick = window.confirm("정말 강퇴하시겠습니까?");
  if (!confirmKick) return;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const msg = await res.text();

    if (!res.ok) {
      console.error("❌ 서버 응답 실패:", msg);
      alert("❌ 강퇴 실패: " + msg);
      return;
    }

    alert("✅ 강퇴 완료");

    // WebSocket으로 강퇴 알림 전송
    socketRef.current?.send(
      JSON.stringify({
        type: "KICK",
        targetUserId,
        croomIdx,
      })
    );

    // 참여자 목록 갱신
    const updated = await fetch(
      `http://192.168.219.184:8085/api/croom/${croomIdx}/participants`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await updated.json();
    setParticipants(data);

  } catch (err) {
    console.error("🔥 fetch 에러 발생:", err);
    alert("❌ fetch 에러: " + err.message);
  }
};



  
  return (



<div className="chatroom-container">
      
<div className="chatroom-header">
  {/* 왼쪽: 뒤로가기 */}
  <button className="back" onClick={() => navigate("/third")}><Back /></button>

  {/* 가운데: 제목 + 수정 + 햄버거 메뉴를 한 줄에 정렬 */}
  <div className="title-container">
    {editing ? (
      <div className="edit-title">
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      
        placeholder="채팅방 제목 입력"
      />
      <button onClick={handleTitleChange}>저장</button>
      <button className="cancel" onClick={() => setEditing(false)}>취소</button>
    </div>
    
    
    ) : (
      <div className="room-title-wrap">
        <h2 className="room-title">{roomInfo?.croomTitle || "채팅방"}</h2>
        <button
          className="edit-btn"
          onClick={() => {
            setEditing(true);
            setNewTitle(roomInfo?.croomTitle || "");
          }}
        >
          ✏️
        </button>

        {/* 햄버거 버튼도 여기로 이동 */}
        <button className="ham" onClick={() => setShowMenu((prev) => !prev)}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>
    )}
  </div>
</div>

      {showMenu && (
        <div className="hide3">
          <button className="invite" onClick={() => setShowInviteModal(true)}>초대하기</button>
          <button className="getout" onClick={handleExitRoom}>나가기</button>
          <button className="inviteuser" onClick={fetchParticipants}>참여자 보기</button>
          <button className="inviteuser" onClick={handleOpenCalendar}>📅 일정 보기</button>
        </div>
      )}

      {showParticipants && (
        <ParticipantModal participants={participants} onClose={() => setShowParticipants(false)} />
      )}

<div className="message-box">
  
        {messages.map((msg, idx) => {
           if (msg.type === "KICK") return null;
           const isMine = msg.senderId === currentUserId;
           const senderProfile = participants.find((p) => p.userId === msg.senderId);
           const userNick = senderProfile?.userNick;
           const profileImg = resolveProfileImg(senderProfile?.profileImg);
 
            
            const rawFile = msg.content ? msg.content.replace("[파일] ", "").trim() : "";
            const displayName = rawFile.substring(rawFile.indexOf('_') + 1);

          return (
            <div key={idx} className={`message-wrapper ${isMine ? "my-message" : "other-message"}`}>
              {!isMine && (
                <div className="sender-info">
                  <img
                    src={profileImg}
                    alt="프로필 이미지"
                    className="sender-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <div className="sender-name">{userNick}</div>
                </div>
              )}
              <div className="chat-bubble-with-time">
                <div className="chat-bubble">
                  {msg.content?.startsWith("[파일]") ? (
                    <a
                      href={`http://192.168.219.184:8085/api/download/${rawFile}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#007bff", textDecoration: "underline" }}
                    >
                      📎 {displayName}
                    </a>
                  ) : (
                    msg.content
                  )}
                </div>
                <div className="chat-time">{formatTime(msg.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="input-fixed">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            console.log("🧪 키 입력됨:", e.key);
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="메시지 보내기"
        />
        <input type="file" id="file-upload" hidden onChange={handleFileUpload} />
        <label htmlFor="file-upload">📎</label>
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUsers}
          currentUserId={currentUserId}
        />
      )}
{showCalendar && (
  <div className="calendar-modal-overlay">
    <div className="calendar-modal">
      <button onClick={handleCloseCalendar} className="close-calendar-btn">
        ✖
      </button>
      <Sched croomId={parseInt(croomIdx)} />
    </div>
  </div>
)}
{showParticipants && (
  <ParticipantModal
  participants={participants}
  onClose={() => setShowParticipants(false)}
  onKick={handleKickUser}
  currentUserId={currentUserId}
  isOwner={currentUserId == roomInfo?.creatorUserId}
/>

)}
</div>

  );
};

const formatTime = (iso) => {
  const date = new Date(iso);
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
};

export default ChatRoom;