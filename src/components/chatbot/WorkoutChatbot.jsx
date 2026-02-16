import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { PAIN_TREE, VIDEO_LIBRARY } from '../../data/painTreeData';

const TREE = {
  // Access screen entry - simple help for new users
  access_entry: {
    message: "Hey {name}! Welcome to the Workout Tracker. How can I help?",
    options: [
      { label: "How do I use this?", next: "access_help" },
      { label: "I don't have an access code", next: "no_code" },
      { label: "What are 1RM values?", next: "one_rm_help" },
      { label: "Just browsing!", next: "access_browse" }
    ]
  },
  access_help: {
    message: "It's simple! 1) If you're new, enter your name, email, and access code from your trainer. 2) If you're returning, just enter your email and code. 3) Optionally enter your 1RM values so your trainer can calculate percentages for you.",
    options: [
      { label: "What's an access code?", next: "no_code" },
      { label: "What are 1RM values?", next: "one_rm_help" },
      { label: "Thanks!", next: "access_entry" }
    ]
  },
  no_code: {
    message: "Your access code is a unique code your trainer gives you after building your program. It looks like XXXXX-XXXXX. If you don't have one, ask your trainer to create a program for you in the Workout Builder!",
    options: [
      { label: "Got it, thanks!", next: "access_entry" }
    ]
  },
  one_rm_help: {
    message: "1RM stands for One Rep Max \u2014 the heaviest weight you can lift for one rep. Your trainer uses these to calculate your working weights (e.g., 75% of your bench max). Common ones: Bench Press, Squat, Deadlift, and Power Clean. If you don't know yours, leave them blank!",
    options: [
      { label: "How do I find my 1RM?", next: "find_one_rm" },
      { label: "Thanks!", next: "access_entry" }
    ]
  },
  find_one_rm: {
    message: "You can estimate your 1RM by doing a heavy set of 3-5 reps and using a calculator. Or your trainer can test you! A rough formula: Weight \u00d7 Reps \u00d7 0.0333 + Weight = estimated 1RM. Example: 185 lbs \u00d7 5 reps \u00d7 0.0333 + 185 = ~216 lbs.",
    options: [
      { label: "Good to know!", next: "access_entry" }
    ]
  },
  access_browse: {
    message: "No worries! When you're ready, enter your info above and hit Load My Program. Your trainer has a whole workout waiting for you! \ud83d\udcaa",
    options: [
      { label: "Sounds good!", next: "access_entry" }
    ]
  },
  // Program screen entry - full helper mode
  entry: {
    message: "Hey {name}, I'm here to help! What's going on?",
    options: [
      { label: "I'm feeling pain/discomfort", next: "pain_intro" },
      { label: "Let's talk training", next: "coaching_menu" },
      { label: "How do I use this tracker?", next: "tracker_help" },
      { label: "I need motivation", next: "motivation" },
      { label: "I'm traveling!", next: "travel_intro" },
      { label: "Just saying hi!", next: "checkin" }
    ]
  },
  // Travel workout nodes
  travel_intro: {
    message: "No problem! I've got travel workouts ready for you. How many days will you need workouts for?",
    options: [
      { label: "1 day", next: "travel_equipment_1" },
      { label: "2 days", next: "travel_equipment_2" },
      { label: "3 days", next: "travel_equipment_3" },
      { label: "\u2190 Back", next: "entry" }
    ]
  },
  travel_equipment_1: {
    message: "Got it \u2014 1 day! What equipment do you have access to?",
    options: [
      { label: "Bodyweight only", next: "travel_load_bw_1" },
      { label: "Hotel gym", next: "travel_load_hg_1" },
      { label: "\u2190 Back", next: "travel_intro" }
    ]
  },
  travel_equipment_2: {
    message: "Nice \u2014 2 days! What equipment do you have access to?",
    options: [
      { label: "Bodyweight only", next: "travel_load_bw_2" },
      { label: "Hotel gym", next: "travel_load_hg_2" },
      { label: "\u2190 Back", next: "travel_intro" }
    ]
  },
  travel_equipment_3: {
    message: "Awesome \u2014 3 days! What equipment do you have access to?",
    options: [
      { label: "Bodyweight only", next: "travel_load_bw_3" },
      { label: "Hotel gym", next: "travel_load_hg_3" },
      { label: "\u2190 Back", next: "travel_intro" }
    ]
  },
  travel_load_bw_1: { message: "Loading your bodyweight travel workout...", options: [] },
  travel_load_bw_2: { message: "Loading your bodyweight travel workouts...", options: [] },
  travel_load_bw_3: { message: "Loading your bodyweight travel workouts...", options: [] },
  travel_load_hg_1: { message: "Loading your hotel gym travel workout...", options: [] },
  travel_load_hg_2: { message: "Loading your hotel gym travel workouts...", options: [] },
  travel_load_hg_3: { message: "Loading your hotel gym travel workouts...", options: [] },
  travel_loaded: {
    message: "Your travel workout is loaded! Close this chat and start training. When you're done, hit 'Log Workout' as usual. Come back here if you need more days!",
    options: [
      { label: "Thanks!", next: "entry" }
    ]
  },
  travel_error: {
    message: "Sorry, I couldn't load travel workouts. Your trainer may not have created any yet. Ask them to build some in the Workout Builder!",
    options: [
      { label: "OK, thanks", next: "entry" }
    ]
  },
  // Pain tree nodes are merged from PAIN_TREE (painTreeData.js)
  ...PAIN_TREE,
  recovery_tips: {
    message: "Great recovery tips: 1) Sleep 7-9 hours, 2) Drink water throughout the day, 3) Eat protein within 2 hours of training, 4) Light movement on rest days (walking, stretching), 5) Foam roll sore areas.",
    options: [{ label: "Thanks!", next: "entry" }, { label: "Back to menu", next: "entry" }]
  },
  coaching_menu: {
    message: "Let's talk training! What's on your mind?",
    options: [
      { label: "Mindset & motivation", next: "mindset" },
      { label: "Nutrition talk", next: "nutrition" },
      { label: "Training tips", next: "training_tips" },
      { label: "Recovery & sleep", next: "recovery_tips" },
      { label: "\u2190 Back", next: "entry" }
    ]
  },
  mindset: {
    message: "Your mindset is your greatest tool! Remember: consistency beats intensity. Showing up when you don't feel like it builds more than just muscle \u2014 it builds character. What specifically would help you?",
    options: [
      { label: "I'm struggling with motivation", next: "motivation" },
      { label: "I want to push harder", next: "push_harder" },
      { label: "\u2190 Back", next: "coaching_menu" }
    ]
  },
  push_harder: {
    message: "Love the fire! Here's how to push harder safely: 1) Progressive overload \u2014 add 5lbs or 1 rep each week, 2) Focus on the last 2 reps \u2014 that's where growth happens, 3) Use the recommendation arrows to plan your next session, 4) Trust the process!",
    options: [{ label: "Let's go!", next: "entry" }]
  },
  nutrition: {
    message: "Nutrition fuels everything! Quick wins: 1) Eat protein at every meal (aim for 0.8-1g per lb bodyweight), 2) Carbs before training for energy, 3) Don't skip meals on training days, 4) Hydrate \u2014 aim for half your bodyweight in oz of water.",
    options: [
      { label: "Meal timing tips", next: "meal_timing" },
      { label: "Thanks!", next: "entry" }
    ]
  },
  meal_timing: {
    message: "Meal timing for training: Pre-workout (1-2hrs before): carbs + moderate protein. Post-workout (within 2hrs): protein + carbs. On rest days, eat normally but don't cut calories drastically.",
    options: [{ label: "Got it!", next: "entry" }]
  },
  training_tips: {
    message: "Training tip: Focus on compound movements first (squats, deadlifts, presses, rows), then isolation work. Quality reps > quantity. If form breaks down, reduce weight \u2014 ego lifting leads to injuries, not gains.",
    options: [
      { label: "Form tips", next: "form_tips" },
      { label: "Thanks!", next: "entry" }
    ]
  },
  form_tips: {
    message: "Form essentials: 1) Brace your core before every lift, 2) Control the eccentric (lowering) phase, 3) Full range of motion always, 4) If you can't do it without momentum, it's too heavy. Check the video links next to exercises!",
    options: [{ label: "Thanks!", next: "entry" }]
  },
  tracker_help: {
    message: "Here's how to use the tracker: 1) Enter your weight and reps for each exercise, 2) Use the Mark Complete button when done, 3) Use the arrows to plan next week, 4) Add notes for your trainer at the bottom, 5) Hit 'Log Workout' when finished!",
    options: [
      { label: "What are the arrows for?", next: "arrows_help" },
      { label: "Thanks!", next: "entry" }
    ]
  },
  arrows_help: {
    message: "The recommendation arrows let you tell yourself and your trainer what to do next time: Up = go heavier/more reps, Right = same weight, Down = go lighter. Your recommendation shows up next week as a reminder!",
    options: [{ label: "Got it!", next: "entry" }]
  },
  motivation: {
    message: "You're HERE. That's already winning. Most people never start. You did. Remember why you began this journey. Every rep, every session, every drop of sweat \u2014 it all adds up. You're building something no one can take from you.",
    options: [
      { label: "I needed that!", next: "entry" },
      { label: "More motivation!", next: "motivation_extra" }
    ]
  },
  motivation_extra: {
    message: "Think about the person you'll be 12 weeks from now. Stronger, more confident, more disciplined. That person is being built RIGHT NOW, one workout at a time. Don't quit on them. They're counting on you.",
    options: [{ label: "Let's go!", next: "entry" }]
  },
  checkin: {
    message: "Hey! Glad you stopped by! Remember, your trainer is always watching your progress and adjusting your program. Keep logging your workouts and using the arrows \u2014 it helps them help you get better results!",
    options: [{ label: "See you later!", next: "entry" }]
  }
};

const WorkoutChatbot = forwardRef(({ isOpen: controlledOpen, onClose, userName, screen: currentScreen, onLoadTravel }, ref) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const [messages, setMessages] = useState([]);
  const [currentNode, setCurrentNode] = useState('entry');
  const [topicsVisited, setTopicsVisited] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [scrollToIndex, setScrollToIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const scrollTargetRef = useRef(null);
  const initialized = useRef(false);

  const name = (userName || 'there').split(' ')[0];

  const formatMessage = useCallback((text) => {
    return text.replace(/\{name\}/g, name);
  }, [name]);

  const entryNode = currentScreen === 'access' ? 'access_entry' : 'entry';

  // Initialize with entry message (re-initialize when screen changes)
  useEffect(() => {
    if (isOpen && !initialized.current) {
      initialized.current = true;
      const node = currentScreen === 'access' ? 'access_entry' : 'entry';
      setMessages([{
        text: formatMessage(TREE[node].message),
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setCurrentNode(node);
    }
  }, [isOpen, formatMessage, currentScreen]);

  // Reset when screen changes so it re-initializes with correct tree
  useEffect(() => {
    initialized.current = false;
    setMessages([]);
    setCurrentNode(currentScreen === 'access' ? 'access_entry' : 'entry');
  }, [currentScreen]);

  // Auto-scroll: scroll to user's clicked option so bot response flows below it
  useEffect(() => {
    if (scrollTargetRef.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, scrollToIndex]);

  const handleOptionClick = useCallback((option) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Track topic
    setTopicsVisited(prev => {
      if (!prev.includes(option.next)) return [...prev, option.next];
      return prev;
    });

    const nextNode = TREE[option.next];
    if (!nextNode) return;

    setActiveVideo(null);
    setMessages(prev => {
      setScrollToIndex(prev.length);
      return [
        ...prev,
        { text: option.label, isBot: false, timestamp: now },
        { text: formatMessage(nextNode.message), isBot: true, timestamp: now, videos: nextNode.videos || [] }
      ];
    });
    setCurrentNode(option.next);

    // Intercept travel_load_* nodes to trigger actual loading
    const travelMatch = option.next.match(/^travel_load_(bw|hg)_(\d)$/);
    if (travelMatch && onLoadTravel) {
      const equipmentType = travelMatch[1] === 'bw' ? 'bodyweight' : 'hotel_gym';
      const totalDays = parseInt(travelMatch[2]);
      onLoadTravel(equipmentType, totalDays)
        .then(() => {
          const successNode = TREE.travel_loaded;
          setMessages(prev => [
            ...prev,
            { text: successNode.message, isBot: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
          setCurrentNode('travel_loaded');
        })
        .catch(() => {
          const errorNode = TREE.travel_error;
          setMessages(prev => [
            ...prev,
            { text: errorNode.message, isBot: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]);
          setCurrentNode('travel_error');
        });
    }
  }, [formatMessage, onLoadTravel]);

  useImperativeHandle(ref, () => ({
    getConversationSummary: () => ({
      topicsVisited,
      messageCount: messages.length,
      messages: messages.map(m => ({ text: m.text, isBot: m.isBot, timestamp: m.timestamp }))
    })
  }), [topicsVisited, messages]);

  const handleOpen = () => {
    if (isControlled) return;
    setInternalOpen(true);
  };

  const handleClose = () => {
    setActiveVideo(null);
    if (isControlled && onClose) {
      onClose();
    } else {
      setInternalOpen(false);
    }
  };

  const currentOptions = TREE[currentNode]?.options || [];

  // Styles
  const bubbleStyle = {
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: '#fff',
    fontSize: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
    border: '3px solid #fff',
    cursor: 'pointer',
    zIndex: 9998,
    transition: 'transform 0.2s',
  };

  const panelStyle = {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '100%',
    maxWidth: 380,
    height: 500,
    background: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 9999,
    animation: 'slideUp 0.3s ease-out',
    overflow: 'hidden',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 15,
    fontWeight: 600,
    flexShrink: 0,
  };

  const messagesAreaStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const optionsAreaStyle = {
    padding: '10px 14px',
    borderTop: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 160,
    overflowY: 'auto',
    flexShrink: 0,
  };

  if (!isOpen) {
    return (
      <button style={bubbleStyle} onClick={handleOpen} aria-label="Open chat">
        <span role="img" aria-label="chat">💬</span>
      </button>
    );
  }

  return (
    <>
      <button style={{ ...bubbleStyle, display: 'none' }} />
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span>🤖 Workout Helper</span>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', color: '#fff',
              fontSize: 20, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
            }}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div style={messagesAreaStyle}>
          {messages.map((msg, i) => (
            <div
              key={i}
              ref={i === scrollToIndex ? scrollTargetRef : null}
              style={{
                alignSelf: msg.isBot ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                background: msg.isBot
                  ? 'linear-gradient(135deg, #f0ecfc 0%, #e8e4f8 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: msg.isBot ? '#333' : '#fff',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {msg.isBot && msg.text.includes('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                ) : (
                  msg.text
                )}
                {msg.videos && msg.videos.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {msg.videos.map((videoName, vi) => {
                      const url = VIDEO_LIBRARY[videoName];
                      const videoKey = `${i}-${vi}`;
                      const isOpen = activeVideo === videoKey;
                      return (
                        <div key={vi}>
                          {url ? (
                            <button
                              onClick={() => setActiveVideo(isOpen ? null : videoKey)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: 12,
                                border: '1px solid #e67e22',
                                background: isOpen ? '#e67e22' : 'rgba(230,126,34,0.1)',
                                color: isOpen ? '#fff' : '#e67e22',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'inline-block',
                                transition: 'all 0.15s',
                              }}
                            >
                              {isOpen ? '▼' : '▶'} {videoName}
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#999', fontStyle: 'italic' }}>
                              {videoName} (Video coming soon)
                            </span>
                          )}
                          {isOpen && url && (
                            <div style={{
                              marginTop: 4,
                              position: 'relative',
                              paddingBottom: '56.25%',
                              height: 0,
                              overflow: 'hidden',
                              borderRadius: 8,
                            }}>
                              <iframe
                                src={`${url}?autoplay=false`}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  border: 'none',
                                  borderRadius: 8,
                                }}
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: 10, color: '#999', marginTop: 2,
                textAlign: msg.isBot ? 'left' : 'right',
                padding: '0 4px',
              }}>
                {msg.timestamp}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={optionsAreaStyle}>
          {currentOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: '1.5px solid #667eea',
                background: '#fff',
                color: '#667eea',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                e.target.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.target.style.background = '#fff';
                e.target.style.color = '#667eea';
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
});

WorkoutChatbot.displayName = 'WorkoutChatbot';

export default WorkoutChatbot;
