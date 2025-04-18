import React from "react";
import { useNavigate } from "react-router-dom";
import "../component/style/AccountDelete.css";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Back from "../component/button/Back";

const AccountDeletePage = () => {
  const navigate = useNavigate();

  const goBack = () => navigate(-1);
  const cancelDelete = () => navigate("/profile");
  const confirmDelete = () => navigate("/pwcheck");

  return (
    <div className="account-delete-container">
      {/* 뒤로가기 */}
      <Back/>
      {/* 삭제 아이콘 */}
      <div className="icon-wrapper">
      <DeleteOutlineIcon className="icon-delete" />
      </div>

      {/* 텍스트 */}
      <h3>정말 계정 탈퇴 하시겠습니까?</h3>
      <p>탈퇴 버튼 선택 시, 계정은 삭제되며<br />복구되지 않습니다.</p>

      {/* 버튼 */}
      <div className="button-container">
        <button className="btn cancel" onClick={cancelDelete}>취소</button>
        <button className="btn check2" onClick={confirmDelete}>확인</button>
      </div>
    </div>
  );
};

export default AccountDeletePage;
