import React, { useEffect, useState } from "react";
import "../component/style/BlockedList.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Avatar } from "@mui/material";
import Back from "../component/button/Back";
import Swal from "sweetalert2";

const BlockedListPage = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // 🔁 차단 목록 불러오기 + 각 유저 정보 합치기
  const fetchBlockedUsers = async () => {
    try {
      const meRes = await axios.post(
        "http://192.168.219.184:8085/api/user/me",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const myId = meRes.data.userId;

      const blockRes = await axios.get(
        `http://192.168.219.184:8085/api/block/list/${myId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const blocks = blockRes.data;

      const enrichedUsers = await Promise.all(
        blocks.map(async (block) => {
          try {
            const userInfoRes = await axios.get(
              `http://192.168.219.184:8085/api/user/${block.blockedUserId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const user = userInfoRes.data;
            return {
              userId: block.blockedUserId,
              userNick: user.userNick,
              profileImg: user.profileImg
                ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
                : "/default-avatar.png",
            };
          } catch (err) {
            console.error("❌ 유저 정보 불러오기 실패", err);
            return null;
          }
        })
      );

      setBlockedUsers(enrichedUsers.filter(Boolean));
    } catch (error) {
      console.error("❌ 차단 목록 가져오기 실패:", error);
    }
  };

  // ✅ 차단 해제 + 상태에서 즉시 제거
  const unblockUser = async (blockedUserId) => {
    try {
      const meRes = await axios.post(
        "http://192.168.219.184:8085/api/user/me",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const myId = meRes.data.userId;

      await axios.delete("http://192.168.219.184:8085/api/block/unblock", {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          blockingUserId: myId,
          blockedUserId: blockedUserId,
        },
      });

     Swal.fire({
                       icon: 'success',
                       text: '차단이 해제되었습니다.',
                       width: '400px',
                       customClass: {
                        popup: 'my-mini-popup',
                         icon: 'my-mini-icon'
                       }
                     });

      // ✅ 목록에서 해당 유저 제거
      setBlockedUsers((prev) =>
        prev.filter((user) => user.userId !== blockedUserId)
      );
    } catch (err) {
      console.error("❌ 차단 해제 실패", err);
    }
  };

  const goBack = () => navigate(-1);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  return (
    <div className="blocked-container">
    <Back />
      <h3 className="title">차단 목록</h3>
      <div className="list">
        {blockedUsers.length === 0 ? (
          <p className="empty">차단한 유저가 없습니다.</p>
        ) : (
          blockedUsers.map((user, index) => (
            <div key={index} className="list-item">
              <Avatar src={user.profileImg} alt="profile" className="avatar" />
              <span className="username">{user.userNick || user.userId}</span>
              <button
                className="unblock-btn"
                onClick={() => unblockUser(user.userId)}
              >
                차단 해제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlockedListPage;