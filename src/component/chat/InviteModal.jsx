import React, { useEffect, useState } from "react";
import { Avatar, Checkbox, Typography, Button, Box, Divider } from "@mui/material";
import "./InviteModal.css";

const InviteModal = ({ onClose, onInvite, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    fetch(`http://192.168.219.184:8085/api/follow/mutual/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("권한 없음");
        return res.json();
      })
      .then(data => {
        const filtered = data.filter(user => user.userId !== userId);
        setUsers(filtered);
      })
      .catch(err => console.error("❌ 맞팔 유저 목록 오류:", err));
  }, [currentUserId]);

  const toggleUser = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="invite-modal-overlay">
      <div className="invite-modal">
        <Typography variant="h6" align="center" gutterBottom>
          맞팔한 유저 초대
        </Typography>
        <Divider />
        <ul className="invite-user-list">
          {users.map(user => (
            <li key={user.userId} className="invite-user-item">
              <label className="user-label">
                <Checkbox
                  checked={selected.includes(user.userId)}
                  onChange={() => toggleUser(user.userId)}
                />
                <Avatar
                  src={user.profileImg
                    ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
                    : "/default-avatar.png"}
                  sx={{ width: 36, height: 36, mr: 1 }}
                />
                <span className="user-nick">{user.userNick}</span>
              </label>
            </li>
          ))}
        </ul>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" mt={2}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => onInvite(selected)}
            disabled={selected.length === 0}
            sx={{ mr: 1 }}
          >
            초대
          </Button>
          <Button variant="outlined" fullWidth onClick={onClose}>
            닫기
          </Button>
        </Box>
      </div>
    </div>
  );
};

export default InviteModal;
