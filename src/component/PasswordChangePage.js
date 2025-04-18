import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField, IconButton, InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import axios from "axios";
import "../component/style/PasswordChangePage.css";
import Back from "../component/button/Back";
import Confirm from "./button/Confirm";
import Swal from "sweetalert2";

const PasswordChangePage = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordCheck, setNewPasswordCheck] = useState("");

  const handleTogglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async () => {
    if (newPassword !== newPasswordCheck) {
      Swal.fire({
                  icon: 'error',
                  title: '새 비밀번호와 비밀번호 확인이 일치하지 않습니다.',
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
  
      const response = await axios.post(
        "http://192.168.219.184:8085/api/user/change-password",
        {
          currentPassword,
          newPassword,
          newPasswordCheck
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      Swal.fire({
        icon: 'success',
        title: `비밀번호가 성공적으로 <br>변경되었습니다.`, //response.data
        width: '400px',
        customClass: {
          popup: 'my-mini-popup',
          icon: 'my-mini-icon'
        }
      });
      navigate("/profile");
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      if (error.response && error.response.data) {
        Swal.fire({
          icon: 'error',
          title: `현재 비밀번호를 다시 <br>확인하세요.`,
          width: '400px',
          customClass: {
           popup: 'my-mini-popup',
            icon: 'my-mini-icon'
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: `현재 비밀번호를 다시 <br>확인하세요.`,
          width: '400px',
          customClass: {
           popup: 'my-mini-popup',
            icon: 'my-mini-icon'
          }
        });
      }
    }
  };
  

  return (
    <div className="pw-change-container">
      <Back />
      <p className="set4">비밀번호 변경</p>

      <div className="form-section">
        <TextField
          label="현재 비밀번호"
          type={showPassword.current ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input-field-custom1"
          variant="outlined"
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleTogglePassword("current")}>
                  {showPassword.current ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField
          label="새 비밀번호"
          type={showPassword.new ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input-field-custom"
          variant="outlined"
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleTogglePassword("new")}>
                  {showPassword.new ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <TextField
          label="비밀번호 확인"
          type={showPassword.confirm ? "text" : "password"}
          value={newPasswordCheck}
          onChange={(e) => setNewPasswordCheck(e.target.value)}
          className="input-field-custom"
          variant="outlined"
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleTogglePassword("confirm")}>
                  {showPassword.confirm ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </div>

      <div style={{ textAlign: "center", marginTop:"40px" }}>
      <Confirm onClick={handleSubmit} />
      </div>
    </div>
  );
};

export default PasswordChangePage;
