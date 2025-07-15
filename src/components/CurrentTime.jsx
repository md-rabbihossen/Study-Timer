import dayjs from "dayjs";
import { useEffect, useState } from "react";

function CurrentTime({ fontColor, isInNavbar = false }) {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = dayjs();
      setTime(now.format("hh:mm A")); // 12-hour format with AM/PM
      setDate(now.format("ddd, MMM D")); // Mon, Jan 1
    };

    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="current-time"
      style={{
        color: fontColor,
        position: isInNavbar ? "static" : "fixed",
        top: isInNavbar ? "auto" : "20px",
        right: isInNavbar ? "auto" : "20px",
        textAlign: isInNavbar ? "right" : "center",
        margin: isInNavbar ? "0" : "0 20px",
        padding: isInNavbar ? "0" : "10px",
      }}
    >
      <div
        className="time"
        style={{
          fontSize: isInNavbar ? "1rem" : "1.2em",
          fontWeight: "500",
        }}
      >
        {time}
      </div>
      <div
        className="date"
        style={{
          fontSize: isInNavbar ? "0.8rem" : "0.9em",
          marginTop: "2px",
          opacity: 0.8,
        }}
      >
        {date}
      </div>
    </div>
  );
}

export default CurrentTime;
