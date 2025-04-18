import React from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import logo from "../img/logo.png";
import "./style/Header.css";

function Header() {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate("/search");
  };

  return (
    <AppBar position="static" color="transparent" elevation={1}>
      <Toolbar className="header-toolbar">
        {/* 로고 */}
        <Box className="logo">
          <img src={logo} alt="로고" />
        </Box>

        {/* 검색 아이콘 - 로그인한 경우만 보여줌 */}
        {localStorage.getItem("token") && (
          <Box className="icon-box">
            <IconButton onClick={handleSearchClick}>
              <SearchIcon sx={{ color: "white" }} />
            </IconButton>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
