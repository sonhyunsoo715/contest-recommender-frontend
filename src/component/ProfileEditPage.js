import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../component/style/ProfileEditPage.css";
import Back from "../component/button/Back";
import Confirm from "./button/Confirm";
import Swal from "sweetalert2";

const ProfileEditPage = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [userNick, setUserNick] = useState("");
  const [profileInfo, setProfileInfo] = useState("");
  const [profileImg, setProfileImg] = useState(null);
  const [profileImgPreview, setProfileImgPreview] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (storedId) {
      setUserId(storedId);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImg(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImgPreview(reader.result);
      };
      reader.readAsDataURL(file); // 단순히 미리보기용으로만 사용됨
    }
  };

  const handleSubmit = async () => {
    const isAllEmpty = !userNick.trim() && !profileInfo.trim() && !profileImg;

  if (isAllEmpty) {
    Swal.fire({
            icon: 'error',
            title: '하나 이상의 항목을 수정하세요.',
            width: '400px',
            customClass: {
             popup: 'my-mini-popup',
              icon: 'my-mini-icon'
            }
          }); 
    return;
  }
    const formData = new FormData();

    // 1. 유저 정보 DTO를 JSON으로 생성
    const userDto = {
      userId,
      userNick,
      profileInfo,
    };

    // 2. JSON을 Blob으로 감싸서 append
    formData.append(
      "user",
      new Blob([JSON.stringify(userDto)], { type: "application/json" })
    );

    // 3. 이미지 파일도 같이 append
    if (profileImg) {
      formData.append("profileImg", profileImg);
    }
    
    try {
      const token = localStorage.getItem("token");
    
      const response = await axios.post(
        "http://192.168.219.184:8085/api/user/update",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    
      Swal.fire({
            icon: 'success',
            title: '프로필 수정 완료',
            width: '400px',
            customClass: {
              popup: 'my-mini-popup',
              icon: 'my-mini-icon'
            }
          });
      navigate("/profile");
    } catch (error) {
      if (error.response) {
        console.error("❌ 응답 에러 상태:", error.response.status);
        console.error("❌ 응답 에러 내용:", error.response.data);
      } else if (error.request) {
        console.error("❌ 요청은 갔지만 응답 없음:", error.request);
      } else {
        console.error("❌ 요청 설정 중 에러:", error.message);
      }
      Swal.fire({
              icon: 'error',
              title: '프로필 수정 실패',
              width: '400px',
            customClass: {
              popup: 'my-mini-popup',
              icon: 'my-mini-icon'
            }
            });
    }}

  return (
    <div className="profile-edit-container">
      <Back />
      <p className="set1">프로필 편집</p>

      <div className="profile-image-section">
        <label htmlFor="profile-upload" className="profile-img-label">
          {profileImgPreview ? (
            <img
              src={profileImgPreview}
              alt="미리보기"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                objectFit: "cover",
                display: "block",
                margin: "0 auto",
              }}
            />
          ) : (
            <div
              className="profile-img-placeholder"
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "#ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto",
                fontSize: "14px",
                color: "#555",
              }}
            >
              사진 선택
            </div>
          )}
        </label>
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
        <p className="edit-text">프로필 사진 편집</p>
      </div>

      <div className="form-group">
        <label htmlFor="userNick" style={{ fontWeight:"bold" }}>닉네임 변경</label>
        <input
          type="text"
          className="input-field"
          id="userNick"
          placeholder="닉네임을 입력하세요"
          value={userNick}
          onChange={(e) => setUserNick(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="profileInfo" style={{ fontWeight:"bold" }}>소개 변경</label>
        <input
          type="text"
          className="input-field"
          id="profileInfo"
          placeholder="자기소개를 입력하세요"
          value={profileInfo}
          onChange={(e) => setProfileInfo(e.target.value)}
        />
      </div>
      <div style={{ textAlign: "center" }}>
      <Confirm onClick={handleSubmit} />
      </div>
    </div>
  );
};

export default ProfileEditPage;
