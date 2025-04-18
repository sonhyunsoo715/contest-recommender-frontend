import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import "./Back.css";

const Back = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.pathname.startsWith("/profile")) {
      navigate("/Fourth");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="common-header">
      <button className="back-btn" onClick={handleBack}>
        <ArrowBack />
      </button>
    </div>
  );
};

export default Back;
