import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Chip,
  Button,
  Drawer,
  MenuItem,
  Select,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import contests from "../data/contest_cleaned.json";
import "../component/style/Contest.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";


// D-Day 계산
const getDDay = (deadline) => {
  const today = new Date();
  const target = new Date(deadline);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "마감";
  return `D-${diff}`;
};

// D-Day 임박 여부 (예: D-3 이하만 임박으로)
const isDDayUrgent = (dday, days) => {
  // dday가 'D-3' 같은 형식이고, 해당 숫자가 days 이하면 true
  return /^D-\d+$/.test(dday) && parseInt(dday.slice(2)) <= days;
};

// 검색 조건
const categories = {
  분야: ["IT", "SW", "공학", "데이터", "기획/아이디어"],
  시상규모: ["1천만원 미만", "3천만원 미만", "5천만원 미만", "5천만원 이상", "채용 가산점", "상장/상품", "기타"],
  주최기관: ["중견기업", "대기업", "외국계기업", "공기업", "지자체/산하기관", "비영리/협회", "정부기관", "중소기업", "기타"],
};

export default function SearchPage() {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState({ 분야: [], 시상규모: [], 주최기관: [] });
  const [sort, setSort] = useState("마감일순");
  const navigate = useNavigate();
  const [viewMap, setViewMap] = useState(false);
  
  const toggleOption = (section, value) => {
    setSelected((prev) => {
      const current = prev[section];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [section]: updated };
    });
  };
  useEffect(() => {
    axios.get("http://192.168.219.184:8085/api/contest/views")
      .then(res => setViewMap(res.data))
      .catch(err => console.error("조회수 로딩 실패", err));
      
  }, []);

  const processed = contests.map((item, idx) => {
    const deadline = item.deadline;
    const dday = deadline ? getDDay(deadline) : null;
    // 조회수
    const viewCount = viewMap[idx] || 0;
    return { ...item, idx, dday, viewCount };
  });

  const filtered = processed.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(search.toLowerCase());
    const 분야Match = selected["분야"].length === 0 || selected["분야"].some((v) => item.category?.includes(v));
    const 시상Match = selected["시상규모"].length === 0 || selected["시상규모"].some((v) => item.prizeScale?.includes(v));
    const 주최Match = selected["주최기관"].length === 0 || selected["주최기관"].some((v) => item.hostType?.includes(v));
    return titleMatch && 분야Match && 시상Match && 주최Match;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "마감일순") {
      const aDiff = a.dday?.startsWith("D-") ? parseInt(a.dday.slice(2)) : 9999;
      const bDiff = b.dday?.startsWith("D-") ? parseInt(b.dday.slice(2)) : 9999;
      return aDiff - bDiff;
    } else if (sort === "조회수순") {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    return 0;
  });

  return (
    <Box sx={{ px: 2, py: 4, display: 'flex', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', maxWidth: '700px' }}>
        {/* 검색창 */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="공모전 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "gray" }} /> }}
          sx={{ mb: 2 }}
        />

        {/* 검색조건 Chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
          <Button variant="outlined" onClick={() => setDrawerOpen(true)}>검색조건 +</Button>
          {Object.entries(selected).map(([key, values]) =>
            values.map((v) => (
              <Chip
                key={key + v}
                label={`${v} ×`}
                onClick={() => toggleOption(key, v)}
                color="primary"
              />
            ))
          )}
        </Box>

        {/* 검색결과 개수 + 정렬 드롭다운 */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            검색결과 {sorted.length}건
          </Typography>
          <Select value={sort} onChange={(e) => setSort(e.target.value)} size="small">
            <MenuItem value="마감일순">마감일순</MenuItem>
            <MenuItem value="조회수순">조회수순</MenuItem>
          </Select>
        </Box>

        {/* 카드 리스트 */}
        <div className="cardGrid">
          {sorted.map((item) => (
            <Card
              key={item.idx}
              className={`cardWrapper ${isDDayUrgent(item.dday, 3) ? "urgentCard" : ""}`}
              onClick={async () => {
                try {
                  await axios.get(`http://192.168.219.184:8085/api/contest/view/${item.idx}`);
                } catch (err) {
                  console.error("조회수 증가 실패", err);
                }
                navigate(`/contest/${item.idx}`);
              }}
            >
              <div className="cardImageWrapper">
                {item.dday && (
                  <div
                  className={`ddayBadge 
                    ${item.dday === "마감" ? "expired" : isDDayUrgent(item.dday, 7) ? "urgent" : ""}`}
                >
                  {item.dday === "마감"
                    ? "마감"
                    : isDDayUrgent(item.dday, 7)
                    ? "🔥 마감임박"
                    : "접수중"}
                </div>
                )}
                <CardMedia
                  component="img"
                  height="140"
                  image={`/detizen_images/contest${item.idx + 1}.jpg`}
                  alt={item.title}
                  className="cardImage"
                />
              </div>
              <CardContent className="cardContent">
                <Box className="cardTitleLine">
                  {item.dday && (
                    <Typography className="ddayBadgeText">{item.dday}</Typography>
                  )}
                  <Typography className="cardTitle">{item.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.roomTitle}
            </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" alignSelf="center" sx={{ mt: 1 }}>
                  {item.host}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: "center" }}>
                  조회수 {item.viewCount || 0}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 필터 Drawer */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>검색조건</Typography>
            {Object.entries(categories).map(([section, options]) => (
              <Box key={section} sx={{ mb: 2 }}>
                <Typography sx={{ mb: 1 }}>{section}</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {options.map((option) => (
                    <Chip
                      key={option}
                      label={option}
                      clickable
                      onClick={() => toggleOption(section, option)}
                      color={selected[section].includes(option) ? "primary" : "default"}
                      sx={{ borderRadius: "16px" }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
            <Button fullWidth variant="contained" onClick={() => setDrawerOpen(false)}>
              검색 완료
            </Button>
          </Box>
        </Drawer>
      </Box>
    </Box>
  );
}
