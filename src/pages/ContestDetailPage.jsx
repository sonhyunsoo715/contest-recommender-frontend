import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import contests from "../data/contest_cleaned.json";
import "../component/style/ContestDetailPage.css";
import Swal from "sweetalert2";

// 선호 지역 및 기술 스택, 목표 옵션들 정의
const preferredRegions = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "온라인"];
const techStacks = ["서버/백엔드", "프론트엔드", "모바일 게임", "머신러닝", "안드로이드 앱", "인터넷 보안", "아이폰 앱", "인공지능(AI)", "게임 클라이언트", "웹 풀스택", "DBA", "데이터 엔지니어", "게임 서버", "시스템/네트워크", "데브옵스", "QA", "개발PM", "로보틱스 미들웨어", "그래픽스", "임베디드 소프트웨어", "블록체인", "ERD", "응용 프로그램", "사물인터넷(IoT)", "웹 퍼블리싱", "크로스 플랫폼", "VR/AR/3D", "데이터 분석", "없음"];
const goals = ["경험 쌓기", "포트폴리오 만들기", "수상"];

// 개행이 포함된 문자열을 배열로 변환하는 함수
const parseMultilineText = (text) => text?.split("\n").map(line => line.trim()).filter(Boolean) || [];

const fetchParticipantCount = async (teamId, token) => {
  try {
    const res = await axios.get(
      `http://192.168.219.184:8085/api/team/participants/count/${teamId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return res.data;
  } catch (err) {
    console.warn(`❗ 참가자 수 가져오기 실패 (teamId: ${teamId})`, err);
    return 0;
  }
};


export default function ContestDetailPage() {
  // URL 파라미터로부터 contest ID 획득
  const { id } = useParams();
  // 공모전 정보 가져오기
  const contest = contests[parseInt(id)];

  // 탭, 모달 상태, 팀 목록, 이미지, 선택된 팀 관련 상태 관리
  const [tab, setTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const navigate = useNavigate();
  // 팀 수정용 상태, 모달
  const [editMode, setEditMode] = useState(false); // 수정 모드 여부
  const [editForm, setEditForm] = useState(null); // 수정 폼 데이터


  // 현재 로그인한 사용자 ID 가져오기
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const storedId = localStorage.getItem("userId");
    if (storedId) {
      setCurrentUserId(String(storedId)); // ← String으로 강제 변환
    }
  }, []);

  // 공모전 ID가 변경될 때마다 팀 목록과 추천 정보 불러오기
  useEffect(() => {
    if (!currentUserId) return;
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        // 1️⃣ 팀 리스트 불러오기
        const teamRes = await axios.get(`http://192.168.219.184:8085/api/team/contest/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const teamList = teamRes.data;

        // 2️⃣ 현재 사용자 정보 불러오기
        const userRes = await axios.get(`http://192.168.219.184:8085/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let recommendationList = [];
        const scoreMap = new Map();

        try {
          // 3️⃣ 추천 API 요청
          const recommendRequest = {
            user: {
              userSkill: userRes.data.userSkill,
              userRegion: userRes.data.userRegion,
              userTarget: userRes.data.userTarget
            },
            teams: teamList.map(team => ({
              teamId: team.teamId,
              skill: team.skill,
              region: team.region,
              target: team.target
            }))
          };

          const recommendRes = await axios.post(
            "http://192.168.219.184:8085/api/recommend",
            recommendRequest,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          recommendationList = recommendRes.data;

          recommendationList.forEach(r => scoreMap.set(r.team_id, r.score));

        } catch (recErr) {
          // 추천 API 실패 시 로그만 남기고 무시
          console.warn("❗ 추천 불러오기 실패 → 무시하고 전체 팀만 표시", recErr);
        }

        const enrichedTeams = await Promise.all(
          teamList.map(async (team) => {
            const isCurrentUser = String(team.userId) === currentUserId;
            const score = scoreMap.get(team.teamId) || 0;
            if (isCurrentUser) {
              try {
                const teamUser = await axios.get(`http://192.168.219.184:8085/api/user/${team.userId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                return {
                  ...team,
                  score: 0,
                  isRecommended: false,
                  creatorProfileUrl: teamUser.data.profileImg
                    ? `http://192.168.219.184:8085/profile_images/${teamUser.data.profileImg}`
                    : "/default-profile.png",
                  creatorNick: teamUser.data.userNick || "(내 팀)",
                  participantCount: await fetchParticipantCount(team.teamId, token),
                };
              } catch (err) {
                console.error("❌ 본인 팀 사용자 정보 불러오기 실패", err);
                return {
                  ...team,
                  score: 0,
                  isRecommended: false,
                  creatorProfileUrl: "/default-profile.png",
                  creatorNick: "(내 팀)",
                  participantCount: await fetchParticipantCount(team.teamId, token),
                };
              }
            }

            try {
              const teamUser = await axios.get(`http://192.168.219.184:8085/api/user/${team.userId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
         
              return {
                ...team,
                score,
                isRecommended: score >= 0.6,
                creatorProfileUrl: teamUser.data.profileImg
                  ? `http://192.168.219.184:8085/profile_images/${teamUser.data.profileImg}`
                  : "/default-profile.png",
                creatorNick: teamUser.data.userNick || "닉네임 없음",
                participantCount: await fetchParticipantCount(team.teamId, token),
              };
            } catch {
              return {
                ...team,
                score,
                isRecommended: score >= 0.6,
                creatorProfileUrl: "/default-profile.png",
                creatorNick: "알 수 없음",
                participantCount: await fetchParticipantCount(team.teamId, token),
              };
            }
          })
        );
 // 추천팀 우선 + 점수 내림차순 + 최신순 정렬
 enrichedTeams.sort((a, b) => {
  if (a.isRecommended && !b.isRecommended) return -1;
  if (!a.isRecommended && b.isRecommended) return 1;
  return b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt);
});

        // 팀 상태 반영
        setTeams(enrichedTeams);
      } catch (err) {
        console.error("❌ 팀 전체 불러오기 실패", err);
      }
    };

    fetchTeams();
  },  [id, currentUserId]);

  // 팀 생성 후 팀 목록에 추가
  const handleTeamCreate = async (newTeam) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
  
    try {
      // 유저 정보 조회 (프로필 이미지 및 닉네임용)
      const userRes = await axios.get(`http://192.168.219.184:8085/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // 새로 생성한 팀 정보에 유저 프로필 정보 추가
      const enrichedTeam = {
        ...newTeam,
        creatorProfileUrl: userRes.data.profileImg
          ? `http://192.168.219.184:8085/profile_images/${userRes.data.profileImg}`
          : "/default-profile.png",
        creatorNick: userRes.data.userNick || "닉네임 없음",
        createdAt: new Date().toISOString(),
        userId: String(userId),
        participantCount: 1
      };
  
      // 새로 생성된 팀을 바로 화면에 추가
      setTeams((prevTeams) => {
        const updatedTeams = [enrichedTeam, ...prevTeams];  // 새 팀을 가장 앞에 추가
        return updatedTeams;
      });
  
      setShowModal(false); // 모달 닫기
      Swal.fire({
        icon: 'success',
        title: '팀 생성 완료!',
        width: '400px',
      });
  
    } catch (e) {
      console.error("팀 생성 후 사용자 프로필 불러오기 실패", e);
    }
  };
  

  // ✅ 팀 채팅방 생성 요청 핸들러
  const handleChatClick = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    try {
      const response = await fetch(
        `http://192.168.219.184:8085/api/team/checkOrCreateRoom/${selectedTeam.teamId}?userId=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );


    if (response.status === 403) {
      const errorData = await response.json();
      alert(errorData.error || "❌ 참여할 수 없는 채팅방입니다.");
      return;
    }

    // 정상 응답 아닌 경우
    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ 응답 실패:", errText);
      alert("채팅방을 불러오지 못했습니다.");
      return;
    }

    const roomData = await response.json();
    navigate(`/chatroom/${roomData.roomId}`);

  } catch (err) {
    console.error("❌ Axios Error", err.response?.data || err.message);
    alert("서버와의 통신에 실패했습니다.");
  }
};


  return (
    <>
      {/* 공모전 전체 컨테이너 */}
      <div className="contest-container">
        <div className="contest-card">
          {/* 공모전 제목 */}
          <h1 className="contest-title">{contest.title}</h1>

          {/* 공모전 상단 섹션: 이미지 + 정보 */}
          <div className="contest-top-section">
            {/* 공모전 이미지 클릭 시 큰 이미지로 보기 */}
            <div
              className="contest-image"
              onClick={() =>
                setSelectedImage(`/detizen_images/contest${parseInt(id) + 1}.jpg`)
              }
            >
              <img
                src={`/detizen_images/contest${parseInt(id) + 1}.jpg`}
                alt={contest.title}
              />
            </div>

            {/* 공모전 정보 테이블 */}
            <div className="contest-info-table">
              <Info label="주최" value={contest.host} />
              <Info label="기업형태" value={contest.hostType?.join(", ") || "-"} />
              <Info label="참여대상" value={parseMultilineText(contest["참가대상"])?.[0] || "-"} />
              <Info label="시상규모" value={contest["시상내역(혜택)"]?.match(/(\d+[,."]*만원|[\d.]+만 원)/)?.[0] || "-"} />
              <Info label="접수기간" value={`${contest.startDate || "2025.04.07"} ~ ${contest.deadline}`} />
              <Info label="활동혜택" value="기타, 상장 수여" />
              {/* 공모 분야 태그 */}
              <div className="contest-tags">
                <Info label="공모 분야" />
                {contest.category?.map((cat, i) => (
                  <span key={i} className="tag">{cat}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 소개/팀생성 탭 버튼 */}
          <div className="contest-tabs">
            <button className={tab === 0 ? "tab active" : "tab"} onClick={() => setTab(0)}>소개</button>
            <button className={tab === 1 ? "tab active" : "tab"} onClick={() => setTab(1)}>팀 생성</button>
          </div>

          {/* 탭별 콘텐츠 */}
          <div className="contest-content">
            {/* 소개 탭 내용 */}
            {tab === 0 && (
              <>
                <Section title="공모 주제" items={parseMultilineText(contest["주제"])} />
                <Section title="기간 및 일정" items={parseMultilineText(contest["기간 및 일정"])} />
                <Section title="시상 내역" items={parseMultilineText(contest["시상내역(혜택)"])} />
              </>
            )}

            {/* 팀 생성 탭 내용 */}
            {tab === 1 && (
              <>
                {/* 팀 생성 버튼 */}
                <button className="create-team-btn" onClick={() => setShowModal(true)}>+ 팀 생성</button>

                {/* 팀 목록 */}
                <div className="team-list">
                  {teams.map((team) => (
                    <div key={team.teamId} className="team-card" onClick={() => setSelectedTeam(team)}>
                      {/* 추천팀이면 뱃지 표시 */}
                      {team.isRecommended && (
                        <span className="recommended-badge">✨ 추천팀</span>
                      )}

                      <div className="team-left">
                        {/* 작성자 프로필 클릭 시 해당 프로필로 이동 */}
                        <img
                          className="team-avatar"
                          src={team.creatorProfileUrl || "/default-profile.png"}
                          alt="creator"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (String(team.userId) === currentUserId) {
                              navigate("/Fourth");
                            } else {
                              navigate(`/ProfileUser/${team.userId}`);
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />

                        {/* 팀 정보: 제목, 태그 */}
                        <div className="team-info">
                          <div className="team-title">{team.teamTitle}</div>
                          <div className="team-tags">
                            {/* 기술 스택 태그 */}
                            {team.skill && (
                              <div className="team-tag tech-group">
                                모집중인 기술 역량 :
                                {team.skill.split(', ').map((t, i) => (
                                  <span key={i} className="team-tag tech">#{t}</span>
                                ))}
                              </div>
                            )}
                            <span className="team-tag">#{team.region}</span>
                            <span className="team-tag">#{team.target}</span>
                          </div>
                        </div>
                      </div>
                      {/* 팀 인원 수 */}
                      <div className="team-count">{team.participantCount}/{team.teamLimit}</div>
                    </div>
                  ))}
                </div>

                {/* 팀 생성 모달 */}
                {showModal && (
                  <TeamModal onClose={() => setShowModal(false)} onCreate={handleTeamCreate} contestId={id} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 공모전 이미지 클릭 시 전체 보기 모달 */}
      {selectedImage && (
        <div className="image-viewer-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="image-viewer-wrapper" onClick={(e) => e.stopPropagation()}>
            <button className="image-close-btn" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage} alt="큰 이미지" className="image-viewer" />
          </div>
        </div>
      )}

      {/*팀 생성*/}
      {selectedTeam && (
  <div className="modal-backdrop" onClick={() => setSelectedTeam(null)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>

      {/* 기존 닫기 버튼, 제목, 설명 그대로 유지 */}
      <button className="modal-close-btn" onClick={() => setSelectedTeam(null)}>×</button>
      <h2 className="modal-title">{selectedTeam.teamTitle}</h2>
      <p className="team-description" style={{ whiteSpace: "pre-line" }}>
  {selectedTeam.teamInfo}
</p>
<hr></hr>
      {/* 기존의 team-detail-table 이 부분을 아래 코드로 교체해줘 */}
      <div className="modal-right">
  <div className="tag-line">
    <span className="tag-title">모집 기술</span>
    {selectedTeam.skill?.split(",").map((skill, i) => (
      <span key={i} className="tag-chip">#{skill.trim()}</span>
    ))}
  </div>

  <div className="tag-line">
    <span className="tag-title">지역</span>
    <span className="tag-chip">#{selectedTeam.region}</span>
  </div>

  <div className="tag-line">
    <span className="tag-title">목표</span>
    <span className="tag-chip">#{selectedTeam.target}</span>
  </div>
</div>

            <div className="modal-buttons">
              <button
                className="chat-button"
                onClick={() => handleChatClick(selectedTeam.teamId)}
              >
                채팅하기
              </button>

              {String(selectedTeam.userId) === localStorage.getItem("userId") && (
                <>
                  <button
                    className="edit-button"
                    onClick={() => {
                      setEditForm(selectedTeam);
                      setEditMode(true);
                    }}
                  >
                    ✏️ 수정
                  </button>
                  <button
                    className="delete-button"
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      if (window.confirm("정말 이 팀을 삭제하시겠습니까?")) {
                        try {
                          await axios.delete(`http://192.168.219.184:8085/api/team/delete/${selectedTeam.teamId}`, {
                            headers: { Authorization: `Bearer ${token}` },
                            params: { userId: localStorage.getItem("userId") }
                          });
      Swal.fire({
            icon: 'success',
            title: ' 팀 삭제 완료!',
            width:'400px'
          });
                          setTeams((prev) => prev.filter(team => team.teamId !== selectedTeam.teamId));
                          setSelectedTeam(null);
                        } catch (err) {
                          console.error("❌ 팀 삭제 실패", err);
                          alert("❌ 삭제 실패");
                        }
                      }
                    }}
                  >
                    🗑 삭제
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/*수정용 폼(모달)*/}
      {editMode && editForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <button className="modal-close-btn" onClick={() => setEditMode(false)}>×</button>
            <h2 className="modal-title">✏️ 팀 수정하기</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const token = localStorage.getItem("token");
                  const payload = {
                    ...editForm,
                    skill: Array.isArray(editForm.skill) ? editForm.skill.join(", ") : editForm.skill, // 문자열로 변환
                    userId: localStorage.getItem("userId"),
                  };

                  const res = await axios.put(
                    `http://192.168.219.184:8085/api/team/update/${editForm.teamId}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );

                  setTeams((prev) =>
                    prev.map((t) => (t.teamId === editForm.teamId ? { ...t, ...res.data } : t))
                  );
                  setEditMode(false);
                  setSelectedTeam(null);
                  Swal.fire({
                    icon: 'success',
                    title: '수정 완료!',
                    width:'400px'
                  });

                } catch (err) {
                  console.error("❌ 수정 실패", err);
                  alert("❌ 팀 수정 실패");
                }
              }}
              className="modal-form"
            >
              {/* 제목 입력 */}
              <input
                type="text"
                value={editForm.teamTitle}
                onChange={(e) => setEditForm((prev) => ({ ...prev, teamTitle: e.target.value }))}
                placeholder="팀 제목"
                required
              />

              {/* 팀 설명 */}
              <textarea
                value={editForm.teamInfo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, teamInfo: e.target.value }))}
                placeholder="팀 설명"
                required
              />

              {/* 모집 인원 수 */}
              <div className="form-row">
                <label>모집 인원 수</label>
                <select
                  value={editForm.teamLimit}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, teamLimit: e.target.value }))}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}명</option>
                  ))}
                </select>
              </div>

              {/* ✅ 기술 스택 (다중 선택) */}
              <div className="form-row">
                <label>모집 기술 역량</label>
                <select
                  name="skill"
                  value={editForm.skill}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                    setEditForm((prev) => ({ ...prev, skill: selected }));
                  }}
                  multiple
                  size={6}
                >
                  {techStacks.map((stack) => (
                    <option key={stack} value={stack}>{stack}</option>
                  ))}
                </select>
              </div>

              {/* 지역 */}
              <div className="form-row">
                <label>선호 지역</label>
                <select
                  value={editForm.region}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, region: e.target.value }))}
                  required
                >
                  <option value="">선택하세요</option>
                  {preferredRegions.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* 목표 */}
              <div className="form-row">
                <label>팀 목표</label>
                <select
                  value={editForm.target}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, target: e.target.value }))}
                  required
                >
                  <option value="">선택하세요</option>
                  {goals.map((goal) => (
                    <option key={goal} value={goal}>{goal}</option>
                  ))}
                </select>
              </div>

              {/* 저장 버튼 */}
              <div className="modal-buttons">
                <button type="submit">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}

// Info 컴포넌트: 라벨과 값을 한 줄에 출력하는 UI 구성 요소
function Info({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
}

// Section 컴포넌트: 제목 + 여러 줄의 리스트를 출력하는 UI 구성 요소
function Section({ title, items }) {
  if (!items?.length) return null; // 값이 없으면 렌더링하지 않음
  return (
    <div className="section">
      <h4 className="section-title">{title}</h4>
      <ul className="section-list">{items.map((line, i) => <li key={i}>{line}</li>)}</ul>
    </div>
  );
}

// TeamModal 컴포넌트: 팀 생성을 위한 모달 폼
function TeamModal({ onClose, onCreate, contestId }) {
  const modalRef = useRef();
  const [form, setForm] = useState({ teamTitle: "", description: "", headcount: 5, tech: [], region: "", goal: "" });

  // 모달 바깥 클릭 시 닫히도록 처리
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // 입력값 변경 핸들링
  const handleChange = (e) => {
    const { name, value, multiple, options } = e.target;

    if (multiple) {
      // 다중 선택 (예: 기술 스택)
      const selectedValues = Array.from(options, opt => opt.selected && opt.value).filter(Boolean);
      setForm((prev) => ({ ...prev, [name]: selectedValues }));
    } else {
      // 일반 단일 입력
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 팀 생성 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // 전송할 데이터 구성
      const payload = {
        teamTitle: form.teamTitle,
        teamInfo: form.description,
        teamLimit: parseInt(form.headcount),
        skill: Array.isArray(form.tech) ? form.tech.join(", ") : form.tech,
        region: form.region,
        target: form.goal,
        userId,
        contIdx: parseInt(contestId)
      };
      // 백엔드 API 호출
      const response = await axios.post("http://192.168.219.184:8085/api/team/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      // 성공 시 알림, 팀 추가, 모달 닫기
      Swal.fire({
        icon: 'success',
        title: '팀 생성 완료!',
        width:'400px'
      });
      onCreate(response.data);
      onClose();

    } catch (err) {
      console.error("❌ 팀 생성 실패", err.response?.data || err.message);
      alert("팀 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        <h2 className="modal-title">🧑‍🤝‍🧑 팀 만들기</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          {/* 제목 입력 */}
          <input type="text" name="teamTitle" placeholder="제목" value={form.teamTitle} onChange={handleChange} required />
          {/* 팀 설명 */}
          <textarea name="description" placeholder="내용" value={form.description} onChange={handleChange} required />
          {/* 모집 인원 수 선택 */}
          <div className="form-row">
            <label>모집 인원 수</label>
            <select name="headcount" value={form.headcount} onChange={handleChange}>
              {[...Array(5)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}명</option>)}
            </select>
          </div>
          {/* 기술 스택 선택 (다중) */}
          <div className="form-row">
            <label>모집 기술 역량</label>
            <select name="tech" value={form.tech} onChange={handleChange} multiple size={6}>
              {techStacks.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* 지역 선택 */}
          <div className="form-row">
            <label>선호 지역</label>
            <select name="region" value={form.region} onChange={handleChange} required>
              <option value="">선호 지역</option>
              {preferredRegions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {/* 목표 선택 */}
          <div className="form-row">
            <label>팀 목표</label>
            <select name="goal" value={form.goal} onChange={handleChange} required>
              <option value="">목표</option>
              {goals.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {/* 제출 버튼 */}
          <div className="modal-buttons">
            <button type="submit">생성</button>
          </div>
        </form>
      </div>
    </div>

  );
}













