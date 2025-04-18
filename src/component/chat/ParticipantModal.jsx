import React from "react";
import "./ParticipantModal.css";

const ParticipantModal = ({ participants, onClose, onKick, currentUserId, isOwner }) => {
  return (
    <div className="participant-modal-overlay">
      <div className="participant-modal-content">
        <h3>참여자 목록</h3>
        <ul className="participant-list">
          {participants.map((user) => (
            <li key={user.userId} className="participant-item">
              <img
                src={
                  user.profileImg
                    ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
                    : "/default-avatar.png"
                }
                alt="프로필"
                className="participant-avatar"
              />
              <span className="participant-nick">{user.userNick}</span>

              {/* ✅ 방장이고 자기 자신이 아닐 때만 강퇴 버튼 */}
              {isOwner && user.userId != currentUserId && (
  <button
    className="kick-btn"
    onClick={() => {
      console.log("👊 강퇴 버튼 클릭됨:", user.userId);
      onKick(user.userId);
    }}
  >
    강퇴
  </button>
)}

            </li>
          ))}
        </ul>
        <div className="participant-actions">
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantModal;
