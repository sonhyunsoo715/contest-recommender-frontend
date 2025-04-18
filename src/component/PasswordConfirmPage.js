import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../component/style/PasswordConfirmPage.css";
import axios from "axios";
import Back from "../component/button/Back";
import Confirm from "./button/Confirm";
import Swal from "sweetalert2";

const PasswordConfirmPage = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // ✅ 이름 통일

  const handleDeleteAccount = async () => {
    if (password !== confirmPassword) {
      Swal.fire({
                        icon: 'error',
                        title: '비밀번호가 일치하지 않습니다.',
                        width: '400px',
                        customClass: {
                         popup: 'my-mini-popup',
                          icon: 'my-mini-icon'
                        }
                      }); 
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
  
      await axios.post(`http://192.168.219.184:8085/api/delete/${userId}`, 
        {
          password,
          confirmPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      Swal.fire({
        text: '회원 탈퇴가 정상적으로 처리되었습니다. 이용해주셔서 감사합니다!',
        icon: 'success',
        width: '300px',
        customClass: {
          popup: 'my-mini-popup',
          icon: 'my-mini-icon'
        }
      });
      
  localStorage.clear();
  navigate("/");
} catch (error) {
  console.error("탈퇴 실패:", error);
  if (error.response?.data) {
    Swal.fire({
      text: '탈퇴 실패',
      icon: 'error',
      width: '300px',
      customClass: {
        popup: 'my-mini-popup',
        icon: 'my-mini-icon'
      }
    });
  } else {
    Swal.fire({
      text: '네트워크 오류 또는 알 수 없는 문제가 발생했습니다. 다시 시도해주세요.',
      icon: 'error',
      width: '300px',
      customClass: {
        popup: 'my-mini-popup',
        icon: 'my-mini-icon'
      }
    });
  }
  }
  }
  console.log(password, confirmPassword)
  const goBack = () => navigate(-1);

  return (
    <div className="delete">
      
      <Back />
      <h4>현재 비밀번호</h4>
      <input
        type="password"
        className="pwcheck"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <h4>비밀번호 확인</h4>
      <input
        type="password"
        className="pwcheck"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <div style={{ textAlign: "center", marginTop:"40px" }}>
      <Confirm onClick={handleDeleteAccount} />
      </div>
    </div>
  );
};

export default PasswordConfirmPage;
