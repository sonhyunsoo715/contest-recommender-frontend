import React, { useState,useEffect } from "react";
import { Box, TextField, Button, Typography, Paper, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Swal from "sweetalert2";


const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    userId: "",
    userPassword: "",
    userPasswordCheck: "",
    userName: "",
    userEmail: "",
    userBirthdate: "",
  });



  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 비밀번호 확인
    if (form.userPassword !== form.userPasswordCheck) {
      Swal.fire({
        icon: 'error',
        title: '비밀번호가 일치하지 않습니다.',
        width: '400px'
      });
      return;
    }

    const payload = {
      userId: form.userId,
      userPassword: form.userPassword,
      userPasswordCheck: form.userPasswordCheck,
      userName: form.userName,
      userEmail: form.userEmail,
      userBirthdate: form.userBirthdate,
    };

    try {
      // 전체 데이터 저장 (기존대로)
      localStorage.setItem("signupData", JSON.stringify(payload));
    
      // ✅ userId 따로 저장
      localStorage.setItem("userId", form.userId);
    
      Swal.fire({
        icon: 'success',
        title: '회원가입 완료',
        width: '400px'
      });
      navigate("/ProfileCheck");
    } catch (err) {
      localStorage.setItem("signupData", JSON.stringify(payload));
      localStorage.setItem("userId", form.userId); // 실패해도 저장
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: '회원가입 실패',
        width: '400px'
      });
      navigate("/ProfileCheck");
    }
  };
  
  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, mt: 8, borderRadius: 3 }}>
        <Typography variant="h5" align="center" fontWeight="bold" color="primary" gutterBottom>
          회원가입
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            label="아이디"
            name="userId"
            value={form.userId}
            onChange={handleChange}
            fullWidth
            margin="dense"
            size="small"
          />
          <TextField
  label="비밀번호"
  type={showPassword ? "text" : "password"}
  name="userPassword"
  value={form.userPassword}
  onChange={handleChange}
  fullWidth
  margin="dense"
  size="small"
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
          {showPassword ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>

<TextField
  label="비밀번호 확인"
  type={showPasswordCheck ? "text" : "password"}
  name="userPasswordCheck"
  value={form.userPasswordCheck}
  onChange={handleChange}
  fullWidth
  margin="dense"
  size="small"
  InputProps={{
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPasswordCheck(!showPasswordCheck)} edge="end">
          {showPasswordCheck ? <Visibility /> : <VisibilityOff />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/>
          <TextField
            label="이름"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            fullWidth
            margin="dense"
            size="small"
          />
          <TextField
            label="이메일"
            name="userEmail"
            type="email"
            value={form.userEmail}
            onChange={handleChange}
            fullWidth
            margin="dense"
            size="small"
          />
          <TextField
            label="생년월일"
            name="userBirthdate"
            type="date"
            value={form.userBirthdate}
            onChange={handleChange}
            fullWidth
            margin="dense"
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <Button
            type="submit"
            fullWidth
            sx={{
              mt: 3,
              background: "linear-gradient(to right, #3ab5b0 0%, #3d99be 31%, #56317a 100%)",
              color: "white",
              fontWeight: "bold",
              borderRadius: "8px",
              textShadow: "0 0 2px rgba(0,0,0,0.15)",
              "&:hover": {
                opacity: 0.95,
                transform: "scale(1.03)",
              },
            }}
          >
            가입하기
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignupPage;
