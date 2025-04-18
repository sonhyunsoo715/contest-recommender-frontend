import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import 'react-big-calendar/lib/css/react-big-calendar.css'; // 스타일을 임포트
import axios from "axios";

// moment 로케일을 한국어로 설정
moment.locale('ko');

// moment-localizer 설정
const localizer = momentLocalizer(moment);

const Sched = ({ croomId }) => { 
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });
  const [showEventForm, setShowEventForm] = useState(false);
  const [draggedRange, setDraggedRange] = useState(null); // 드래그한 영역 상태 추가

  const handleNavigate = (date, view) => {
    const month = moment(date).format('YYYY/MM'); // 원하는 형식으로 변경 (2025/05)
    document.querySelector('.rbc-toolbar-label').textContent = month; // DOM을 직접 변경
  };
  useEffect(() => {
    if (!croomId) {
      console.log("croomId is undefined or null");
      return;
    }
    // 일정 조회
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token"); // 토큰을 로컬스토리지에서 가져옴
        const response = await axios.get(`http://192.168.219.184:8085/api/todo/${croomId}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Authorization 헤더에 토큰 추가
          },
        });
        const data = response.data.map(event => ({
          ...event,
          start: new Date(event.start), // LocalDateTime을 Date 객체로 변환
          end: new Date(event.end),     // LocalDateTime을 Date 객체로 변환
        }));
        setEvents(data);
      } catch (error) {
        console.error("일정 조회 실패", error);
      }
    };

    fetchEvents(); // 컴포넌트가 마운트될 때 일정 조회
  }, [croomId]); // croomId가 변경될 때마다 호출

  // 드래그한 범위 선택 시 이벤트 추가 폼
  const handleSelect = (slotInfo) => {
    setDraggedRange({
      start: slotInfo.start,
      end: slotInfo.end
    });

    setNewEvent({
      ...newEvent,
      start: moment(slotInfo.start).format("YYYY-MM-DDTHH:mm"),
      end: moment(slotInfo.end).format("YYYY-MM-DDTHH:mm"),
    });

    setShowEventForm(true);
  };

  // 이벤트 추가 함수
  const handleAddEvent = async () => {
    if (newEvent.title) {
      const eventToAdd = { ...newEvent, start: new Date(newEvent.start), end: new Date(newEvent.end) };

      // 1. 이벤트 백엔드에 저장
      try {
        const token = localStorage.getItem("token"); // 토큰을 로컬스토리지에서 가져옴
        await axios.post(`http://192.168.219.184:8085/api/todo/${croomId}`, eventToAdd, {
          headers: {
            Authorization: `Bearer ${token}`, // Authorization 헤더에 토큰 추가
          },
        });
        // 2. 추가된 이벤트를 로컬 상태에 반영
        setEvents([...events, eventToAdd]);
        setShowEventForm(false);
        setNewEvent({ title: "", start: "", end: "" });
        setDraggedRange(null); // 드래그 범위 초기화
      } catch (error) {
        console.error("일정 추가 실패", error);
      }
    } else {
      alert("이벤트 제목을 입력해주세요!");
    }
  };

  // 이벤트 삭제 함수
  const handleDeleteEvent = async (eventId) => {
    const token = localStorage.getItem("token");
  
    try {
      // 백엔드에 이벤트 삭제 요청
      await axios.delete(`http://192.168.219.184:8085/api/todo/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Authorization 헤더에 토큰 추가
        },
      });
  
      // 로컬 상태에서 해당 이벤트 삭제
      setEvents(events.filter(event => event.id !== eventId)); // 원본 목록에서 삭제
    } catch (error) {
      console.error("일정 삭제 실패", error);
    }
  };

  // 형광펜 드래그 스타일 추가
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: "#91d7ff", // 형광색 (밝은 초록색)
      borderRadius: "5px",
      color: "#000000", // 텍스트 색상
      fontWeight: "bold",
      textAlign: "center",
    };
    return {
      style: style
    };
  };

  return (
    <div className="sched-container" style={{ maxWidth: '80%', margin: 'auto' }}>
      <h2>팀 일정</h2>

      {/* 이벤트 추가 폼 */}
      {showEventForm && (
        <div className="event-form" style={{ backgroundColor:'#f2faff', borderRadius: '10px', alignItems: 'center' }}>
          <label>
            내용:
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </label>
          <br />
          <label>
            시작 시간:
            <input
              type="datetime-local"
              value={newEvent.start}
              onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
              style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </label>
          <br />
          <label>
            종료 시간:
            <input
              type="datetime-local"
              value={newEvent.end}
              onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
              style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </label>
          <br />
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleAddEvent}
              style={{ padding: '10px 20px', backgroundColor: '#2596be', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              이벤트 추가
            </button>
            <button
              onClick={() => setShowEventForm(false)}
              style={{ padding: '10px 20px', backgroundColor: '#2596be', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '10px' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500, padding: '20px' }}
        selectable={true} // 드래그로 선택 가능하게 설정
        onSelectSlot={handleSelect} // 드래그한 영역에 대한 처리를 수행
        eventPropGetter={eventStyleGetter} // 형광색 스타일 적용
        selectOverlap={true} // 드래그 중 다른 이벤트와 겹치지 않게 설정
        onSelectEvent={(e) => console.log('Selected event', e)}
        titleFormat="YYYY/MM" // 월을 "2025년 4월" 형식으로 표시
        views={['month']}
        onNavigate={handleNavigate} // 추가된 부분
      />

      {/* 드래그 영역을 형광펜처럼 강조 표시 */}
      {draggedRange && (
        <div
          style={{
            position: "absolute",
            top: draggedRange.start.getDate(),
            left: draggedRange.end.getDate(),
            backgroundColor: 'rgba(39, 255, 20, 0.1)', // 형광펜 효과 (투명도 추가)
            borderRadius: "5px",
            width: draggedRange.end - draggedRange.start,
            zIndex: 10
          }}
        >
        </div>
      )}

      {/* 삭제 버튼을 추가하여 각 일정 삭제 */}
      <div className="deleted-events" style={{ marginTop: '20px', padding: '20px', backgroundColor:'#f2faff'  }}>
  <h3 style={{ textAlign: 'center', marginBottom: '20px'}}>일정</h3>
  {events.map((event) => (
    <div key={event.id} style={{ marginBottom: '15px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ flex: 1, margin: 0 }}>{event.title}</p>
        <button
          onClick={() => handleDeleteEvent(event.id)}
          style={{
            padding: '3px 5px',
            backgroundColor: '#2596be',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2596be'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2596be'}
        >
          삭제
        </button>
      </div>
    </div>
  ))}
</div>

    </div>
  );
};

export default Sched;
