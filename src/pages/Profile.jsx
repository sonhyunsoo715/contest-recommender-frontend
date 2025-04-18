import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../component/style/Profile.css";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, CircularProgress } from "@mui/material";
import Back from "../component/button/Back";
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import BlockIcon from '@mui/icons-material/Block';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Fourth = () => {
  const navigate = useNavigate();
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const goToProfileEdit = () => navigate("/edit");
  const goToPwChange = () => navigate("/pwchange");
  const goToDelete = () => navigate("/delete");
  const goToBlockedList = () => navigate("/blockedList");
  const handleLogoutClick = () => setOpenLogoutDialog(true);
  const handleLogoutConfirm = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/");
      setIsLoading(false);
      setOpenLogoutDialog(false);
    }, 2000);
  };
  const handleLogoutCancel = () => setOpenLogoutDialog(false);

  return (
    <>
      <div className="profile-container">
        <Back />
        <p className="set-title">설정</p>

        {/* 🔹 회색 영역: 섹션 구분용 */}
        <div className="section-label">계정</div>

        {/* 🔹 흰색 영역: 항목 리스트 */}
        <div className="setting-list">
          <div className="setting-item" onClick={goToProfileEdit}>
            <div className="item-left">
              <PersonIcon className="setting-icon" />
              <span>프로필 수정</span>
            </div>
            <ChevronRightIcon className="chevron-icon" />
          </div>
          <div className="setting-item" onClick={goToPwChange}>
            <div className="item-left">
              <LockIcon className="setting-icon" />
              <span>비밀번호 변경</span>
            </div>
            <ChevronRightIcon className="chevron-icon" />
          </div>
          <div className="setting-item" onClick={goToBlockedList}>
            <div className="item-left">
              <BlockIcon className="setting-icon" />
              <span>차단 목록</span>
            </div>
            <ChevronRightIcon className="chevron-icon" />
          </div>
          <div className="setting-item" onClick={handleLogoutClick}>
            <div className="item-left">
              <LogoutIcon className="setting-icon" />
              <span>로그아웃</span>
            </div>
            <ChevronRightIcon className="chevron-icon" />
          </div>
        </div>

        {/* 🔹 오른쪽 하단 계정 탈퇴 */}
        <div className="delete-btn-container">
          <button className="delete-btn" onClick={goToDelete}>
            <DeleteIcon style={{ marginRight: "4px" }} />
            계정 탈퇴
          </button>
        </div>
      </div>

      <Dialog open={openLogoutDialog} onClose={handleLogoutCancel}>
        <DialogTitle>로그아웃 하시겠습니까?</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <div style={{ textAlign: 'center' }}>
              <CircularProgress />
            </div>
          ) : (
            "로그아웃을 진행하면 모든 세션이 종료됩니다. 계속하시겠습니까?"
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} disabled={isLoading}>아니요</Button>
          <Button onClick={handleLogoutConfirm} disabled={isLoading} color="secondary">
            {isLoading ? "로딩 중..." : "예"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Fourth;