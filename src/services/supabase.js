import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dnjzgjvtcahnworjmyfs.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanpnanZ0Y2FobndvcmpteWZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNDM5NzcsImV4cCI6MjA0NjYxOTk3N30.cPWFYRwpKlqI-kmnNrljXZJgNOFJpkbhT7jNYSoIiSo";
const UNSPLASH_ACCESS_KEY = "68D1VltjtnClP03y0xHZFKp46qj0My6Bl0ndzUEqWi4";

export const supabase = createClient(supabaseUrl, supabaseKey);

export const generateUserId = () => {
  const savedUserId = localStorage.getItem("userId");
  if (savedUserId) return savedUserId;

  const newUserId = crypto.randomUUID();
  localStorage.setItem("userId", newUserId);
  return newUserId;
};

export const syncData = {
  async saveTodos(todos, dailyStats) {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase.from("todos").upsert(
        {
          user_id: userId,
          todos: todos,
          daily_stats: dailyStats,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving todos:", error);
      throw error;
    }
  },

  async getTodos() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("todos")
        .select("todos, daily_stats")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return {
        todos: data?.todos || [],
        dailyStats: data?.daily_stats || {
          totalTasks: 0,
          completedTasks: 0,
          lastResetDate: new Date().toDateString(),
          lastPercentage: 0,
        },
      };
    } catch (error) {
      console.error("Error getting todos:", error);
      return {
        todos: [],
        dailyStats: {
          totalTasks: 0,
          completedTasks: 0,
          lastResetDate: new Date().toDateString(),
          lastPercentage: 0,
        },
      };
    }
  },

  async saveTimeTracker(
    timeData,
    totalTime,
    dailyHistory,
    lifeTimeData,
    lastResetDate,
    weekData,
    monthData
  ) {
    const userId = generateUserId();
    await supabase.from("time_tracker").upsert(
      {
        user_id: userId,
        time_data: timeData,
        total_time: totalTime,
        daily_history: dailyHistory,
        life_time_data: lifeTimeData,
        last_reset_date: lastResetDate || new Date().toDateString(),
        week_data: weekData,
        month_data: monthData,
      },
      { onConflict: "user_id" }
    );
  },

  async getTimeTracker() {
    const userId = generateUserId();
    const { data } = await supabase
      .from("time_tracker")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data || null;
  },

  async saveDailyGoal(dailyGoal) {
    const userId = generateUserId();
    // Ensure user exists in users table before saving to user_settings
    await supabase.from("users").upsert({
      user_id: userId,
      name: userId, // or use a better name if available
    });
    await supabase.from("user_settings").upsert({
      user_id: userId,
      daily_goal: dailyGoal,
    });
  },

  async getDailyGoal() {
    const userId = generateUserId();
    const { data } = await supabase
      .from("user_settings")
      .select("daily_goal")
      .eq("user_id", userId)
      .single();
    return data?.daily_goal || null;
  },

  subscribeToTodos(callback) {
    const userId = generateUserId();
    return supabase
      .channel("todos_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback({
            todos: payload.new?.todos || [],
            daily_stats: payload.new?.daily_stats,
          });
        }
      )
      .subscribe();
  },

  subscribeToTimeTracker(callback) {
    const userId = generateUserId();
    return supabase
      .channel("timetracker_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_tracker",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new || null)
      )
      .subscribe();
  },

  async getRandomBackground() {
    try {
      const response = await fetch(
        "https://api.unsplash.com/photos/random?" +
          new URLSearchParams({
            query:
              "nature,landscape,village,study,university,library,school,college,motivation,success,work,productivity,focus,hardwork,inspiration,forrest",
            orientation: "landscape",
            content_filter: "high",
            w: "3840",
            h: "2160",
            fit: "max",
            q: "100",
          }),
        {
          headers: {
            Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }

      const data = await response.json();
      return {
        imageUrl: data.urls.raw + "?q=100&w=3840&h=2160&fit=max",
        credit: {
          name: data.user.name,
          link: data.user.links.html,
          unsplashLink: data.links.html,
        },
      };
    } catch (error) {
      console.error("Error fetching background:", error);
      return {
        imageUrl:
          "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=3840&h=2160&q=100&fit=max",
        credit: {
          name: "Unsplash",
          link: "https://unsplash.com",
          unsplashLink: "https://unsplash.com",
        },
      };
    }
  },

  async getUserLabels() {
    try {
      const userId = generateUserId();
      const { data, error } = await supabase
        .from("user_labels")
        .select("labels")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return ["Study", "Programming"];
    } catch (error) {
      console.error("Error getting user labels:", error);
      return ["Study", "Programming"];
    }
  },
};
