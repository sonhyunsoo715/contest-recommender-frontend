import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../component/style/ProfileUser.css";
import axios from "axios";
import { FiSend } from "react-icons/fi";
import {
  Box,
  Avatar,
  Typography,
  Button,
  Chip,
  IconButton,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,TextField
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Swal from "sweetalert2";

const ProfileUser = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [openFollowerDialog, setOpenFollowerDialog] = useState(false);
  const [openFollowingDialog, setOpenFollowingDialog] = useState(false);
  const [followerList, setFollowerList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [newComments, setNewComments] = useState({});
  const [isBlocked, setIsBlocked] = useState(false);
  const [myUserId, setMyUserId] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [showCaption, setShowCaption] = useState({});
  const [userData, setUserData] = useState({
    userNick: '',
    profileImg: '',
    userSkill: [],
    profileInfo: '',
    followers: 0,
    following: 0
  });

  const fetchProfileUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `http://192.168.219.184:8085/api/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const baseData = {
        ...res.data,
        profileImg: res.data.profileImg
          ? `http://192.168.219.184:8085/profile_images/${res.data.profileImg}`
          : "/default-avatar.png"
      };

      // 초기 followers/following 수 업데이트
      const [followersRes, followingsRes] = await Promise.all([
        axios.get(`http://192.168.219.184:8085/api/follow/followers/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://192.168.219.184:8085/api/follow/followings/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      setUserData({
        ...baseData,
        followers: followersRes.data.length,
        following: followingsRes.data.length
      });

    } catch (error) {
      console.error("❌ 유저 정보 로딩 실패", error);
    }
  };

  useEffect(() => {
    fetchProfileUser();
  }, [userId]);

  const handlePostClick = async (post) => {
    setSelectedPost(post);
    const token = localStorage.getItem("token");
  
    try {
      // 🔹 댓글 불러오기
      const commentRes = await axios.get(
        `http://192.168.219.184:8085/api/comment/${post.commIdx}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      // 🔹 댓글 작성자 정보 포함하기
      const commentsWithUserData = await Promise.all(
        commentRes.data.map(async (comment) => {
          try {
            const userRes = await axios.get(
              `http://192.168.219.184:8085/api/user/${comment.userId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
  
            return {
              ...comment,
              userNick: userRes.data.userNick || "닉네임 없음",
              userProfileImg: userRes.data.profileImg
                ? `http://192.168.219.184:8085/profile_images/${userRes.data.profileImg}`
                : "/default-avatar.png",
            };
          } catch {
            return {
              ...comment,
              userNick: "닉네임 없음",
              userProfileImg: "/default-avatar.png",
            };
          }
        })
      );
  
      setCommentsData((prev) => ({
        ...prev,
        [post.commIdx]: commentsWithUserData,
      }));
    } catch (err) {
      console.warn("❌ 댓글 불러오기 실패:", err.response?.data || err.message);
      setCommentsData((prev) => ({
        ...prev,
        [post.commIdx]: [],
      }));
    }
  
    try {
      // 🔹 좋아요 여부 확인 (백엔드에 /liked가 없는 경우 생략 가능)
      const likedRes = await axios.post(
        `http://192.168.219.184:8085/api/community/${post.commIdx}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      setLikedPosts((prev) => ({
        ...prev,
        [post.commIdx]: likedRes.data,
      }));
    } catch (err) {
      console.warn("❌ 좋아요 여부 확인 실패:", err.response?.data || err.message);
      setLikedPosts((prev) => ({
        ...prev,
        [post.commIdx]: false,
      }));
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
      setCommentsData(prev => ({ ...prev, [id]: commentsWithUserData }));
      setNewComments(prev => ({ ...prev, [id]: "" }));
  
    } catch (err) {
      console.error("❌ 댓글 등록 또는 불러오기 실패", err);
    }
  };
  
  const toggleLike = async (commIdx) => {
    const token = localStorage.getItem("token");
  
    setPosts(prev =>
      prev.map(post =>
        post.commIdx === commIdx
          ? {
              ...post,
              liked: !post.liked,
              commLikes: post.liked ? post.commLikes - 1 : post.commLikes + 1
            }
          : post
      )
    );
  
    if (selectedPost?.commIdx === commIdx) {
      setSelectedPost(prev => ({
        ...prev,
        liked: !prev.liked,
        commLikes: prev.liked ? prev.commLikes - 1 : prev.commLikes + 1
      }));
    }
  
    try {
      await axios.post(
        `http://192.168.219.184:8085/api/community/${commIdx}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("❌ 좋아요 실패", err);
      // 실패 시 롤백
      setPosts(prev =>
        prev.map(post =>
          post.commIdx === commIdx
            ? {
                ...post,
                liked: post.liked,
                commLikes: post.commLikes,
              }
            : post
        )
      );
    }
  };
  
  
  
  
  
  
  useEffect(() => {
      const fetchPosts = async () => {
        try {
          const token = localStorage.getItem("token");
    
          const res = await axios.get(
            `http://192.168.219.184:8085/api/community/user/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
    
          const postsWithLiked = res.data.map(post => ({
            ...post,
            liked: false, // 처음엔 false로
          }));
    
          setPosts(postsWithLiked);
        } catch (err) {
          console.error("❌ 게시글 로딩 실패", err);
        }
      };
    
      if (userId) fetchPosts();
    }, [userId]);
    
  
  

  const toggleCaption = (id) => {
    setShowCaption(prev => ({ ...prev, [id]: !prev[id] }));
  };

  


  //-------------------------------------------채팅-------------------------------------------//
  const handleMessageClick = async () => {
    const token = localStorage.getItem("token");
    const myId = localStorage.getItem("userId");
  
    if (!token || !myId || !userId) return;
  
    try {
      // 1️⃣ 참여자 ID 정렬된 문자열로 구성
      const userIds = [myId, userId].map(String).sort().join(",");
  
      // 2️⃣ 방 존재 여부 확인 (✅ 수정된 부분)
      const checkRes = await axios.get(
        `http://192.168.219.184:8085/api/croom/exists?userIds=${userIds}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      const checkData = checkRes.data;
  
      if (checkData.exists) {
        navigate(`/chatroom/${checkData.roomId}?user=익명`);
      } else {
        // 3️⃣ 방 생성
        const createRes = await axios.post(
          "http://192.168.219.184:8085/api/croom/create",
          { creatorUserId: myId }
        );
        const newRoomId = createRes.data.id;
  
        // 4️⃣ 초대
        await axios.post(
          "http://192.168.219.184:8085/api/croom/invite",
          {
            chatroomId: newRoomId,
            userIds: [userId]
          }
        );
  
        // 5️⃣ 이동
        localStorage.setItem("titleUpdated", "true");
        navigate(`/chatroom/${newRoomId}?user=익명`);
      }
    } catch (err) {
      console.error("❌ 채팅방 열기 실패", err);
      alert("채팅방 열기 중 오류가 발생했어요.");
    }
  };
  
  // ========================================================================================= //

  // ✅ 팔로우 언팔로우
  const toggleFollow = async () => {
    const token = localStorage.getItem("token");
    try {
      const meRes = await axios.post(
        "http://192.168.219.184:8085/api/user/me",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const myUserId = meRes.data.userId;

      const dto = {
        follower: myUserId,
        followee: userId
      };

      if (isFollowing) {
        await axios.post("http://192.168.219.184:8085/api/follow/delete", dto, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
                    icon: 'success',
                    text: '언팔로우 했습니다.',
                    width: '400px',
                    customClass: {
                     popup: 'my-mini-popup',
                      icon: 'my-mini-icon'
                    }
                  }); 
      } else {
        await axios.post("http://192.168.219.184:8085/api/follow/add", dto, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
                    icon: 'success',
                    text: '팔로우 했습니다.',
                    width: '400px',
                    customClass: {
                     popup: 'my-mini-popup',
                      icon: 'my-mini-icon'
                    }
                  }); 
      }

      setIsFollowing(!isFollowing);
      fetchProfileUser(); // 실시간 반영
    } catch (err) {
      console.error("팔로우 토글 실패", err);
    }
  };

  // ✅ 팔로우 여부 확인
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const meRes = await axios.post(
          "http://192.168.219.184:8085/api/user/me",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const myUserId = meRes.data.userId;

        const res = await axios.get(`http://192.168.219.184:8085/api/follow/check`, {
          params: {
            follower: myUserId,
            followee: userId
          }
        });
        setIsFollowing(res.data);
      } catch (err) {
        console.error("팔로우 여부 확인 실패", err);
      }
    };
    if (userId) checkFollowStatus();
  }, [userId]);

  // ✅ 팔로워 목록 조회 + count 실시간 반영
  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://192.168.219.184:8085/api/follow/followers/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const updated = response.data.map(user => ({
        ...user,
        profileImg: user.profileImg
          ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
          : "/default-avatar.png"
      }));
      setFollowerList(updated);
      setUserData(prev => ({
        ...prev,
        followers: updated.length
      }));
      setOpenFollowerDialog(true);
    } catch (err) {
      console.error("팔로워 목록 불러오기 실패", err);
      alert("팔로워 정보를 불러오지 못했습니다.");
    }
  };

  // ✅ 팔로잉 목록 조회 + count 실시간 반영
  const fetchFollowings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://192.168.219.184:8085/api/follow/followings/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const updated = response.data.map(user => ({
        ...user,
        profileImg: user.profileImg
          ? `http://192.168.219.184:8085/profile_images/${user.profileImg}`
          : "/default-avatar.png"
      }));
      setFollowingList(updated);
      setUserData(prev => ({
        ...prev,
        following: updated.length
      }));
      setOpenFollowingDialog(true);
    } catch (err) {
      console.error("팔로잉 목록 불러오기 실패", err);
      alert("팔로잉 정보를 불러오지 못했습니다.");
    }
  };

  // ========================================================================================= //

  // ✅ 차단하기
  const blockUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const meRes = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myId = meRes.data.userId;

      await axios.post("http://192.168.219.184:8085/api/block", {
        blockingUserId: myId,
        blockedUserId: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire({
        icon: 'success',
        text: '차단 했습니다.',
        width: '400px',
        customClass: {
         popup: 'my-mini-popup',
          icon: 'my-mini-icon'
        }
      }); 
      setIsBlocked(true);
    } catch (err) {
      console.error("❌ 차단 실패", err);
      alert("차단 중 오류 발생");
    }
  };

  // ✅ 차단 해제
  const unblockUser = async () => {
    const token = localStorage.getItem("token");
    try {
      const meRes = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myId = meRes.data.userId;

      await axios.delete("http://192.168.219.184:8085/api/block/unblock", {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          blockingUserId: myId,
          blockedUserId: userId
        }
      });

      Swal.fire({
        icon: 'success',
        text: '차단 해제했습니다.',
        width: '400px',
        customClass: {
         popup: 'my-mini-popup',
          icon: 'my-mini-icon'
        }
      });
      setIsBlocked(false);
    } catch (err) {
      console.error("❌ 차단 해제 실패", err);
    }
  };

  // ✅ 차단 여부 확인
  const checkBlocked = async () => {
    const token = localStorage.getItem("token");
    try {
      const meRes = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myId = meRes.data.userId;

      const res = await axios.get(`http://192.168.219.184:8085/api/block/list/${myId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const blocked = res.data.some(item => item.blockedUserId === userId);
      setIsBlocked(blocked);
    } catch (err) {
      console.error("❌ 차단 여부 확인 실패", err);
      
    }
  };

  useEffect(() => {
    if (userId) checkBlocked();
  }, [userId]);
  useEffect(() => {
    const fetchMyId = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
  
      try {
        const meRes = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyUserId(meRes.data.userId);
      } catch (err) {
        console.error("내 정보 가져오기 실패", err);
      }
    };
  
    fetchMyId();
  }, []);
  const parseFlexibleArray = (data) => {
    if (!data) return [];
    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch (e) {
        return data.split(",").map((s) => s.trim());
      }
    }
    return Array.isArray(data) ? data : [];
  };
  return (
    <Box className="main-container">
      <Box className="profile-header">
      <IconButton onClick={handleMessageClick}>
  <FiSend size={24} />
</IconButton>
      </Box>

      <Box className="profile-info-fixed">
        <Box className="profile-info">
          <Avatar src={userData.profileImg} className="profile-avatar" sx={{border: "1px solid #d0d0d0"}}/>
          <Box>
            <Typography className="nickname">{userData.userNick || "닉네임 없음"}</Typography>
            <Typography fontSize="14px" color="gray" mt={0.5}>
              <span onClick={fetchFollowers} style={{ cursor: "pointer", fontWeight: "bold" }}>
                팔로워 {userData.followers}
              </span>{" "}
              ·{" "}
              <span onClick={fetchFollowings} style={{ cursor: "pointer", fontWeight: "bold" }}>
                팔로잉 {userData.following}
              </span>
            </Typography>
          </Box>
        </Box>

        <Box className="profile-bio">
          <Typography variant="body2" className="bio-text">
            {userData.profileInfo || "자기소개 내용이 없습니다."}
          </Typography>

          <Box className="profile-buttons" style={{ display: "flex", gap: "12px" }}>
  <button
    className="user-action-button"
    onClick={toggleFollow}
  >
    {isFollowing ? "팔로우 취소" : "팔로우"}
  </button>

  <button
    className="user-action-button"
    onClick={isBlocked ? unblockUser : blockUser}
  >
    {isBlocked ? "차단 해제" : "차단"}
  </button>
</Box>


        </Box>
      </Box>

<Box className="profile-tags">

{/* 보유 기술 역량 */}
<Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" mt={1}>
  <Typography fontWeight="bold" whiteSpace="nowrap">보유 기술 역량</Typography>
  {parseFlexibleArray(userData.userSkill).map((skill, idx) => (
    <Chip
      key={idx}
      label={skill}
      variant="outlined"
      sx={{ backgroundColor: "#ffffff" }}
    />
  ))}
</Box>

{/* 선호 지역 */}
<Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" mt={1}>
  <Typography fontWeight="bold" whiteSpace="nowrap">선호 지역</Typography>
  {parseFlexibleArray(userData.userRegion).map((region, idx) => (
    <Chip
      key={idx}
      label={region}
      variant="outlined"
      sx={{ backgroundColor: "#ffffff"}}
    />
  ))}
</Box>

{/* 참가 목표 */}
<Box display="flex" alignItems="center" gap={1} flexWrap="nowrap" mt={1}>
  <Typography fontWeight="bold" whiteSpace="nowrap">참가 목표</Typography>
  {parseFlexibleArray(userData.userTarget).map((target, idx) => (
    <Chip
      key={idx}
      label={target}
      variant="outlined"
      sx={{ backgroundColor: "#ffffff" }}
    />
  ))}
</Box>
</Box>

<Box className="profile-tags2">
{/* 게시글 목록 */}
<Typography mt={3} mb={1} fontWeight="bold">작성한 게시글</Typography>
<Box className="feed-grid">
  {posts.map(post => (
    <Card key={post.commIdx} className="feed-card" onClick={() => handlePostClick(post)}>
      <img
        src={`http://192.168.219.184:8085/api/community/images/${post.commFile}`}
        alt="게시글 이미지"
        className="feed-image"
      />
    </Card>
  ))}
</Box>
</Box>


      {/* 게시글 클릭 */}
      <Dialog open={!!selectedPost} onClose={() => setSelectedPost(null)} maxWidth="sm" fullWidth>
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
  {selectedPost?.liked
    ? <FavoriteIcon color="error" />
    : <FavoriteBorderIcon />}
</IconButton>
<Typography>{selectedPost?.commLikes}</Typography>
          </Box>

          {/* 댓글 목록 + 입력 */}
          <Box sx={{ px: 2, pb: 2 }}>
            {commentsData[selectedPost.commIdx]?.map((comment, idx) => (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Avatar
                src={comment.userProfileImg || "/default-avatar.png"}
                sx={{ width: 30, height: 30, mr: 1, cursor: "pointer",border: "1px solid #d0d0d0" }}
                onClick={() => {
                  setSelectedPost(null);
                  if (myUserId && comment.userId === myUserId) {
                    navigate("/Fourth"); // 내 댓글이면 내 프로필
                  } else {
                    navigate(`/ProfileUser/${comment.userId}`); // 남의 댓글이면 그 사람 프로필
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

  );
};

export default ProfileUser;



