import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  Collapse,
  TextField,
  Button
} from "@mui/material";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Favorite, FavoriteBorder, ChatBubbleOutline } from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";




const Feed = () => {
  const [myUserId, setMyUserId] = useState(null); // 현재 로그인한 내 ID
  const [posts, setPosts] = useState([]);
  const [openComments, setOpenComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [commentsData, setCommentsData] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const navigate = useNavigate();


  // ✅ 게시글 + 댓글 불러오기
  // 사용자 프로필 이미지를 게시글마다 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("token");
  
        // ✅ 로그인한 내 userId 먼저 가져오기
        const userRes = await axios.post("http://192.168.219.184:8085/api/user/me", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyUserId(userRes.data.userId); // 상태 저장
  
        // 🧵 이후 게시글 로직은 그대로 유지
        const res = await axios.get("http://192.168.219.184:8085/api/community", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const sortedPosts = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPosts(sortedPosts);
        
        // 각 게시글의 작성자 프로필 이미지 가져오기
        const postsWithUserImages = await Promise.all(
          res.data.map(async (post) => {
            const userRes = await axios.get(
              `http://192.168.219.184:8085/api/user/${post.userId}`,  // 유저 ID로 프로필 이미지 요청
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
              ...post,
              userProfileImg: userRes.data.profileImg
                ? `http://192.168.219.184:8085/profile_images/${userRes.data.profileImg}`
                : "/default-avatar.png",  // 프로필 이미지가 없다면 기본 이미지로 설정
            };
          })
        );
        setPosts(postsWithUserImages);

        // 댓글, 좋아요 처리
        const initialLikes = {};
        const commentsDataTemp = {}; // 임시 객체로 댓글 저장

        for (const post of res.data) {
          // 댓글
          const commentRes = await axios.get(
            `http://192.168.219.184:8085/api/comment/${post.commIdx}/comments`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          commentsDataTemp[post.commIdx] = commentRes.data;


          // 댓글 작성자 프로필 정보 추가
          const commentsWithUserData = await Promise.all(
            commentRes.data.map(async (comment) => {
              const commentUserRes = await axios.get(
                `http://192.168.219.184:8085/api/user/${comment.userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return {
                ...comment,
                userProfileImg: commentUserRes.data.profileImg
                  ? `http://192.168.219.184:8085/profile_images/${commentUserRes.data.profileImg}`
                  : "/default-avatar.png",  // 댓글 작성자 프로필 이미지
                userNick: commentUserRes.data.userNick || "닉네임 없음", // 댓글 작성자 닉네임
              };
            })
          );
          commentsDataTemp[post.commIdx] = commentsWithUserData;

          // 좋아요 상태 저장 (post.liked가 없으면 false로 초기화)
          initialLikes[post.commIdx] = post.liked ?? false;
        }

        setCommentsData(commentsDataTemp);
        setLikedPosts(initialLikes);
      } catch (err) {
        console.error("❌ 게시글 로딩 실패", err);
      }
    };

    fetchPosts();
  }, []);

  // ✅ 좋아요 토글
  const toggleLike = async (id) => {
    const token = localStorage.getItem("token");

    // 먼저 로컬 상태 먼저 반영
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.commIdx === id
          ? {
            ...post,
            liked: !likedPosts[id],
            commLikes: likedPosts[id]
              ? post.commLikes - 1
              : post.commLikes + 1,
          }
          : post
      )
    );

    // 좋아요 상태도 업데이트
    setLikedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));

    try {
      await axios.post(
        `http://192.168.219.184:8085/api/community/${id}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("❌ 좋아요 실패", err);
    }
  };

  const toggleCommentBox = (id) => {
    setOpenComments(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCommentChange = (id, value) => {
    setNewComments(prev => ({ ...prev, [id]: value }));
  };




  const handleCommentSubmit = async (id) => {
    const content = newComments[id];
    if (!content) return;

    try {
      const token = localStorage.getItem("token");

      // 1. 서버에 댓글 등록 요청
      await axios.post(
        `http://192.168.219.184:8085/api/comment/${id}/comments`,
        { cmtContent: content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 2. 등록 후 해당 게시글의 댓글 전체 다시 불러오기
      const commentRes = await axios.get(
        `http://192.168.219.184:8085/api/comment/${id}/comments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const commentsWithUserData = await Promise.all(
        commentRes.data.map(async (comment) => {
          const commentUserRes = await axios.get(
            `http://192.168.219.184:8085/api/user/${comment.userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return {
            ...comment,
            userProfileImg: commentUserRes.data.profileImg
              ? `http://192.168.219.184:8085/profile_images/${commentUserRes.data.profileImg}`
              : "/default-avatar.png",
            userNick: commentUserRes.data.userNick || "닉네임 없음",
          };
        })
      );

      setCommentsData((prevData) => ({
        ...prevData,
        [id]: commentsWithUserData,
      }));

      // 입력 필드 초기화
      setNewComments((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("❌ 댓글 등록 실패", err);
    }
  };

// ==============================좋아요 많은 순 나열하는 메뉴==========================================//
// Feed.jsx 내부 useEffect 아래쪽에 추가
const [topLikedUsers, setTopLikedUsers] = useState([]);

useEffect(() => {
  const calculateTopLikedUsers = () => {
    
    // 오늘 날짜 기준 (00:00부터 지금까지)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 작성된 게시글 필터
    const todayPosts = posts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= today;
    });

    // 유저별 좋아요 수 집계
    const likeCountPerUser = {};

    todayPosts.forEach(post => {
      if (!likeCountPerUser[post.userId]) {
        likeCountPerUser[post.userId] = {
          userId: post.userId,
          userNick: post.userNick,
          userProfileImg: post.userProfileImg,
          likes: 0,
        };
      }
      likeCountPerUser[post.userId].likes += post.commLikes;
    });

    // 좋아요 많은 순 정렬해서 상위 3명만
    const sorted = Object.values(likeCountPerUser)
      .filter(user => user.likes > 1) 
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);

    setTopLikedUsers(sorted);
  };

  if (posts.length > 0) {
    calculateTopLikedUsers();
  }
}, [posts]);
const getPrettyDate = () => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${month}월 ${date}일`;
};

  return (
    
    <Container maxWidth="sm" sx={{ py: 4 }}>
      {/* 상단 추천 유저 섹션 */}
<Box sx={{ mb: 4 }}>
  <Typography variant="h6" fontWeight="bold" className="top-users-title" sx={{ mb: 2 }}>
  📈 {getPrettyDate()} 인기 유저
</Typography>
  <Box sx={{ display: 'flex', gap: 2 }}>
    {topLikedUsers.map((user, idx) => (
      <Box
        key={user.userId}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 100,
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => {
          if (myUserId && user.userId === myUserId) {
            navigate("/Fourth");
          } else {
            navigate(`/ProfileUser/${user.userId}`);
          }
        }}
      >
        <Avatar
          src={user.userProfileImg || "/default-avatar.png"}
          sx={{ width: 60, height: 60, mb: 1, border: '2px solid #1976d2' }}
        />
        <Typography fontSize="0.875rem" fontWeight="bold">
          {user.userNick}
        </Typography>
        <Typography fontSize="0.75rem" color="text.secondary">
          ❤️ {user.likes} 좋아요
        </Typography>
      </Box>
    ))}
  </Box>
</Box>

      {posts.map((post) => (
        <Card key={post.commIdx} sx={{ mb: 4 ,boxShadow: "0 -4px 10px rgba(0, 0, 0, 0.08)"}}>
          <CardHeader sx={{ padding:1 }}
            avatar={
              <Avatar
              src={post.userProfileImg || "/default-avatar.png"}
              onClick={() => {
                if (myUserId && post.userId === myUserId) {
                  navigate("/Fourth"); // 내 프로필
                } else {
                  navigate(`/ProfileUser/${post.userId}`); // 다른 사람 프로필
                }
              }}
              sx={{ cursor: "pointer" ,border: "1px solid #d0d0d0"}}
            />
            }
            title={
              <Typography fontWeight="bold" sx={{ textAlign: 'left' }}>
                {post.userNick}
              </Typography>
            }
          />
  <Box sx={{ borderTop: '1px solid #e0e0e0' }} />

          {post.commFile && (
            <CardMedia
            component="img"
            image={`http://192.168.219.184:8085/api/community/images/${post.commFile}`}
            alt="게시글 이미지"
            style={{
              width: '100%',
              aspectRatio: '1 / 1', // 정사각형
              objectFit: 'cover',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
          />
          
          )}

<CardContent>
  {/* 게시글 제목 표시 */}
  {post.commTitle && (
    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, textAlign: 'left' }}>
      {post.commTitle}
    </Typography>
  )}

  {/* 게시글 내용 */}
  <Typography variant="body2" sx={{ mt: 1, textAlign: 'left' }}>
    {post.commContent}
  </Typography>
</CardContent>

          <CardActions>
            <IconButton onClick={() => toggleLike(post.commIdx)}>
              {likedPosts[post.commIdx] ? (
                <Favorite color="error" /> // 좋아요가 눌렸으면 채워진 하트
              ) : (
                <FavoriteBorder /> // 좋아요가 안 눌렸으면 빈 하트
              )}
            </IconButton>
            <Typography>{post.commLikes}</Typography>

            {/* 댓글 개수 표시 */}
            <IconButton onClick={() => toggleCommentBox(post.commIdx)}>
              <ChatBubbleOutline />
            </IconButton>

            {/* 댓글 수 표시 (999개 이상일 경우 "999+"로 표시) */}
            <Typography sx={{ ml: 1 }}>
              {commentsData[post.commIdx]?.length > 999
                ? "999+"
                : commentsData[post.commIdx]?.length || 0}
            </Typography>



          </CardActions>

          <Collapse in={openComments[post.commIdx]} timeout="auto" unmountOnExit>
            <Box sx={{ px: 2, pb: 2 }}>
              {/*댓글 목록*/}
              {commentsData[post.commIdx]?.map((comment, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {/* 프로필 이미지 */}
                  <Avatar
  src={comment.userProfileImg || "/default-avatar.png"}
  sx={{ width: 30, height: 30, mr: 1, cursor: "pointer",border: "1px solid #d0d0d0" }}
  onClick={() => {
    if (myUserId && comment.userId === myUserId) {
      navigate("/Fourth"); // 내 댓글이면 내 프로필
    } else {
      navigate(`/ProfileUser/${comment.userId}`); // 남의 댓글이면 그 사람 프로필
    }
  }}
/>
                  {/* 댓글 작성자 닉네임 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
                      {comment.userNick}
                    </Typography>
                    {/* 댓글 내용 */}
                    <Typography variant="body2">
                      {comment.cmtContent}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {/* 댓글 입력 */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
  <TextField
    size="small"
    placeholder="댓글 작성..."
    value={newComments[post.commIdx] || ''}
    onChange={(e) => handleCommentChange(post.commIdx, e.target.value)}
    sx={{ flex: 1 }} // 남는 공간 다 차지
  />
  <Button
    variant="contained"
    size="small"
    sx={{backgroundColor: "#1976d2"}}
    onClick={() => handleCommentSubmit(post.commIdx)}
  >
    등록
  </Button>
</Box>

            </Box>
          </Collapse>
        </Card>
      ))}
    </Container>
  );
};

export default Feed;