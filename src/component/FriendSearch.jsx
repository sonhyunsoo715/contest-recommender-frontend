import React, { useState } from "react";
import '../component/style/FriendSearch.css';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SearchPage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSearch = async () => {
    if (!keyword.trim()) {
      alert("닉네임을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `http://192.168.219.184:8085/api/user/search?keyword=${encodeURIComponent(keyword)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResults(response.data);
    } catch (error) {
      console.error("❌ 유저 검색 실패:", error);
      alert("유저가 존재하지 않습니다.");
    }
    setLoading(false);
  };

  const goToProfile = (userId) => {
    navigate(`/ProfileUser/${userId}`);
  };

  return (
<Box className="search-container">
  <Typography className="search-header" sx={{ fontSize: "24px", paddingBottom: "10px"}}>
    친구 검색 <span role="img" aria-label="search">🔍</span>
  </Typography>

  <Box className="search-bar" sx={{ paddingLeft:"20px" }}>
    <TextField
      label="닉네임으로 검색"
      variant="outlined"
      value={keyword}
      onChange={(e) => setKeyword(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      size="small"
      sx={{ width: '300px' }}
    />
    <Button variant="contained" onClick={handleSearch}>
      검색
    </Button>
  </Box>

  <Box className="search-results">
    {loading ? (
      <CircularProgress />
    ) : results.length === 0 ? (
      <Typography variant="body2">검색 결과가 없습니다.</Typography>
    ) : (
      results.map((user) => (
        <Box
          key={user.userId}
          className="search-result-card"
          onClick={() => goToProfile(user.userId)}
        >
          <Avatar
            src={
              user.profileImg
                ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
                : "/default-avatar.png"
            }
            className="search-result-avatar"
          />
          <Typography className="search-nick">
            {user.userNick}
          </Typography>
        </Box>
      ))
    )}
  </Box>
</Box>
  );
}