import { create } from 'zustand';

// API Base URL
const API_URL = 'http://localhost:8000/api';

export interface Hunter {
  id: number;
  email: string;
  name: string;
  avatar: string;
  class_name: string;
  level: number;
  xp: number;
  gold: number;
  rank: string;
  streak: number;
  joined_at: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  type: 'MAIN' | 'DAILY' | 'RECOVERY' | 'BOSS';
  xp_reward: number;
  gold_reward: number;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'LOCKED';
  due_date: string;
  week_number?: number;
  content: any;
}

export interface ChatMessage {
  id: number;
  sender: 'USER' | 'SYSTEM';
  message: string;
  timestamp: string;
}

export interface ShopItem {
  id: number;
  title: string;
  description: string;
  cost_gold: number;
  category: 'CHEAT_SHEET' | 'MIND_MAP' | 'HINTS' | 'INTERVIEW';
  content_data: string;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  read: boolean;
  type: string;
  created_at: string;
}

interface AppState {
  user: Hunter | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  roadmap: Quest[];
  dailies: Quest[];
  chatHistory: ChatMessage[];
  bossBattle: Quest | null;
  
  // New States
  notifications: Notification[];
  shopItems: ShopItem[];
  purchases: ShopItem[];
  interviewHistory: ChatMessage[];
  resumeAnalysis: any;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  initializeGoal: (answersText: string) => Promise<boolean>;
  fetchRoadmap: () => Promise<void>;
  fetchDailies: () => Promise<void>;
  completeQuest: (questId: number) => Promise<void>;
  logStudySession: (minutes: number, distractions: number, focusScore: number) => Promise<any>;
  sendMessage: (message: string) => Promise<string>;
  fetchChatHistory: () => Promise<void>;
  uploadDocument: (file: File) => Promise<boolean>;
  fetchBossChallenge: () => Promise<void>;
  submitBossSolution: (questId: number, code: string) => Promise<any>;

  // New Actions
  fetchNotifications: () => Promise<void>;
  readNotification: (id: number) => Promise<void>;
  fetchShopItems: () => Promise<void>;
  buyShopItem: (itemId: number) => Promise<boolean>;
  fetchPurchases: () => Promise<void>;
  fetchJobChoices: () => Promise<any[]>;
  challengeJobChange: (classChoice: string) => Promise<any>;
  analyzeResume: (resumeText: string) => Promise<any>;
  sendInterviewMessage: (message: string) => Promise<any>;
  resetInterview: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  // Helper for auth headers
  const getHeaders = (): Record<string, string> => {
    const token = get().token;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Helper to handle offline XP / Gold gains and local level-ups
  const localGainRewards = (xpGain: number, goldGain: number) => {
    const current = get().user;
    if (!current) return;

    let xp = current.xp + xpGain;
    let gold = current.gold + goldGain;
    let level = current.level;
    let levelUp = false;

    while (xp >= (level * 1000)) {
      xp -= (level * 1000);
      level += 1;
      levelUp = true;
    }

    let rank = current.rank;
    if (level >= 80) rank = 'S Rank';
    else if (level >= 50) rank = 'A Rank';
    else if (level >= 30) rank = 'B Rank';
    else if (level >= 15) rank = 'C Rank';
    else if (level >= 5) rank = 'D Rank';
    else rank = 'E Rank';

    set({
      user: {
        ...current,
        xp,
        gold,
        level,
        rank
      }
    });

    if (levelUp) {
      // Trigger a notification or custom state if desired
      console.log("CONGRATULATIONS HUNTER! LEVEL UP!");
    }
  };

  return {
    user: null,
    token: localStorage.getItem('questdemics_token'),
    isAuthenticated: !!localStorage.getItem('questdemics_token'),
    isLoading: false,
    error: null,
    roadmap: [],
    dailies: [],
    chatHistory: [],
    bossBattle: null,
    notifications: [],
    shopItems: [],
    purchases: [],
    interviewHistory: [],
    resumeAnalysis: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('questdemics_token', data.access_token);
        set({ token: data.access_token, isAuthenticated: true });
        
        await get().fetchProfile();
        set({ isLoading: false });
        return true;
      } catch (err: any) {
        // Fallback to Mock login if backend is unavailable
        console.warn("Backend unavailable. Logging in with MOCK credentials.", err.message);
        
        const mockUser: Hunter = {
          id: 1,
          email,
          name: email.split('@')[0].toUpperCase() || "HUNTER",
          avatar: "hunter_default",
          class_name: "Novice Generalist",
          level: 3,
          xp: 450,
          gold: 240,
          rank: "E Rank",
          streak: 4,
          joined_at: new Date().toISOString(),
        };
        
        localStorage.setItem('questdemics_token', 'mock_jwt_token_123');
        set({
          token: 'mock_jwt_token_123',
          isAuthenticated: true,
          user: mockUser,
          isLoading: false
        });
        return true;
      }
    },

    register: async (email, password, name) => {
      set({ isLoading: true, error: null });
      try {
        const response = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Registration failed');
        }

        // Auto login after successful register
        const success = await get().login(email, password);
        set({ isLoading: false });
        return success;
      } catch (err: any) {
        console.warn("Backend registration unavailable. Registering MOCK user locally.", err.message);
        
        const mockUser: Hunter = {
          id: 1,
          email,
          name,
          avatar: "hunter_default",
          class_name: "Novice Generalist",
          level: 1,
          xp: 0,
          gold: 0,
          rank: "E Rank",
          streak: 1,
          joined_at: new Date().toISOString(),
        };

        localStorage.setItem('questdemics_token', 'mock_jwt_token_123');
        set({
          token: 'mock_jwt_token_123',
          isAuthenticated: true,
          user: mockUser,
          isLoading: false
        });
        return true;
      }
    },

    logout: () => {
      localStorage.removeItem('questdemics_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        roadmap: [],
        dailies: [],
        chatHistory: [],
        bossBattle: null
      });
    },

    fetchProfile: async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: getHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          set({ user: data, isAuthenticated: true });
        } else if (response.status === 401) {
          get().logout();
        }
      } catch (err) {
        console.warn("Unable to fetch backend profile. Running in local state mode.");
        if (!get().user) {
          const mockUser: Hunter = {
            id: 1,
            email: "hunter@system.org",
            name: "HUNTER",
            avatar: "hunter_default",
            class_name: "Novice Generalist",
            level: 3,
            xp: 450,
            gold: 240,
            rank: "E Rank",
            streak: 4,
            joined_at: new Date().toISOString(),
          };
          set({ user: mockUser, isAuthenticated: true });
        }
      }
    },

    initializeGoal: async (answersText) => {
      set({ isLoading: true });
      try {
        const response = await fetch(`${API_URL}/quests/initialize`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers_text: answersText }),
        });

        if (!response.ok) throw new Error('Goal initialization failed');
        
        // Refresh profile and quests
        await get().fetchProfile();
        await get().fetchRoadmap();
        await get().fetchDailies();
        
        set({ isLoading: false });
        return true;
      } catch (err) {
        console.warn("Failed backend goal initialization. Creating mock roadmap locally.");
        
        // Setup local Mock Main Quest Roadmap
        const mockRoadmap: Quest[] = [
          {
            id: 101,
            title: "Week 1: Python Core & Algorithmic Thinking",
            description: "Build an automated scripts collector and master basic data structures",
            type: "MAIN",
            xp_reward: 1000,
            gold_reward: 400,
            status: "ACTIVE",
            due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
            week_number: 1,
            content: {
              topics: ["Python Syntax", "Loops and Functions", "Data Structures (List, Dict)", "Time Complexity"],
              videos: ["Python Beginners Masterclass", "Big O Notation Explained"],
              project: "Script that parses server log files for error alerts",
              quiz_topics: ["Dictionary lookups", "Big O notation"]
            }
          },
          {
            id: 102,
            title: "Week 2: Advanced OOP & API Architectures",
            description: "Understand classes, interfaces, and construct a RESTful API using FastAPI",
            type: "MAIN",
            xp_reward: 1000,
            gold_reward: 400,
            status: "LOCKED",
            due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
            week_number: 2,
            content: {
              topics: ["Classes and Inheritance", "Decorators & Generators", "FastAPI setup", "HTTP verbs"],
              project: "REST API for a digital inventory management system",
              quiz_topics: ["Python generators", "HTTP status codes"]
            }
          },
          {
            id: 103,
            title: "Week 3: Database Integrations & SQLModel",
            description: "Implement database migrations and secure routes using JWT authentication",
            type: "MAIN",
            xp_reward: 1000,
            gold_reward: 400,
            status: "LOCKED",
            due_date: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
            week_number: 3,
            content: {
              topics: ["Relational Databases", "SQLModel/SQLAlchemy", "JWT verification", "Hashing secrets"],
              project: "Database-connected API with JWT login credentials",
              quiz_topics: ["SQL joins", "JWT header payloads"]
            }
          },
          {
            id: 104,
            title: "Week 4: AI Vector Embeddings & RAG Systems",
            description: "Conquer GenAI deployment by constructing a chatbot indexed with reference documents",
            type: "MAIN",
            xp_reward: 1000,
            gold_reward: 400,
            status: "LOCKED",
            due_date: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
            week_number: 4,
            content: {
              topics: ["Generative AI basics", "Gemini API integrations", "Vector search math", "Prompt pipelines"],
              project: "Deploy a RAG chatbot to Vercel/Railway",
              quiz_topics: ["Vector similarity", "Prompt injection safeguards"]
            }
          }
        ];

        // Setup local Mock Dailies
        const mockDailies: Quest[] = [
          {
            id: 201,
            title: "Daily Practice: Variable Scopes",
            description: "Read a short concept summary and explain variable scope differences.",
            type: "DAILY",
            xp_reward: 50,
            gold_reward: 20,
            status: "ACTIVE",
            due_date: new Date().toISOString(),
            content: {
              summary: "Variables defined inside a function belong to that local scope and cannot be accessed globally unless specified using global tags. Always practice keeping variables isolated to prevent side effects.",
              link: "https://docs.python.org/3/tutorial/controlflow.html"
            }
          },
          {
            id: 202,
            title: "Daily Assessment: Scope MCQ",
            description: "Solve a 3-question mini-quiz to test your understanding of variable bounds.",
            type: "DAILY",
            xp_reward: 100,
            gold_reward: 40,
            status: "ACTIVE",
            due_date: new Date().toISOString(),
            content: {
              questions: [
                {
                  id: 1,
                  type: "MCQ",
                  question: "What keyword allows a local variable to edit a global scope variable?",
                  options: ["local", "global", "nonlocal", "self"],
                  answer: "global",
                  explanation: "The global keyword overrides scoping parameters allowing local assignments to mutate variables at the module root level."
                },
                {
                  id: 2,
                  type: "TRUE_FALSE",
                  question: "True or False: Nested functions can read variables from their parent enclosing function.",
                  options: ["True", "False"],
                  answer: "True",
                  explanation: "Nested functions have closure permissions allowing them to read enclosing bounds variables."
                },
                {
                  id: 3,
                  type: "MCQ",
                  question: "Which keyword references variables in the nearest outer enclosing scope that is not global?",
                  options: ["global", "nonlocal", "enclosed", "outer"],
                  answer: "nonlocal",
                  explanation: "The nonlocal keyword binds names to variables in outer enclosing parent functions, skipping the global boundary."
                }
              ]
            }
          },
          {
            id: 203,
            title: "Daily Practice: Scoping Code",
            description: "Implement a closure function in Python representing a counter.",
            type: "DAILY",
            xp_reward: 150,
            gold_reward: 60,
            status: "ACTIVE",
            due_date: new Date().toISOString(),
            content: {
              prompt: "Write a function make_counter() that returns a closure. Each call to the returned function should increment and return a local count variable."
            }
          }
        ];

        set({
          roadmap: mockRoadmap,
          dailies: mockDailies,
          isLoading: false
        });
        return true;
      }
    },

    fetchRoadmap: async () => {
      try {
        const response = await fetch(`${API_URL}/quests/roadmap`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ roadmap: data });
      } catch (err) {
        console.warn("Unable to fetch roadmap from backend. Using local state.");
        if (get().roadmap.length === 0) {
          const mockRoadmap: Quest[] = [
            {
              id: 101,
              title: "Week 1: Python Core & Algorithmic Thinking",
              description: "Build an automated scripts collector and master data structures",
              type: "MAIN",
              xp_reward: 1000,
              gold_reward: 400,
              status: "ACTIVE",
              due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
              week_number: 1,
              content: {
                topics: ["Python Syntax", "Loops and Functions", "Data Structures (List, Dict)", "Time Complexity"],
                videos: ["Python Beginners Masterclass", "Big O Notation Explained"],
                project: "Script that parses server log files for error alerts",
                quiz_topics: ["Dictionary lookups", "Big O notation"]
              }
            },
            {
              id: 102,
              title: "Week 2: Advanced OOP & API Architectures",
              description: "Understand classes, interfaces, and construct a RESTful API using FastAPI",
              type: "MAIN",
              xp_reward: 1000,
              gold_reward: 400,
              status: "LOCKED",
              due_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
              week_number: 2,
              content: {
                topics: ["Classes and Inheritance", "Decorators & Generators", "FastAPI setup", "HTTP verbs"],
                project: "REST API for a digital inventory management system",
                quiz_topics: ["Python generators", "HTTP status codes"]
              }
            }
          ];
          set({ roadmap: mockRoadmap });
        }
      }
    },

    fetchDailies: async () => {
      try {
        const response = await fetch(`${API_URL}/quests/daily`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ dailies: data });
      } catch (err) {
        console.warn("Unable to fetch dailies from backend. Using local state.");
        if (get().dailies.length === 0) {
          const mockDailies: Quest[] = [
            {
              id: 201,
              title: "Daily Practice: Variable Scopes",
              description: "Read a short concept summary and explain variable scope differences.",
              type: "DAILY",
              xp_reward: 50,
              gold_reward: 20,
              status: "ACTIVE",
              due_date: new Date().toISOString(),
              content: {
                summary: "Variables defined inside a function belong to that local scope and cannot be accessed globally unless specified using global tags. Always practice keeping variables isolated to prevent side effects.",
                link: "https://docs.python.org/3/tutorial/controlflow.html"
              }
            },
            {
              id: 202,
              title: "Daily Assessment: Scope MCQ",
              description: "Solve a 3-question mini-quiz to test your understanding of variable bounds.",
              type: "DAILY",
              xp_reward: 100,
              gold_reward: 40,
              status: "ACTIVE",
              due_date: new Date().toISOString(),
              content: {
                questions: [
                  {
                    id: 1,
                    type: "MCQ",
                    question: "What keyword allows a local variable to edit a global scope variable?",
                    options: ["local", "global", "nonlocal", "self"],
                    answer: "global",
                    explanation: "The global keyword overrides scoping parameters allowing local assignments to mutate variables at the module root level."
                  }
                ]
              }
            }
          ];
          set({ dailies: mockDailies });
        }
      }
    },

    completeQuest: async (questId) => {
      try {
        const response = await fetch(`${API_URL}/quests/daily/${questId}/complete`, {
          method: 'POST',
          headers: getHeaders(),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update user profile with backend values
          if (data.progression) {
            set((state) => ({
              user: {
                ...state.user!,
                xp: data.progression.xp,
                gold: data.progression.gold,
                level: data.progression.level,
                rank: data.progression.rank,
              }
            }));
          }
          // Mark as completed locally
          set((state) => ({
            dailies: state.dailies.map(q => q.id === questId ? { ...q, status: 'COMPLETED' as const } : q)
          }));
        } else {
          throw new Error();
        }
      } catch (err) {
        console.warn("Failed backend quest completion. Completing locally.");
        const quest = get().dailies.find(q => q.id === questId);
        if (quest) {
          localGainRewards(quest.xp_reward, quest.gold_reward);
          set((state) => ({
            dailies: state.dailies.map(q => q.id === questId ? { ...q, status: 'COMPLETED' as const } : q)
          }));
        }
      }
    },

    logStudySession: async (minutes, distractions, focusScore) => {
      try {
        const response = await fetch(`${API_URL}/study/session`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            duration_minutes: minutes,
            distractions,
            focus_score: focusScore,
          }),
        });

        if (!response.ok) throw new Error();
        const data = await response.json();
        
        if (data.progression) {
          set((state) => ({
            user: {
              ...state.user!,
              xp: data.progression.xp,
              gold: data.progression.gold,
              level: data.progression.level,
              rank: data.progression.rank,
            }
          }));
        }
        return data;
      } catch (err) {
        console.warn("Failed to log study session on backend. Simulating locally.");
        const xpEarned = minutes * 8;
        const goldEarned = minutes * 2;
        localGainRewards(xpEarned, goldEarned);
        return {
          xp_earned: xpEarned,
          gold_earned: goldEarned,
          fatigue_lock: false
        };
      }
    },

    sendMessage: async (message) => {
      // Optimistic local update
      const userMsg: ChatMessage = {
        id: Date.now(),
        sender: 'USER',
        message,
        timestamp: new Date().toISOString()
      };
      
      set((state) => ({
        chatHistory: [...state.chatHistory, userMsg]
      }));

      try {
        const response = await fetch(`${API_URL}/tutor/chat`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error();
        const data = await response.json();
        
        const systemMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'SYSTEM',
          message: data.reply,
          timestamp: data.timestamp
        };
        
        set((state) => ({
          chatHistory: [...state.chatHistory, systemMsg]
        }));
        
        return data.reply;
      } catch (err) {
        console.warn("Backend chat unavailable. Generating simulated reply.");
        const simulatedReply = `Hunter! I have analyzed your query about "${message}". Remember that consistency is key. We must focus on applying your skills in a practical Boss Battle rather than getting caught in passive tutorial loops. Shall we launch the next quest?`;
        
        const systemMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'SYSTEM',
          message: simulatedReply,
          timestamp: new Date().toISOString()
        };
        
        set((state) => ({
          chatHistory: [...state.chatHistory, systemMsg]
        }));
        
        return simulatedReply;
      }
    },

    fetchChatHistory: async () => {
      try {
        const response = await fetch(`${API_URL}/tutor/chat/history`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ chatHistory: data });
      } catch (err) {
        console.warn("Unable to fetch chat history. Utilizing local messages.");
      }
    },

    uploadDocument: async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_URL}/tutor/upload`, {
          method: 'POST',
          headers: getHeaders(),
          body: formData
        });
        
        return response.ok;
      } catch (err) {
        console.warn("RAG upload failed on backend. Simulating local file index.");
        return true;
      }
    },

    fetchBossChallenge: async () => {
      try {
        const response = await fetch(`${API_URL}/boss/challenge`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ bossBattle: data });
      } catch (err) {
        console.warn("Unable to fetch Boss Battle from backend. Generating simulated Battle locally.");
        const mockBoss: Quest = {
          id: 999,
          title: "Boss Battle: Deploy a Relational REST API",
          description: "A legendary assessment. You must construct a validated REST API with SQLModel database connections and secure JWT authentication. Time is ticking.",
          type: "BOSS",
          xp_reward: 3000,
          gold_reward: 1000,
          status: "ACTIVE",
          due_date: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          content: {
            requirements: [
              "Establish local database connections using standard packages",
              "Hash passwords using bcrypt",
              "Implement verification middleware checks",
              "Deploy endpoints with Pydantic validation"
            ]
          }
        };
        set({ bossBattle: mockBoss });
      }
    },

    submitBossSolution: async (questId, code) => {
      try {
        const response = await fetch(`${API_URL}/boss/submit`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quest_id: questId,
            solution_code: code
          })
        });
        
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        if (data.progression) {
          set((state) => ({
            user: {
              ...state.user!,
              xp: data.progression.xp,
              gold: data.progression.gold,
              level: data.progression.level,
              rank: data.progression.rank,
            }
          }));
        }
        
        if (data.passed) {
          set((state) => ({
            bossBattle: state.bossBattle ? { ...state.bossBattle, status: 'COMPLETED' as const } : null
          }));
        }
        
        return data;
      } catch (err) {
        console.warn("Failed to evaluate Boss Battle on backend. Evaluating locally.");
        // Mock successful evaluation
        const xpEarned = 3000;
        const goldEarned = 1000;
        localGainRewards(xpEarned, goldEarned);
        
        set((state) => ({
          bossBattle: state.bossBattle ? { ...state.bossBattle, status: 'COMPLETED' as const } : null
        }));
        
        return {
          passed: true,
          score: 88,
          feedback: "Local Simulation: Your solution exhibits robust structure! Secure validation is complete. You have conquered the Boss and attained Level/Rank increases.",
          xp_earned: xpEarned,
          gold_earned: goldEarned
        };
      }
    },

    fetchNotifications: async () => {
      try {
        const response = await fetch(`${API_URL}/auth/notifications`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ notifications: data });
      } catch (err) {
        console.warn("Unable to fetch notifications from backend. Using local state.");
        // Mock fallback if empty
        if (get().notifications.length === 0) {
          const mockNotifs: Notification[] = [
            {
              id: 1,
              user_id: 1,
              message: "System initialized. Welcome Hunter. Begin your journey.",
              read: false,
              type: "INFO",
              created_at: new Date().toISOString()
            }
          ];
          set({ notifications: mockNotifs });
        }
      }
    },

    readNotification: async (id) => {
      try {
        const response = await fetch(`${API_URL}/auth/notifications/${id}/read`, {
          method: 'POST',
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
      } catch (err) {
        console.warn("Failed backend read-notification. Marking locally.");
        set((state) => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
      }
    },

    fetchShopItems: async () => {
      try {
        const response = await fetch(`${API_URL}/quests/shop/items`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ shopItems: data });
      } catch (err) {
        console.warn("Unable to fetch shop items from backend. Using mock shop items.");
        const mockShop: ShopItem[] = [
          {
            id: 1,
            title: "FastAPI Master Cheat Sheet",
            description: "Ultimate reference sheet for fast request handling, dependency injection, and Pydantic validation.",
            cost_gold: 100,
            category: "CHEAT_SHEET",
            content_data: JSON.stringify({
              type: "text",
              data: "## FastAPI Cheat Sheet\n\n### 1. Request Handling\n```python\n@app.get('/items/{item_id}')\ndef read_item(item_id: int, q: Optional[str] = None):\n    return {'item_id': item_id, 'q': q}\n```\n\n### 2. Dependency Injection\n```python\nfrom fastapi import Depends\ndef get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()\n```"
            })
          },
          {
            id: 2,
            title: "Relational DB Mind Map",
            description: "Visual breakdown of schemas, 1-to-N relationships, indexes, and performance queries.",
            cost_gold: 150,
            category: "MIND_MAP",
            content_data: JSON.stringify({
              type: "text",
              data: "## Database Mind Map\n\n* Relational Database (SQL)\n  * Schemas & Tables\n  * Primary & Foreign Keys\n  * Normalization (1NF, 2NF, 3NF)\n  * Performance\n    * Indexes (B-Trees)\n    * Query Optimization (EXPLAIN ANALYZE)\n    * Connection Pooling"
            })
          },
          {
            id: 3,
            title: "System Design Interview Hints",
            description: "Key checklists and architectural patterns for scaling systems to millions of users.",
            cost_gold: 200,
            category: "HINTS",
            content_data: JSON.stringify({
              type: "text",
              data: "## System Design Interview Hints\n\n1. **Always start with requirements clarification** (Scale, load, read vs write ratio).\n2. **High-Level Design**: Client -> DNS -> Load Balancer -> Web App -> Cache -> DB.\n3. **Scaling Strategy**:\n   * Horizontal scaling (add more instances)\n   * Caching (Redis/Memcached) for data\n   * Database Sharding or Read Replicas"
            })
          }
        ];
        set({ shopItems: mockShop });
      }
    },

    buyShopItem: async (itemId) => {
      try {
        const response = await fetch(`${API_URL}/quests/shop/buy`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ item_id: itemId })
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Purchase failed');
        }
        
        await get().fetchProfile();
        await get().fetchPurchases();
        return true;
      } catch (err: any) {
        console.warn("Failed backend purchase. Processing locally.", err.message);
        const item = get().shopItems.find(i => i.id === itemId);
        const user = get().user;
        if (!item || !user) return false;
        if (user.gold < item.cost_gold) {
          alert("Insufficient gold!");
          return false;
        }
        if (get().purchases.some(p => p.id === itemId)) {
          alert("Item already purchased!");
          return false;
        }
        // Deduct gold and add purchase locally
        set((state) => ({
          user: { ...state.user!, gold: state.user!.gold - item.cost_gold },
          purchases: [...state.purchases, item]
        }));
        
        // Add a local notification
        const localNotif: Notification = {
          id: Date.now(),
          user_id: user.id,
          message: `Local Purchase successful! Unlocked '${item.title}' for ${item.cost_gold} Gold.`,
          read: false,
          type: "SUCCESS",
          created_at: new Date().toISOString()
        };
        set((state) => ({
          notifications: [localNotif, ...state.notifications]
        }));
        return true;
      }
    },

    fetchPurchases: async () => {
      try {
        const response = await fetch(`${API_URL}/quests/shop/purchases`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ purchases: data });
      } catch (err) {
        console.warn("Unable to fetch purchases from backend. Using local state.");
      }
    },

    fetchJobChoices: async () => {
      try {
        const response = await fetch(`${API_URL}/boss/job-change/choices`, {
          headers: getHeaders(),
        });
        if (!response.ok) throw new Error();
        return await response.json();
      } catch (err) {
        console.warn("Unable to fetch job choices from backend. Using local mock choices.");
        return [
          {
            "class_name": "Machine Learning Engineer",
            "description": "Master data processing, model training, neural networks, and deploying LLM applications.",
            "difficulty": "Hard"
          },
          {
            "class_name": "DevOps Engineer",
            "description": "Master cloud networking, secure IAM identities, compute structures, and serverless architectures.",
            "difficulty": "Hard"
          },
          {
            "class_name": "Fullstack Web Developer",
            "description": "Master React functional components, custom hooks, global state, router paths, and Vite configs.",
            "difficulty": "Medium"
          },
          {
            "class_name": "Security Specialist",
            "description": "Master penetration testing, JWT authentication pipelines, password hashing, and API gateway filters.",
            "difficulty": "Hard"
          }
        ];
      }
    },

    challengeJobChange: async (classChoice) => {
      try {
        const response = await fetch(`${API_URL}/boss/job-change/challenge`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ class_choice: classChoice })
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ bossBattle: data });
        return data;
      } catch (err) {
        console.warn("Failed backend job change challenge. Simulating locally.");
        const mockBoss: Quest = {
          id: 888,
          title: `Class Awakening: ${classChoice}`,
          description: `Trial of the ${classChoice}. Build a production-grade containerized service matching advanced specs to awaken.`,
          type: "BOSS",
          xp_reward: 3500,
          gold_reward: 1200,
          status: "ACTIVE",
          due_date: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
          content: {
            is_job_change: true,
            target_class: classChoice,
            requirements: [
              "Implement robust fault-tolerant exception recovery blocks",
              "Verify correct environment payload security settings",
              "Optimize query execution metrics"
            ]
          }
        };
        set({ bossBattle: mockBoss });
        return mockBoss;
      }
    },

    analyzeResume: async (resumeText) => {
      try {
        const response = await fetch(`${API_URL}/tutor/coach/resume`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ resume_text: resumeText })
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        set({ resumeAnalysis: data });
        return data;
      } catch (err) {
        console.warn("Backend resume analysis failed. Utilizing simulation model.");
        const data = {
          critique: "### Critique\n* **Quantifiable Metrics:** Most bullet points list responsibilities rather than achievements. Use the Google X-Y-Z formula.\n* **Formatting:** Group technologies under specific headers.\n* **ATS Optimization:** Missing cloud/networking keywords.",
          projects: [
            {
              title: "High-Throughput Log Streaming Agent",
              description: "Construct a background daemon in Go/Python that tails log files, processes them, and streams structured JSON data to a central search engine."
            },
            {
              title: "OAuth2 Auth Server & Gateway",
              description: "Develop a standalone authentication service issuing custom JWT credentials with token auto-rotation and rate-limiting."
            }
          ],
          salary_stats: {
            average: "$118,000",
            range: "$90,000 - $160,000"
          }
        };
        set({ resumeAnalysis: data });
        return data;
      }
    },

    sendInterviewMessage: async (message) => {
      // Optimistic local update of history
      const userMsg: ChatMessage = {
        id: Date.now(),
        sender: 'USER',
        message,
        timestamp: new Date().toISOString()
      };
      set((state) => ({
        interviewHistory: [...state.interviewHistory, userMsg]
      }));

      try {
        // Prepare chat history payload
        const historyPayload = get().interviewHistory.slice(0, -1).map(h => ({
          sender: h.sender,
          message: h.message
        }));

        const response = await fetch(`${API_URL}/tutor/coach/interview`, {
          method: 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            chat_history: historyPayload
          })
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        
        const coachMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'SYSTEM',
          message: `${data.feedback ? `*System Feedback: ${data.feedback}*\n\n` : ''}${data.next_question}`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          interviewHistory: [...state.interviewHistory, coachMsg]
        }));
        return data;
      } catch (err) {
        console.warn("Backend interview loop failed. Generating simulated reply.");
        const simulatedQuestion = message === "start"
          ? "Describe a time when you had to debug a complex production performance issue. What was your approach, and how did you resolve it?"
          : "Next question: How would you design a caching strategy for a high-read API endpoint that has frequent small updates?";
          
        const simulatedFeedback = message === "start"
          ? ""
          : "Your response highlights good isolation skills, but could benefit from explaining how you measured the CPU/memory impact of the bug (e.g. using profiling tools).";
          
        const coachMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'SYSTEM',
          message: `${simulatedFeedback ? `*System Feedback: ${simulatedFeedback}*\n\n` : ''}${simulatedQuestion}`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          interviewHistory: [...state.interviewHistory, coachMsg]
        }));
        return { feedback: simulatedFeedback, next_question: simulatedQuestion };
      }
    },

    resetInterview: () => {
      set({ interviewHistory: [] });
    }
  };
});
