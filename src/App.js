import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import First from "./pages/First";
import Second from "./pages/Second";
import Third from "./pages/Third";
import Fourth from "./pages/Fourth";

import Header from "./component/Header";
import BottomNav from "./component/BottomNav";
import LoginPage from './pages/LoginPage';
import ProfileEditPage from "./component/ProfileEditPage";
import PasswordChangePage from "./component/PasswordChangePage";
import AccountDeletePage from "./component/AccountDelete";
import PasswordConfirmPage from "./component/PasswordConfirmPage";
import SignupPage from "./pages/SignupPage";
import ContestDetailPage from "./pages/ContestDetailPage";
import ProfileCheck from "./pages/ProfileCheck";
import Profile from "./pages/Profile";
import ProfileUser from "./component/ProfileUser";
import BlockedList from "./component/BlockedList";
import FriendSearch from "./component//FriendSearch";

import ChatRoom from "./component/chat/ChatRoom";

function AppContent() {
  const location = useLocation();

  // 이 경로에서는 BottomNav 숨김
  const hideBottomNavPaths = ["/", "/SignupPage", "/ProfileCheck", "/pwcheck", "/delete", "/delete/confirm"];
  

  return (
    <div className="App">
      <Header />
      <Routes>
        {/* 로그인, 회원가입 */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/SignupPage" element={<SignupPage />} />
        <Route path="/ProfileCheck" element={<ProfileCheck />} />

        {/* 하단 메뉴: 홈, 공모전, 채팅, 프로필 */}
        <Route path="/first" element={<First />} />
        <Route path="/second" element={<Second />} />
        <Route path="/third" element={<Third />} />
        <Route path="/fourth" element={<Fourth />} />

        {/* 홈 */}
        <Route path="/search" element={<FriendSearch />} />

        {/* 공모전 */}
        <Route path="/contest/:id" element={<ContestDetailPage />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />

        {/* 채팅 */}
        <Route path="/chatroom/:roomId" element={<ChatRoom />} />

        {/* 프로필 */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit" element={<ProfileEditPage />} />
        <Route path="/pwchange" element={<PasswordChangePage />} />
        <Route path="/blockedList" element={<BlockedList />} />
        <Route path="/delete" element={<AccountDeletePage />} />
        <Route path="/delete/confirm" element={<div>탈퇴 완료 페이지</div>} />
        <Route path="/pwcheck" element={<PasswordConfirmPage />} />
        {/*다른 유저 프로필 이동*/}
        <Route path="/ProfileUser/:userId" element={<ProfileUser />} />
      </Routes>

      {/* 특정 경로에서만 BottomNav 숨김 */}
      {!hideBottomNavPaths.includes(location.pathname) && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
