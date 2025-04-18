import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

const Post = ({ post }) => {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <div className="border rounded-xl shadow-md p-4 mb-4 bg-white">
      {/* 사용자 정보 */}
      <div className="flex items-center gap-2">
        <img src={post.user.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
        <span className="font-bold">{post.user.name}</span>
      </div>

      {/* 게시물 이미지 */}
      <img src={post.image} alt="post" className="w-full my-2 rounded-md" />

      {/* 좋아요 및 댓글 */}
      <div className="flex items-center gap-4">
        <Heart
          className={`cursor-pointer ${liked ? "text-red-500" : "text-gray-500"}`}
          onClick={toggleLike}
        />
        <MessageCircle className="text-gray-500 cursor-pointer" />
      </div>

      {/* 좋아요 수 */}
      <p className="text-sm mt-1">{likes} likes</p>

      {/* 게시물 텍스트 */}
      <p>
        <span className="font-bold">{post.user.name}</span> {post.caption}
      </p>
    </div>
  );
};

export default Post;