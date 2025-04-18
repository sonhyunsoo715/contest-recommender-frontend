import React from "react";
import "./Confirm.css"; // btn2 스타일 정의한 곳

const Confirm= ({ onClick, children = "확인" }) => {
  return (
    <button className="btn2" onClick={onClick}>
      {children}
    </button>
  );
};

export default Confirm;
