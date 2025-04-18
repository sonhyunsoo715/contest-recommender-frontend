import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  Paper,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
  const [userId, setId] = useState('');
  const [userPassword, setPw] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://192.168.219.184:8085/api/login', {
        userId: userId,
        userPassword: userPassword,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem("userId", response.data.userId);

      const userProfileResponse = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const userNick = userProfileResponse.data.userNick;  // userNick을 받아옴
      localStorage.setItem('userNick', userNick);  // 로컬스토리지에 userNick 저장
      console.log(userNick);
      navigate('/First');
    } catch (err) {
      alert('로그인 실패!');
    }
  };

  return (
    <>


      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ padding: 4, mt: 10, borderRadius: 3 }}>

          <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
            로그인
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
            <TextField
              label="아이디"
              variant="outlined"
              fullWidth
              size="small"
              margin="dense"
              value={userId}
              onChange={(e) => setId(e.target.value)}
            />
            <TextField
              label="비밀번호"
              type="password"
              variant="outlined"
              fullWidth
              size="small"
              margin="dense"
              value={userPassword}
              onChange={(e) => setPw(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                background: 'linear-gradient(to right, #3ab5b0 0%, #3d99be 31%, #56317a 100%)',
              }}
            >
              로그인
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography align="center" variant="body2">
            계정이 없으신가요?{' '}
            <Link to="/SignupPage" style={{ color: '#197', textDecoration: 'none' }}>
              회원가입
            </Link>
          </Typography>
        </Paper>
      </Container>
    </>
  );
};

export default LoginPage;
