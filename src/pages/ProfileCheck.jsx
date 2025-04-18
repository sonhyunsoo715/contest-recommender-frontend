import React, { useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  TextField,
  Chip,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ProfileCheck = () => {
  const navigate = useNavigate();

  const signupData = JSON.parse(localStorage.getItem("signupData"));
  const [userNick, setNickname] = useState("귀여운 고양이");
  const [userSkill, setTechList] = useState([]);
  const [userRegion, setRegion] = useState("서울");
  const [userTarget, setUsertarget] = useState("경험 쌓기");

  const [profileImg, setProfileImg] = useState(null); // 실제 파일
  const [profileImgPreview, setProfileImgPreview] = useState(null); // 미리보기용

  const [techModalOpen, setTechModalOpen] = useState(false);
  const [tempSelectedTech, setTempSelectedTech] = useState([...userSkill]);

  const handleDeleteTech = (tech) => {
    setTechList(userSkill.filter((item) => item !== tech));
  };


  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImg(file); // 실제 전송할 파일 저장
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImgPreview(reader.result); // 이미지 미리보기
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
  const formData = new FormData();

  const userDto = {
    ...signupData,
    userNick,
    userSkill: JSON.stringify(userSkill),
    userRegion,
    userTarget,
    profileInfo: null
  };

  formData.append("user", new Blob([JSON.stringify(userDto)], { type: "application/json" }));
  if (profileImg) {
    formData.append("profileImg", profileImg);
  }

  try {
    const response = await axios.post("http://192.168.219.184:8085/api/signup", formData, {
      headers: { "Content-Type": "multipart/form-data" }
      
    });
    if (response.data && response.data.userId) {

    }
    Swal.fire({
      icon: 'success',
      title: '프로필 생성 완료!',
      width: '400px',
      text: '홈으로 이동합니다.',
    });
    navigate("/");
  } catch (error) {
    if (error.response?.status === 409) {
      Swal.fire({
        icon: 'error',
        title: '에러 발생',
        text: '이미 사용 중인 닉네임입니다.',
      });
    } else if (error.response?.status === 400) {
      Swal.fire({
        icon: 'error',
        title: '에러 발생',
        text: '입력 값을 다시 확인해주세요.',
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: '에러 발생',
        text: '회원가입 중 오류가 발생했습니다.',
      });
      console.error(error);
    }
  };
};


  const techOptions = [
    "서버/백엔드", "프론트엔드", "모바일 게임", "머신러닝", "안드로이드 앱", "인터넷 보안",
    "아이폰 앱", "인공지능(AI)", "게임 클라이언트", "웹 풀스택", "DBA", "데이터 엔지니어",
    "게임 서버", "시스템/네트워크", "데브옵스", "QA", "개발PM", "로보틱스 미들웨어",
    "그래픽스", "임베디드 소프트웨어", "블록체인", "ERD", "응용 프로그램", "사물인터넷(IoT)",
    "웹 퍼블리싱", "크로스 플랫폼", "VR/AR/3D", "데이터 분석", "없음"
  ];

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", py: 4}}>
      <Typography variant="h5" align="center" gutterBottom fontWeight="bold" mb={5} >
        프로필 생성
      </Typography>

      <Box textAlign="center" mb={2}>
  <input
    type="file"
    accept="image/*"
    id="avatar-upload"
    style={{ display: "none" }}
    onChange={handleImageUpload}
  />

  <Avatar
    src={profileImgPreview}
    sx={{ width: 100, height: 100, mx: "auto", mb: 1, cursor: "pointer" }}
    onClick={() => document.getElementById("avatar-upload").click()} // 클릭 동작을 직접 Avatar에 연결
  />프로필 사진
        <TextField
          label="닉네임"
          variant="outlined"
          value={userNick}
          onChange={(e) => setNickname(e.target.value)}
          inputProps={{ style: { textAlign: "center", fontWeight: "bold" } }}
          sx={{ borderRadius: 1, mt: 3 }}
          fullWidth
        />
      </Box>
      <Divider sx={{ my: 2 , mt:5}} />
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={5}>
        <Typography fontWeight="bold">보유 기술 역량</Typography>
        <Button
          onClick={() => {
            setTempSelectedTech([]); // 초기화
            setTechModalOpen(true);
          }}
          variant="outlined"
          size="small"
        >
          추가 +
        </Button>
      </Box>

      <Box display="flex" gap={1} mt={1} flexWrap="wrap">
        {userSkill.map((tech, idx) => (
          <Chip key={idx} label={tech} onDelete={() => handleDeleteTech(tech)} color="primary" />
        ))}
      </Box>

      <FormControl fullWidth sx={{ mt: 3 }}>
        <InputLabel>선호지역</InputLabel>
        <Select value={userRegion} onChange={(e) => setRegion(e.target.value)} label="선호지역">
          {["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "온라인"].map((loc) => (
            <MenuItem key={loc} value={loc}>
              {loc}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel>목표</InputLabel>
        <Select value={userTarget} onChange={(e) => setUsertarget(e.target.value)} label="목표">
          <MenuItem value="경험 쌓기">경험 쌓기</MenuItem>
          <MenuItem value="포트폴리오 만들기">포트폴리오 만들기</MenuItem>
          <MenuItem value="수상">수상</MenuItem>
        </Select>
      </FormControl>

      <Button variant="contained" fullWidth sx={{ mt: 4, bgcolor: "#2962ff" }} onClick={handleSubmit}>
        생성하기
      </Button>

      {/* 기술 선택 모달 */}
      <Dialog 
        open={techModalOpen}
        onClose={() => setTechModalOpen(false)}
        fullWidth
        autoFocus={false}
        closeAfterTransition={false}
      >
        <DialogTitle sx={{ textAlign: "center" }}>보유 기술 역량</DialogTitle>
        <DialogContent>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {techOptions.map((tech) => {
              const selected = tempSelectedTech.includes(tech);
              const disabled = !selected && tempSelectedTech.length >= 3;
              return (
                <Chip
                  key={tech}
                  label={tech}
                  clickable={!disabled}
                  onClick={() => {
                    if (!selected && tempSelectedTech.length >= 3) return;
                    setTempSelectedTech((prev) =>
                      selected ? prev.filter((t) => t !== tech) : [...prev, tech]
                    );
                  }}
                  color={selected ? "primary" : "default"}
                  disabled={disabled}
                />
              );
            })}
          </Box>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={() => {
              setTechList(tempSelectedTech);
              setTechModalOpen(false);
            }}
          >
            추가
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfileCheck;