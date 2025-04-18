import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { Home, Article, ChatBubbleOutline, Person } from "@mui/icons-material";

const BottomNav = () => {
  const [value, setValue] = useState(0);
  const navigate = useNavigate(); // 페이지 이동 함수

  const handleChange = (event, newValue) => {
    setValue(newValue);

    // 페이지 이동
    const routes = ["/first", "/second", "/third", "/fourth"];
    navigate(routes[newValue]);  
  };

  return (
    <Paper 
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0, boxShadow: 3 }} 
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange} showLabels>
        <BottomNavigationAction label="홈" icon={<Home />} />
        <BottomNavigationAction label="공모전" icon={<Article />} />
        <BottomNavigationAction label="채팅" icon={<ChatBubbleOutline />} />
        <BottomNavigationAction label="프로필" icon={<Person />} />
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
