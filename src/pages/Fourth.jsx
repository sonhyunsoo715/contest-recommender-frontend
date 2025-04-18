import React, { useState, useEffect } from "react";
import {
  Box, Avatar, Typography, Button, Chip, IconButton,
  Card, Dialog, DialogContent, DialogTitle, TextField,
  List, ListItem, ListItemAvatar, ListItemText
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import '../component/style/Fourth.css';
import MoreVertIcon from "@mui/icons-material/MoreVert"; // 세로 점 세 개
import Menu from "@mui/material/Menu"; // 메뉴 UI
import MenuItem from "@mui/material/MenuItem"; // 메뉴 항목
import Swal from "sweetalert2";

const Fourth = () => {
  const [openFollowerDialog, setOpenFollowerDialog] = useState(false);
  const [openFollowingDialog, setOpenFollowingDialog] = useState(false);
  const [followerList, setFollowerList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentsData, setCommentsData] = useState({});
  const [newComments, setNewComments] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [open, setOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedPostIdx, setSelectedPostIdx] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // 모달 안 메뉴
  const openMenu = Boolean(anchorEl);
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget); // 클릭한 위치로 메뉴 열기
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null); // 메뉴 닫기
  };
  const foundPost = posts.find(p => p.commIdx === selectedPostIdx);

  const [userData, setUserData] = useState({
    userNick: '',
    profileImg: '',
    userSkill: [],
    userRegion: '',
    userTarget: '',
    userId: '',
    followers: 0,
    following: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    
    const token = localStorage.getItem("token");
    if (token) {
      const fetchUserProfile = async () => {
        try {
          const response = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const data = {
            ...response.data,
            profileImg: response.data.profileImg
              ? `http://192.168.219.184:8085/profile_images/${response.data.profileImg}`
              : "/default-avatar.png"
          };

          setUserData(data);
          
          fetchFollowerCount(data.userId);
          fetchFollowingCount(data.userId);
        } catch (error) {
          console.error("❌ Error fetching user profile", error);
        }
      };
      fetchUserProfile();
      
    }
  }, []);

  
  useEffect(() => {
    const savedLikes = localStorage.getItem("likedPosts");
    if (savedLikes) {
      const parsed = JSON.parse(savedLikes);
      setLikedPosts(parsed);
    }
  }, []);
  
  // 그 후에야 posts fetch 가능하게 userData 기반으로 호출
  useEffect(() => {
    if (userData.userId && Object.keys(likedPosts).length > 0) {
      fetchPosts();
    }
  }, [userData.userId, likedPosts]);
  

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPosts") || "{}");
  
    setPosts((prevPosts) =>
      prevPosts.map((post) => ({
        ...post,
        liked: savedLikes[post.commIdx] ?? post.liked ?? false,
      }))
    );
  }, [likedPosts]);

  useEffect(() => {
    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://192.168.219.184:8085/api/community/my?userId=${userData.userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      // 상태 반영
      setPosts(res.data);
  
      // ✅ liked 상태도 세팅
      const initialLikes = {};
      res.data.forEach(post => {
        initialLikes[post.commIdx] = post.liked ?? false;
      });
      setLikedPosts(initialLikes);
    };
  
    if (userData.userId) fetchPosts();
  }, [userData.userId]);

  const fetchFollowerCount = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://192.168.219.184:8085/api/follow/followers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(prev => ({ ...prev, followers: res.data.length }));
    } catch (err) {
      console.error("팔로워 수 불러오기 실패", err);
    }
  };

  const fetchFollowingCount = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://192.168.219.184:8085/api/follow/followings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(prev => ({ ...prev, following: res.data.length }));
    } catch (err) {
      console.error("팔로잉 수 불러오기 실패", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
  
      // 먼저 내 userId 확인
      const meRes = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myId = meRes.data.userId;
  
      // 내 게시물 가져오기
      const res = await axios.get(`http://192.168.219.184:8085/api/community/my?userId=${myId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const postsWithUserImages = await Promise.all(
        res.data.map(async (post) => {
          const userRes = await axios.get(
            `http://192.168.219.184:8085/api/user/${post.userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return {
            ...post,
            userProfileImg: userRes.data.profileImg
              ? `http://192.168.219.184:8085/profile_images/${userRes.data.profileImg}`
              : "/default-avatar.png",
            liked: post.liked ?? false // ✅ 여기에 liked도 포함시킴
          };
        })
      );
      setPosts(postsWithUserImages);
      
      // likedPosts 초기화도 여기에 맞춰서
      const initialLikes = {};
      for (const post of postsWithUserImages) {
        initialLikes[post.commIdx] = post.liked ?? false;
      }
      setLikedPosts(initialLikes);
      
    } catch (err) {
      console.error("❌ 게시물 로딩 실패", err);
    }
  };
  

  useEffect(() => {
    if (userData.userId) fetchPosts();
  }, [userData.userId]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDeletePost = async (commIdx) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://192.168.219.184:8085/api/community/${commIdx}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Swal.fire({
            icon: 'success',
            title: '게시글 삭제 완료',
            width:'400px'
          });
      fetchPosts();
    } catch (err) {
      Swal.fire({
              icon: 'error',
              title: '삭제 실패',
              width:'400px'
            });
    }
  };

  const handleCommentChange = (id, value) => {
    setNewComments(prev => ({ ...prev, [id]: value }));
  };

  const handleCommentSubmit = async (id) => {
    const token = localStorage.getItem("token");
    const content = newComments[id];
    if (!content) return;
  
    try {
      // 댓글 등록
      await axios.post(`http://192.168.219.184:8085/api/comment/${id}/comments`, {
        cmtContent: content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // 댓글 목록 다시 가져오기
      const commentRes = await axios.get(`http://192.168.219.184:8085/api/comment/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      // 작성자 정보 병합
      const commentsWithUserData = await Promise.all(
        commentRes.data.map(async (comment) => {
          const userRes = await axios.get(
            `http://192.168.219.184:8085/api/user/${comment.userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
  
          return {
            ...comment,
            userProfileImg: userRes.data.profileImg
              ? `http://192.168.219.184:8085/profile_images/${userRes.data.profileImg}`
              : "/default-avatar.png",
            userNick: userRes.data.userNick || "닉네임 없음"
          };
        })
      );
  
      // 상태에 저장
      const initialLikes = {};
      initialLikes[posts.commIdx] = posts.liked ?? false;
      setLikedPosts(initialLikes);
      setCommentsData(prev => ({ ...prev, [id]: commentsWithUserData }));
      setNewComments(prev => ({ ...prev, [id]: "" }));
  
    } catch (err) {
      console.error("❌ 댓글 등록 또는 불러오기 실패", err);
    }
  };
  

  const toggleLike = async (id) => {
    const token = localStorage.getItem("token");
    const isLiked = likedPosts[id] ?? false;
  
    // 1. likedPosts 업데이트
    const updatedLikes = {
      ...likedPosts,
      [id]: !isLiked,
    };
    setLikedPosts(updatedLikes);
    localStorage.setItem("likedPosts", JSON.stringify(updatedLikes));
  
    // 2. posts의 commLikes만 업데이트
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.commIdx === id
          ? {
              ...post,
              commLikes: !isLiked
                ? post.commLikes + 1
                : Math.max(0, post.commLikes - 1),
            }
          : post
      )
    );
  
    // 3. 서버에 반영
    try {
      await axios.post(`http://192.168.219.184:8085/api/community/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("❌ 좋아요 실패", err);
    }
  };
  

  const handleCreatePost = async () => {
    if (!newImage) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("title", newTitle);
    formData.append("content", newCaption);
    formData.append("userId", userData.userId);
    formData.append("file", newImage);

    try {
      await axios.post("http://192.168.219.184:8085/api/community/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setTimeout(() => {
        Swal.fire({
          icon: 'success',
          text: '게시물 등록 완료',
          confirmButtonText: '확인',
          width:'400px'
        });
      }, 1000); // 1초 뒤에 뜸
      setOpen(false);
      setNewCaption("");
      setNewImage(null);
      fetchPosts();
    } catch (err) {
      console.error("❌ 게시물 등록 실패", err);
      console.log("📤 업로드 데이터 확인", {
        title: newTitle,
        content: newCaption,
        userId: userData.userId,
        file: newImage
      });
      Swal.fire({
              icon: 'error',
              title: '등록 실패',
            });
    }
  };


  const handlePostClick = async (post) => {

     
     const latestPost = posts.find((p) => p.commIdx === post.commIdx) || post;
     setSelectedPost(latestPost);

  try {
    const token = localStorage.getItem("token");

    // 댓글 데이터 가져오기
    const commentsRes = await axios.get(`http://192.168.219.184:8085/api/comment/${post.commIdx}/comments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 댓글 작성자의 닉네임과 프로필 이미지 병합
    const commentsWithUserData = await Promise.all(
      commentsRes.data.map(async (comment) => {
        const userRes = await axios.get(
          `http://192.168.219.184:8085/api/user/${comment.userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        return {
          ...comment,
          userProfileImg: userRes.data.profileImg
            ? `http://192.168.219.184:8085/profile_images/${userRes.data.profileImg}`
            : "/default-avatar.png",
          userNick: userRes.data.userNick || "닉네임 없음"
        };
      })
    );

    setCommentsData(prev => ({ ...prev, [post.commIdx]: commentsWithUserData }));

    // 좋아요 상태
    const likedRes = await axios.post(
      `http://192.168.219.184:8085/api/community/${post.commIdx}/like`,
      {}, // 본문이 없을 땐 빈 객체
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    setLikedPosts((prev) => ({ ...prev, [post.commIdx]: likedRes.data }));
  } catch (err) {
    console.error("❌ 모달 데이터 로딩 실패", err);
  }
  
};

// ✅ 팔로워 목록 불러오기 함수
const fetchFollowerList = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://192.168.219.184:8085/api/follow/followers/${userData.userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updated = res.data.map(user => ({
      ...user,
      profileImg: user.profileImg
        ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
        : "/default-avatar.png"
    }));

    setFollowerList(updated);
    setOpenFollowerDialog(true);
  } catch (err) {
    console.error("❌ 팔로워 목록 불러오기 실패", err);
    alert("팔로워 정보를 불러오지 못했습니다.");
  }
};

// ✅ 팔로잉 목록 불러오기 함수
const fetchFollowingList = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(
      `http://192.168.219.184:8085/api/follow/followings/${userData.userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updated = res.data.map(user => ({
      ...user,
      profileImg: user.profileImg
        ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
        : "/default-avatar.png"
    }));

    setFollowingList(updated);
    setOpenFollowingDialog(true);
  } catch (err) {
    console.error("❌ 팔로잉 목록 불러오기 실패", err);
    alert("팔로잉 정보를 불러오지 못했습니다.");
  }
};
const parseFlexibleArray = (data) => {
  if (!data) return [];
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data.split(",").map(s => s.trim());
    }
  }
  return data;
};

//=====================================================================================//

  return (
    <Box className="main-container">
      <Box className="profile-header">
        <IconButton onClick={() => navigate("/profile")}>
          <SettingsIcon />
        </IconButton>
      </Box>

      <Box className="profile-info">
        <Avatar src={userData.profileImg} className="profile-avatar" sx={{border: "1px solid #ccc"}}/>
        <Box>
          <Typography className="nickname">{userData.userNick || "닉네임 없음"}</Typography>
          <Typography fontSize="14px" color="gray" mt={0.5}>
  <span onClick={fetchFollowerList} style={{ cursor: "pointer", fontWeight: "bold" }}>
    팔로워 {userData.followers}
  </span>{" · "}
  <span onClick={fetchFollowingList} style={{ cursor: "pointer", fontWeight: "bold" }}>
    팔로잉 {userData.following}
  </span>
</Typography>

{/* 팔로워 목록 */}
      <Dialog open={openFollowerDialog} onClose={() => setOpenFollowerDialog(false)} fullWidth maxWidth="sm">
  <DialogTitle>팔로워 목록</DialogTitle>
  <DialogContent>
    <List>
      {followerList.map((follower, idx) => (
        <ListItem key={idx}>
          <ListItemAvatar>
            <Avatar
              src={follower.profileImg}
              onClick={() => {
                const myId = localStorage.getItem("userId");
                const targetId = String(follower.userId);

                setOpenFollowerDialog(false);

                if (myId === targetId) {
                  navigate("/Fourth");
                } else {
                  navigate(`/ProfileUser/${targetId}`);
                }
              }}
              style={{ cursor: "pointer" }}
            />
          </ListItemAvatar>
          <ListItemText primary={follower.userNick || "닉네임 없음"} />
        </ListItem>
      ))}
    </List>
  </DialogContent>
</Dialog>


      {/* 팔로잉 목록 */}
      <Dialog open={openFollowingDialog} onClose={() => setOpenFollowingDialog(false)} fullWidth maxWidth="sm">
  <DialogTitle>팔로잉 목록</DialogTitle>
  <DialogContent>
    <List>
      {followingList.map((following, idx) => (
        <ListItem key={idx}>
          <ListItemAvatar>
            <Avatar
              src={following.profileImg}
              onClick={() => {
                const myId = localStorage.getItem("userId");
                const targetId = String(following.userId);

                setOpenFollowingDialog(false);

                if (myId === targetId) {
                  navigate("/Fourth");
                } else {
                  navigate(`/ProfileUser/${targetId}`);
                }
              }}
              style={{ cursor: "pointer" }}
            />
          </ListItemAvatar>
          <ListItemText primary={following.userNick || "닉네임 없음"} />
        </ListItem>
      ))}
    </List>
  </DialogContent>
</Dialog>

        </Box>
      </Box>

      <Box className="profile-bio">
        <Typography variant="body2" className="bio-text">
          {userData.bio || "자기소개 내용이 없습니다."}
        </Typography>
        <Button fullWidth variant="contained" onClick={() => setOpen(true)} className="write-button">+ 글쓰기</Button>
      </Box>





      {/*보유 기술 역량, */}
      <Box className="profile-tags">
      <Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" mt={1}>
  <Typography fontWeight="bold" whiteSpace="nowrap">보유 기술 역량</Typography>
  {(typeof userData.userSkill === "string" ? JSON.parse(userData.userSkill || "[]") : userData.userSkill)
    .map((skill, idx) => (
      <Chip 
        key={idx} 
        label={skill} 
        variant="outlined" 
        sx={{ backgroundColor: "#ffffff" }}
      />
    ))}
</Box>
        {/* 선호 지역 */}
{/* 선호 지역 */}
<Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" mt={1}>
  <Typography fontWeight="bold" whiteSpace="nowrap">선호 지역</Typography>
  {parseFlexibleArray(userData.userRegion).map((region, idx) => (
    <Chip key={idx} label={region} variant="outlined" sx={{ backgroundColor: "#ffffff" }}/>
  ))}
</Box>

{/* 참가 목표 */}
<Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" mt={1}>
  <Typography fontWeight="bold" whiteSpace="nowrap">참가 목표</Typography>
  {parseFlexibleArray(userData.userTarget).map((target, idx) => (
    <Chip key={idx} label={target} variant="outlined" sx={{ backgroundColor: "#ffffff" }}/>
  ))}
</Box>
</Box>



<Box className="profile-tags2">
        <Typography mt={3} mb={1} fontWeight="bold">작성한 게시글</Typography>
        <Box className="feed-grid">
          {posts.map(post => (
            <Card key={post.commIdx} className="feed-card" onClick={() => handlePostClick(post)} sx={{ position: 'relative' }}>
              <img
                src={`http://192.168.219.184:8085/api/community/images/${post.commFile}`}
                alt="게시글"
                className="feed-image"
              />
            </Card>
          ))}
        </Box>
      </Box>

      {/* 게시글 모달 */}
      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="sm" fullWidth>
  
  {/*게시글 삭제*/}
      <Box display="flex" justifyContent="flex-end" p={0.5}>
  <IconButton onClick={handleMenuClick}>
    <MoreVertIcon />
  </IconButton>
</Box>
<Menu
  anchorEl={anchorEl}
  open={openMenu}
  onClose={handleMenuClose}
>
  <MenuItem
    onClick={async () => {
      handleMenuClose(); // 메뉴 닫고
      setSelectedPost(null); // 👉 모달 먼저 닫기 (MUI Dialog)
      const result = await Swal.fire({
        icon: 'warning',
        title: '정말 삭제하시겠습니까?',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: '삭제하기',
        cancelButtonText: '취소',
        width:'400px',
        customClass: {
          popup: 'custom-z-index'
        }
      });
    
      if (result.isConfirmed) {
        handleDeletePost(selectedPost.commIdx); // 삭제 실행
        setSelectedPost(null); // 모달 닫기
        Swal.fire({
          icon: 'success',
          text: '삭제되었습니다!',
          width:'400px',
          showConfirmButton: false,
          timer: 1000,
        });
      }
    }}
  >
    삭제하기
  </MenuItem>
</Menu>

  <DialogContent sx={{ p: 0 }}>
    {selectedPost && (
      <Box>
        <img
          src={`http://192.168.219.184:8085/api/community/images/${selectedPost.commFile}`}
          alt="확대 이미지"
          style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover" }}
        />
        <Box p={2}>
          <Typography>{selectedPost.commContent}</Typography>

          {/* 좋아요 */}
          <Box display="flex" alignItems="center" my={1}>
          <IconButton onClick={() => toggleLike(selectedPost.commIdx)}>
  {selectedPost.liked ? (
    <Favorite color="error" />
  ) : (
    <FavoriteBorder />
  )}
</IconButton>
<Typography>{selectedPost.commLikes}</Typography>

</Box>

          {/* 댓글 목록 + 입력 */}
          <Box sx={{ px: 2, pb: 2 }}>
            {commentsData[selectedPost.commIdx]?.map((comment, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar
                  src={comment.userProfileImg || "/default-avatar.png"}
                  sx={{ width: 30, height: 30, mr: 1, cursor: "pointer", border: "1px solid #d0d0d0" }}
                  onClick={() => {
                    if (comment.userId === userData.userId) {
                      navigate(0);
                    } else {
                      navigate(`/ProfileUser/${comment.userId}`);
                    }
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography fontWeight="bold" sx={{ mb: 0.5, fontSize: 13 }}>
                    {comment.userNick}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {comment.cmtContent}
                  </Typography>
                </Box>
              </Box>
            ))}

<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
  <TextField
    size="small"
    placeholder="댓글 작성..."
    value={newComments[selectedPost.commIdx] || ''}
    onChange={(e) => handleCommentChange(selectedPost.commIdx, e.target.value)}
    sx={{ flex: 1 }}
  />
  <Button
    size="small"
    variant="contained"
    onClick={() => handleCommentSubmit(selectedPost.commIdx)}
    sx={{ whiteSpace: 'nowrap' }}
  >
    댓글 등록
  </Button>
</Box>

          </Box>
        </Box>
      </Box>
    )}
  </DialogContent>
</Dialog>

<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>게시물 작성</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="글 제목" variant="outlined" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} fullWidth />
          <TextField label="글 내용" multiline rows={4} value={newCaption} onChange={(e) => setNewCaption(e.target.value)} fullWidth />
          <Button variant="outlined" component="label">
            사진 업로드
            <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
          </Button>
          {previewImage && <img src={previewImage} alt="preview" className="preview-image" />}
          <Button variant="contained" onClick={handleCreatePost}>등록</Button>
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default Fourth;
