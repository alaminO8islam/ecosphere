/**
 * EcoSphere Dashboard JavaScript
 */

// Badge list - defines all available badges and their requirements
const BADGES = [
  {id:1,name:"Seedling", points:0, desc:"Unlocked on first login", icon:"🌱"},
  {id:2,name:"Sprout", points:50, desc:"Post 1 article or 3 EcoBot queries", icon:"🌿"},
  {id:3,name:"Green Thumb", points:150, desc:"Publish 3 articles and earn 10 eco points", icon:"🌳"},
  {id:4,name:"Eco Explorer", points:300, desc:"Comment on 10 other users' articles", icon:"🧭"},
  {id:5,name:"Trailblazer", points:500, desc:"Complete 3 EcoBot-guided challenges", icon:"🔥"},
  {id:6,name:"Sustainability Ally", points:800, desc:"Earn 200 community points", icon:"🤝"},
  {id:7,name:"Conserver", points:1200, desc:"Log 10 eco-habit events", icon:"💧"},
  {id:8,name:"Guardian", points:1700, desc:"Host a community event or get 50 upvotes", icon:"🛡️"},
  {id:9,name:"Champion", points:2300, desc:"Accumulate 500 community points", icon:"🏆"},
  {id:10,name:"Steward", points:3000, desc:"Maintain regular eco actions (30-day pattern)", icon:"🌎"},
  {id:11,name:"Ambassador", points:3800, desc:"Refer users who complete their first action", icon:"📣"},
  {id:12,name:"Earth Keeper", points:4700, desc:"Major milestone: 2000 community points or 1 verified project", icon:"👑"}
];

// Avatars: use DiceBear API for generating avatar images
const AVATAR_URL = seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
const AVATARS = [
  {id:'m1',seed:'Explorer_Male_1'}, {id:'m2',seed:'Hero_Male_2'}, {id:'m3',seed:'Guardian_Male_3'}, {id:'m4',seed:'Adventurer_Male_4'}, {id:'m5',seed:'Wanderer_Male_5'},
  {id:'f1',seed:'Nature_Female_1'}, {id:'f2',seed:'Voyager_Female_2'}, {id:'f3',seed:'Healer_Female_3'}, {id:'f4',seed:'Healer_Female_4'}, {id:'f5',seed:'Voyager_Female_5'}
];

// User data structure - will be populated from server or local storage
let USER = {
  id: 'user_001', name:'EcoSphere User', email:'user@example.com', points:0,
  unlockedBadges:[], displayBadge:null, bio:'', avatarChoice:null, avatarUpload:null, activity:[]
};

// Create modal and toast containers if they don't exist
document.addEventListener('DOMContentLoaded', function() {
  // Create modal root if it doesn't exist
  if (!document.getElementById('modalRoot')) {
    const modalRoot = document.createElement('div');
    modalRoot.id = 'modalRoot';
    document.body.appendChild(modalRoot);
  }
  
  // Create toast root if it doesn't exist
  if (!document.getElementById('toastRoot')) {
    const toastRoot = document.createElement('div');
    toastRoot.id = 'toastRoot';
    toastRoot.style.position = 'fixed';
    toastRoot.style.bottom = '20px';
    toastRoot.style.right = '20px';
    toastRoot.style.zIndex = '9999';
    document.body.appendChild(toastRoot);
  }
});

document.addEventListener('DOMContentLoaded', function() {
    // Initialize core functionality
    init();
    
    // Initialize UI components
    initializeSidebar();
    initializeNotifications();
    initializeAIAssistant();
    initializeProfileSection();
    initializeLogout();
    initializeDarkMode();
    initializePageNavigation();
    initializeNoteModal();
    initializeCarbonCalculator();
    
    // Load data from server
    loadUserData();
    loadWeatherData();
    loadSunData();
});

function saveLocal(){ localStorage.setItem('demo_user_v3', JSON.stringify(USER)); }
function loadLocal(){ const d = localStorage.getItem('demo_user_v3'); if(d) USER = JSON.parse(d); }

function init(){
  loadLocal();
  if(!USER.unlockedBadges.includes('Seedling')){ 
    USER.unlockedBadges.push('Seedling'); 
    USER.activity.unshift({ts:Date.now(),text:'Seedling unlocked on first login'}); 
  }
  renderAll();
  
  // Initialize charts
  initializeCharts();
}

function renderAll(){
  document.getElementById('profileName').textContent = USER.name || 'User';
  
  // Set email with validation and privacy toggle
  const emailElement = document.getElementById('profileEmail');
  const emailText = USER.email || '';
  
  if (emailText) {
    // Check if email is from a famous domain
    const emailParts = emailText.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1];
      
      // List of famous email domains
      const famousDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'icloud.com', 'aol.com', 'protonmail.com', 'mail.com',
        'zoho.com', 'yandex.com', 'gmx.com', 'live.com'
      ];
      
      // Clear previous content
      emailElement.innerHTML = '';
      
      // Create text node for username part
      const usernameText = document.createTextNode(emailParts[0] + '@');
      emailElement.appendChild(usernameText);
      
      // Create domain span with verification if it's a famous domain
      const domainSpan = document.createElement('span');
      if (famousDomains.includes(domain)) {
        domainSpan.className = 'verified-domain';
        domainSpan.title = 'Verified Domain';
      }
      domainSpan.textContent = domain;
      emailElement.appendChild(domainSpan);
      
      // Add eye icon for toggling email visibility
      const eyeIcon = document.createElement('i');
      eyeIcon.className = 'fas fa-eye';
      eyeIcon.title = 'Show/Hide Email';
      eyeIcon.style.marginLeft = '8px';
      eyeIcon.style.cursor = 'pointer';
      eyeIcon.style.opacity = '0.7';
      
      // Store the full email and hidden version for toggling
      const hiddenEmail = emailParts[0].substring(0, 2) + '***@' + domain;
      eyeIcon.dataset.isHidden = 'false';
      eyeIcon.dataset.fullEmail = emailText;
      eyeIcon.dataset.hiddenEmail = hiddenEmail;
      
      // Add click event to toggle email visibility
      eyeIcon.addEventListener('click', function() {
        const isHidden = this.dataset.isHidden === 'true';
        
        if (isHidden) {
          // Show full email
          emailElement.innerHTML = '';
          emailElement.appendChild(usernameText);
          emailElement.appendChild(domainSpan);
          this.className = 'fas fa-eye';
          this.dataset.isHidden = 'false';
        } else {
          // Hide email
          emailElement.innerHTML = '';
          const hiddenText = document.createTextNode(hiddenEmail);
          emailElement.appendChild(hiddenText);
          this.className = 'fas fa-eye-slash';
          this.dataset.isHidden = 'true';
        }
        
        // Re-append the eye icon
        emailElement.appendChild(this);
      });
      
      // Append the eye icon
      emailElement.appendChild(eyeIcon);
    } else {
      // Invalid email format
      emailElement.textContent = emailText;
    }
  } else {
    emailElement.textContent = '';
  }
  
  document.getElementById('userPoints').textContent = USER.points;
  document.getElementById('userLevel').textContent = computeLevel();
  updateAvatarElement();
  renderBadges(); 
  renderProgress(); 
  renderHabits(); 
  renderActivity(); 
  renderProfileBadge(); 
  updatePointsProgress();
  saveLocal();
}

function updatePointsProgress(){
  const level = computeLevel();
  const currentBadge = BADGES[Math.max(0,level-1)];
  const nextBadge = BADGES[Math.min(BADGES.length-1, level)];
  const currentBase = currentBadge.points;
  const nextBase = nextBadge.points;
  const percent = Math.round(((USER.points - currentBase) / Math.max(1, nextBase - currentBase)) * 100);
  document.getElementById('pointsFill').style.width = Math.max(0,Math.min(100,percent)) + '%';
}

function updateAvatarElement(){
  const el = document.getElementById('avatar');
  if (!el) return;
  
  // Clear
  el.innerHTML = '';
  el.style.backgroundImage = '';
  if(USER.avatarUpload){
    // show uploaded image
    el.innerHTML = `<img src="${USER.avatarUpload}" alt="avatar"/>`;
  } else if(USER.avatarChoice){
    const a = AVATARS.find(x=>x.id===USER.avatarChoice);
    if(a){ el.innerHTML = `<img src='${AVATAR_URL(a.seed)}' alt='avatar'/>`; }
    else el.textContent = initials(USER.name);
  } else {
    el.textContent = initials(USER.name);
  }
}

function initials(name){ return (name||'U').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(); }

function computeLevel(){ return Math.max(1,BADGES.filter(b=>USER.points >= b.points).length); }

function renderBadges(){ 
  const container = document.getElementById('badgesContainer'); 
  if (!container) return;
  
  container.innerHTML = ''; 
  for(const b of BADGES){ 
    const unlocked = USER.unlockedBadges.includes(b.name); 
    const card = document.createElement('div'); 
    card.className = 'badge-card '+(unlocked? 'unlocked':'locked'); 
    card.innerHTML = `<div class='badge-icon'>${b.icon}</div><div class='badge-name'>${b.name}</div><div class='badge-desc'>${b.desc}</div><button class='claim-btn ${unlocked? 'primary':''}' onclick="onBadgeClick('${b.name}')">${unlocked? 'Select':'Locked'}</button>`; 
    container.appendChild(card);
  } 
}

function onBadgeClick(name){ 
  if(USER.unlockedBadges.includes(name)){ 
    USER.displayBadge = name; 
    USER.activity.unshift({ts:Date.now(),text:`Displayed ${name} on profile`}); 
    showToast(`${name} will now appear on your profile`); 
    renderAll(); 
  } else { 
    showToast(`Badge locked — ${BADGES.find(b=>b.name===name).desc}`); 
  } 
}

function renderProgress(){ 
  const level = computeLevel(); 
  const currentBadge = BADGES[Math.max(0,level-1)]; 
  const nextBadge = BADGES[Math.min(BADGES.length-1, level)]; 
  const currentBase = currentBadge.points; 
  const nextBase = nextBadge.points; 
  const percent = Math.round(((USER.points - currentBase) / Math.max(1, nextBase - currentBase)) * 100); 
  
  const rankFill = document.getElementById('rankFill');
  const rankPercentText = document.getElementById('rankPercentText');
  const rankDetails = document.getElementById('rankDetails');
  
  if (rankFill) rankFill.style.width = Math.max(0,Math.min(100,percent)) + '%'; 
  if (rankPercentText) rankPercentText.textContent = Math.max(0,Math.min(100,percent)) + '%'; 
  if (rankDetails) rankDetails.textContent = `Level ${level} — ${currentBadge.name} • ${USER.points} / ${nextBadge.points} points`; 
}

function renderHabits(){ 
  const list = document.getElementById('habitList'); 
  if (!list) return;
  
  list.innerHTML = ''; 
  const habits = [ 
    {id:'bike',name:'Bike instead of car',count:3}, 
    {id:'recycle',name:'Recycling reported',count:7}, 
    {id:'plant',name:'Plant a tree',count:1} 
  ]; 
  
  for(const h of habits){ 
    const el = document.createElement('div'); 
    el.className='habit'; 
    el.innerHTML = `<div style='display:flex;gap:10px;align-items:center'><div style='font-size:18px'>✅</div><div><div style='font-weight:600'>${h.name}</div><div class='small-muted'>Completed ${h.count} times</div></div></div><div><button class='btn ghost' onclick="openLogHabitModal('${h.id}','${h.name}')">Log</button></div>`; 
    list.appendChild(el); 
  } 
}

function renderActivity(){ 
  const el = document.getElementById('activityLog'); 
  if (!el) return;
  
  el.innerHTML=''; 
  for(const a of USER.activity.slice(0,30)){ 
    const d = new Date(a.ts).toLocaleString(); 
    const div = document.createElement('div'); 
    div.style.padding='6px 0'; 
    div.innerHTML = `<div style='font-size:13px'>${a.text}</div><div class='small-muted' style='font-size:12px'>${d}</div>`; 
    el.appendChild(div);
  }
}

function renderProfileBadge(){ 
  const el = document.getElementById('profileBadge'); 
  if (!el) return;
  
  if(!USER.displayBadge){ 
    el.style.display='none'; 
    return; 
  } 
  
  const b = BADGES.find(x=>x.name===USER.displayBadge); 
  el.style.display='flex'; 
  el.innerHTML = b ? b.icon : '🏅'; 
}

/* Habit management */
function openHabits() {
  openModal(`
    <div style='padding:12px;color:#bfeff0'>
      <h3>Manage Eco Habits</h3>
      <div class='habit-list'>
        ${['Bike instead of car', 'Recycling reported', 'Plant a tree'].map(habit => `
          <div class='habit'>
            <div style='display:flex;gap:10px;align-items:center'>
              <div style='font-size:18px'>✅</div>
              <div>
                <div style='font-weight:600'>${habit}</div>
                <div class='small-muted'>2 points per day</div>
              </div>
            </div>
            <button class='btn' onclick="openLogHabitModal('${habit.toLowerCase().replace(/\s/g,'_')}','${habit}')">Log</button>
          </div>
        `).join('')}
      </div>
      <div style='display:flex;justify-content:flex-end;margin-top:12px'>
        <button class='btn ghost' onclick='closeModal()'>Close</button>
      </div>
    </div>
  `);
}

/* Hook for EcoBot / server to credit points */
async function handleEcoBotPoints(amount, reason){ 
  if(!amount || amount<=0) return; 
  USER.points += amount; 
  USER.activity.unshift({ts:Date.now(),text:`+${amount} points — ${reason||'EcoBot'}`}); 
  checkUnlocks(); 
  renderAll(); 
  try{ 
    await fetch('/api/user/addPoints',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({userId:USER.id,amount,reason})
    }); 
  } catch(e){ 
    console.error('Persist points failed',e); 
  } 
}
window.handleEcoBotPoints = handleEcoBotPoints;

function addPoints(amount, reason){ 
  USER.points += amount; 
  USER.activity.unshift({ts:Date.now(),text:`+${amount} points — ${reason}`}); 
  checkUnlocks(); 
  renderAll(); 
  fetch('/api/user/addPoints',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({userId:USER.id,amount,reason})
  }).catch(()=>{}); 
}

function checkUnlocks(){ 
  for(const b of BADGES){ 
    if(!USER.unlockedBadges.includes(b.name) && USER.points >= b.points){ 
      USER.unlockedBadges.push(b.name); 
      USER.activity.unshift({ts:Date.now(),text:`Unlocked badge: ${b.name}`}); 
      showToast(`Unlocked: ${b.name}`); 
    } 
  } 
}

/* Habit logging modal */
function openLogHabitModal(habitId, habitName){ 
  openModal(`<div style='padding:12px;color:#bfeff0'><h3>Log: ${habitName}</h3><p class='small-muted'>Confirm logging this action. The site should validate it server-side and then award points.</p><div style='display:flex;justify-content:flex-end;gap:8px;margin-top:12px'><button class='btn ghost' onclick='closeModal()'>Cancel</button><button class='btn' onclick="confirmLogHabit('${habitId}','${habitName}')">Confirm</button></div></div>`); 
}

function confirmLogHabit(habitId, habitName){ 
  closeModal();
  // Check if already logged today
  const today = new Date().toDateString();
  const loggedToday = USER.activity.some(a => 
    a.text.includes(habitName) && 
    new Date(a.ts).toDateString() === today
  );
  
  if (!loggedToday) {
    addPoints(2, 'Logged habit ' + habitName);
    showToast(`+2 points for ${habitName} (once per day)`);
  } else {
    showToast(`Already logged ${habitName} today`);
  }
}

/* PROFILE EDIT modal: avatars, upload, bio, QR flip, share */
function openEditProfile(){ 
  const gallery = AVATARS.map(a=>`<div class='avatar-option' data-id='${a.id}' onclick='selectAvatarOption("${a.id}")'><img src='${AVATAR_URL(a.seed)}' alt='${a.id}'/></div>`).join(''); 
  const html = `
    <div style='padding:12px;color:#bfeff0'>
      <div style='display:flex;gap:12px;align-items:center'>
        <div style='text-align:center'>
          <div class='qr-card' id='qrCard'>
            <div class='qr-face qr-front' id='qrFront'>${USER.avatarUpload ? `<img src='${USER.avatarUpload}' style='width:100%;height:100%;border-radius:12px'/>` : USER.avatarChoice ? `<img src='${AVATAR_URL(AVATARS.find(x=>x.id===USER.avatarChoice).seed)}' style='width:100%;height:100%;border-radius:12px'/>` : `<div style='font-size:36px'>${initials(USER.name)}</div>`}</div>
            <div class='qr-face qr-back'><img src='https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href + '?user=' + USER.id)}' alt='QR' style='width:86%;height:86%;border-radius:8px'/></div>
          </div>
          <div style='margin-top:8px;display:flex;gap:8px;justify-content:center'>
            <button class='btn ghost' onclick='toggleQR()'>Flip / QR</button>
            <button class='btn ghost' onclick='shareProfile()'>Share</button>
          </div>
        </div>
        <div style='flex:1'>
          <label>Name</label>
          <input id='editName' style='width:100%;padding:8px;border-radius:8px;border:none;margin-top:6px' value='${escapeHtml(USER.name)}' />
          <label style='margin-top:8px'>Email</label>
          <input id='editEmail' style='width:100%;padding:8px;border-radius:8px;border:none;margin-top:6px' value='${escapeHtml(USER.email)}' />
          <label style='margin-top:8px'>Bio</label>
          <textarea id='editBio' style='width:100%;padding:8px;border-radius:8px;border:none;margin-top:6px;height:80px'>${escapeHtml(USER.bio || '')}</textarea>

          <div style='margin-top:10px'>
            <div style='display:flex;justify-content:space-between;align-items:center'><div><strong>Pick an avatar</strong><div class='small-muted'>10 curated avatars</div></div><div><input id='avatarUploadInput' type='file' accept='image/*' style='display:none' onchange='handleAvatarUpload(event)' /></div></div>
            <div class='avatar-gallery'>${gallery}</div>
            <div style='margin-top:10px;display:flex;gap:8px;justify-content:flex-end'>
              <button class='btn ghost' onclick='closeModal()'>Cancel</button>
              <button class='btn' onclick='saveProfile()'>Save</button>
              <button class='btn ghost' onclick='document.getElementById("avatarUploadInput").click()'>Upload</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `; 
  showModal(html);
  setTimeout(()=>{ // mark selected
    document.querySelectorAll('.avatar-option').forEach(el=>el.classList.toggle('selected', el.dataset.id === USER.avatarChoice));
  },80);
}

function selectAvatarOption(id){ 
  USER.avatarChoice = id; 
  USER.avatarUpload = null; 
  document.querySelectorAll('.avatar-option').forEach(el=>el.classList.toggle('selected', el.dataset.id===id)); 
}

function handleAvatarUpload(e){ 
  const f = e.target.files && e.target.files[0]; 
  if(!f) return; 
  const reader = new FileReader(); 
  reader.onload = ()=>{ 
    USER.avatarUpload = reader.result; 
    USER.avatarChoice = null; 
    renderAll(); 
    const front = document.getElementById('qrFront'); 
    if(front) front.innerHTML = `<img src='${USER.avatarUpload}' style='width:100%;height:100%;border-radius:12px'/>`; 
    showToast('Profile image uploaded (saved locally).'); 
  }; 
  reader.readAsDataURL(f); 
}

function saveProfile(){ 
  const n = document.getElementById('editName').value.trim(); 
  const e = document.getElementById('editEmail').value.trim(); 
  const b = document.getElementById('editBio').value.trim(); 
  if(n) USER.name = n; 
  if(e) USER.email = e; 
  USER.bio = b; 
  USER.activity.unshift({ts:Date.now(),text:'Profile updated'}); 
  closeModal(); 
  renderAll(); 
  // persist to server in production
}

function toggleQR(){ 
  const card = document.getElementById('qrCard'); 
  if(card) card.classList.toggle('flipped'); 
}

function shareProfile(){ 
  const url = window.location.href.split('?')[0] + '?user=' + encodeURIComponent(USER.id); 
  navigator.clipboard.writeText(url).then(()=> showToast('Profile link copied to clipboard')); 
}

function openBadgeSelector(){ 
  const unlocked = USER.unlockedBadges.slice(0); 
  let body = `<div style='padding:12px;color:#bfeff0'><h3>Display Badge on Profile</h3><div class='small-muted' style='margin-bottom:8px'>Choose one badge to display on your public profile, or choose None.</div>`; 
  body += `<div style='display:flex;flex-wrap:wrap;gap:8px'>`; 
  body += `<label style='display:flex;align-items:center;gap:8px'><input type='radio' name='showBadge' value='none' ${!USER.displayBadge? 'checked':''}/> None</label>`; 
  for(const b of unlocked) body += `<label style='display:flex;align-items:center;gap:8px'><input type='radio' name='showBadge' value='${b}' ${USER.displayBadge===b? 'checked':''}/> ${b}</label>`; 
  body += `</div><div style='display:flex;justify-content:flex-end;gap:8px;margin-top:12px'><button class='btn ghost' onclick='closeModal()'>Cancel</button><button class='btn' onclick='saveBadgeSelection()'>Save</button></div></div>`; 
  showModal(body); 
}

function saveBadgeSelection(){ 
  const r = document.querySelector('input[name="showBadge"]:checked'); 
  USER.displayBadge = r && r.value !== 'none' ? r.value : null; 
  USER.activity.unshift({ts:Date.now(),text: USER.displayBadge ? `Displayed ${USER.displayBadge} on profile` : 'Removed badge from profile'}); 
  closeModal(); 
  renderAll(); 
}

/**
 * Sidebar functionality
 */
function initializeSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 576 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }
}

/**
 * Notification system
 */
function initializeNotifications() {
    // Use document.querySelectorAll to find all notification buttons across pages
    const notificationsBtns = document.querySelectorAll('#notificationsBtn');
    const notificationPopup = document.getElementById('notificationPopup');
    const notificationClear = document.querySelector('.notification-clear');
    const notificationBadge = document.querySelectorAll('.badge');
    
    // Initialize notification state
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [
        {
            title: "Eco Challenge Completed",
            message: "You've completed the 'Reduce Water Usage' challenge!",
            time: "2 hours ago",
            read: false
        },
        {
            title: "Weekly Report",
            message: "Your weekly carbon footprint report is ready to view.",
            time: "1 day ago",
            read: true
        },
        {
            title: "New Badge Earned",
            message: "You've earned the 'Energy Saver' badge for reducing electricity usage.",
            time: "3 days ago",
            read: true
        }
    ];
    
    // Update notification count
    function updateNotificationCount() {
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationBadge.forEach(badge => {
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        });
    }
    
    // Display notifications in popup
    function displayNotifications() {
        const notificationList = document.querySelector('.notification-list');
        if (!notificationList) return;
        
        notificationList.innerHTML = '';
        
        if (notifications.length === 0) {
            notificationList.innerHTML = '<li class="notification-item"><div class="notification-message">No notifications</div></li>';
            return;
        }
        
        notifications.forEach((notification, index) => {
            const item = document.createElement('li');
            item.className = `notification-item ${notification.read ? '' : 'unread'}`;
            item.innerHTML = `
                <div class="notification-title">
                    <i class="fas fa-leaf"></i> ${notification.title}
                </div>
                <div class="notification-message">
                    ${notification.message}
                </div>
                <div class="notification-time">
                    <i class="far fa-clock"></i> ${notification.time}
                </div>
            `;
            
            // Mark as read when clicked
            item.addEventListener('click', () => {
                if (!notification.read) {
                    notification.read = true;
                    notifications[index].read = true;
                    localStorage.setItem('notifications', JSON.stringify(notifications));
                    item.classList.remove('unread');
                    updateNotificationCount();
                }
            });
            
            notificationList.appendChild(item);
        });
    }
    
    if (notificationsBtns.length > 0 && notificationPopup) {
        notificationsBtns.forEach(notificationsBtn => {
            notificationsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                notificationPopup.classList.toggle('active');
                displayNotifications();
                
                // Mark all as read when opened
                notifications = notifications.map(n => ({ ...n, read: true }));
                localStorage.setItem('notifications', JSON.stringify(notifications));
                updateNotificationCount();
            });
        });
        
        // Close notification when clicking outside
        document.addEventListener('click', function() {
            notificationPopup.classList.remove('active');
        });
        
        // Prevent popup from closing when clicking inside it
        notificationPopup.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Clear all notifications
        if (notificationClear) {
            notificationClear.addEventListener('click', function() {
                notifications = [];
                localStorage.setItem('notifications', JSON.stringify(notifications));
                document.querySelector('.notification-list').innerHTML = '<li class="notification-item"><div class="notification-message">No notifications</div></li>';
                updateNotificationCount();
            });
        }
    }
    
    // Initialize notification count on page load
    updateNotificationCount();
}

/**
 * AI Assistant functionality
 */
function initializeAIAssistant() {
    // Get all required elements
    const aiAssistantBtn = document.getElementById('aiAssistantBtn');
    const aiAssistant = document.getElementById('aiAssistant');
    const aiAssistantClose = document.getElementById('aiAssistantClose');
    const aiInput = document.getElementById('aiInput');
    const aiSend = document.getElementById('aiSend');
    const aiMessages = document.getElementById('aiMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const newChatBtn = document.getElementById('newChatBtn');
    const historyBtn = document.getElementById('historyBtn');
    const historyPanel = document.getElementById('historyPanel');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const quickButtons = document.querySelectorAll('.quick-btn');
    const aiVoice = document.getElementById('aiVoice');
    
    // Initialize chat history from local storage
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    
    // Toggle AI Assistant
    const aiAssistantContainer = document.getElementById('aiAssistantContainer');
    if (aiAssistantBtn && aiAssistantContainer) {
        aiAssistantBtn.addEventListener('click', function() {
            aiAssistantContainer.classList.toggle('active');
            // Focus input when opening
            if (aiAssistantContainer.classList.contains('active') && aiInput) {
                setTimeout(() => aiInput.focus(), 300);
            }
        });
    }
    
    // Close AI Assistant
    if (aiAssistantClose && aiAssistantContainer) {
        aiAssistantClose.addEventListener('click', function() {
            aiAssistantContainer.classList.remove('active');
        });
    }
    
    // Send message
    if (aiSend && aiInput && aiMessages) {
        aiSend.addEventListener('click', sendMessage);
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Voice input (if supported by browser)
    if (aiVoice && 'webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        aiVoice.addEventListener('click', function() {
            aiVoice.classList.add('listening');
            recognition.start();
        });
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            aiInput.value = transcript;
            aiVoice.classList.remove('listening');
            // Small delay to show the transcribed text before sending
            setTimeout(sendMessage, 300);
        };
        
        recognition.onerror = function() {
            aiVoice.classList.remove('listening');
            showToast('Voice recognition failed. Please try again.');
        };
        
        recognition.onend = function() {
            aiVoice.classList.remove('listening');
        };
    } else if (aiVoice) {
        // Hide voice button if not supported
        aiVoice.style.display = 'none';
    }
    
    // Quick action buttons
    if (quickButtons) {
        quickButtons.forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                let message = '';
                
                switch(action) {
                    case 'footprint':
                        message = 'Give me tips to reduce my carbon footprint.';
                        break;
                    case 'vitaminD':
                        message = 'How can I optimize my vitamin D intake?';
                        break;
                    case 'recycling':
                        message = 'What are the best practices for recycling?';
                        break;
                }
                
                if (aiInput) {
                    aiInput.value = message;
                    sendMessage();
                }
            });
        });
    }
    
    // New chat
    if (newChatBtn && aiMessages) {
        newChatBtn.addEventListener('click', function() {
            // Save current chat if not empty
            if (aiMessages.children.length > 1) {
                saveChatToHistory();
            }
            
            // Clear messages and start new chat
            aiMessages.innerHTML = '';
            addBotMessage('Hello! I\'m your EcoSphere assistant. How can I help you with sustainability today?');
        });
    }
    
    // Chat history panel
    if (historyBtn && historyPanel) {
        historyBtn.addEventListener('click', function() {
            historyPanel.classList.toggle('active');
            if (historyPanel.classList.contains('active')) {
                displayChatHistory();
            }
        });
    }
    
    if (closeHistoryBtn && historyPanel) {
        closeHistoryBtn.addEventListener('click', function() {
            historyPanel.classList.remove('active');
        });
    }
    
    // Add welcome message on initialization
    if (aiMessages && aiMessages.children.length === 0) {
        addBotMessage('Hello! I\'m your EcoSphere assistant. How can I help you with sustainability today?');
    }
    
    // Send message function
    function sendMessage() {
        if (!aiInput || !aiMessages) return;
        
        const message = aiInput.value.trim();
        if (message === '') return;
        
        // Add user message
        addUserMessage(message);
        aiInput.value = '';
        
        // Show typing indicator
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            aiMessages.scrollTop = aiMessages.scrollHeight;
        }
        
        // Simulate response (replace with actual API call)
        setTimeout(() => {
            if (typingIndicator) {
                typingIndicator.style.display = 'none';
            }
            
            // Generate response based on user message
            let response = generateResponse(message);
            addBotMessage(response);
            
            // Add points for using EcoBot (only once per session)
            const lastEcoBotPoints = localStorage.getItem('lastEcoBotPoints') || 0;
            const now = Date.now();
            if (now - lastEcoBotPoints > 3600000) { // 1 hour cooldown
                handleEcoBotPoints(1, "EcoBot interaction");
                localStorage.setItem('lastEcoBotPoints', now);
            }
        }, 1000 + Math.random() * 1000);
    }
    
    // Add user message to chat
    function addUserMessage(message) {
        if (!aiMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">${escapeHtml(message)}</div>
            <div class="message-time">${getCurrentTime()}</div>
        `;
        
        aiMessages.appendChild(messageDiv);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }
    
    // Add bot message to chat
    function addBotMessage(message) {
        if (!aiMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                <i class="fas fa-leaf"></i>
            </div>
            <div class="message-bubble">
                <div class="message-content">${message}</div>
                <div class="message-time">${getCurrentTime()}</div>
            </div>
        `;
        
        aiMessages.appendChild(messageDiv);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }
    
    // Save current chat to history
    function saveChatToHistory() {
        if (!aiMessages || aiMessages.children.length <= 1) return;
        
        // Get first user message as title
        let title = "New Chat";
        const userMessages = aiMessages.querySelectorAll('.user-message .message-content');
        if (userMessages.length > 0) {
            title = userMessages[0].textContent;
            if (title.length > 30) title = title.substring(0, 30) + '...';
        }
        
        // Create chat history entry
        const chatEntry = {
            id: Date.now(),
            title: title,
            date: new Date().toISOString(),
            messages: Array.from(aiMessages.children).map(msg => {
                const isUser = msg.classList.contains('user-message');
                const content = msg.querySelector('.message-content').textContent;
                return { isUser, content };
            })
        };
        
        // Add to history and save to local storage
        chatHistory.unshift(chatEntry);
        if (chatHistory.length > 10) chatHistory.pop(); // Keep only 10 most recent chats
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
    
    // Display chat history in panel
    function displayChatHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (chatHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No chat history yet</div>';
            return;
        }
        
        chatHistory.forEach(chat => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-text">${escapeHtml(chat.title)}</div>
                <div class="history-time">${formatDate(new Date(chat.date))}</div>
            `;
            
            // Load chat when clicked
            historyItem.addEventListener('click', () => {
                loadChatFromHistory(chat);
                historyPanel.classList.remove('active');
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Load chat from history
    function loadChatFromHistory(chat) {
        if (!aiMessages || !chat.messages) return;
        
        // Clear current chat
        aiMessages.innerHTML = '';
        
        // Add messages from history
        chat.messages.forEach(msg => {
            if (msg.isUser) {
                addUserMessage(msg.content);
            } else {
                addBotMessage(msg.content);
            }
        });
    }
    
    // Add to history list
    function addToHistory(message) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-text">${escapeHtml(message.length > 30 ? message.substring(0, 30) + '...' : message)}</div>
            <div class="history-time">${getCurrentDate()}</div>
        `;
        
        historyList.prepend(historyItem);
    }
    
    // Generate response (placeholder - replace with actual API call)
    function generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('carbon') || lowerMessage.includes('footprint')) {
            return 'To reduce your carbon footprint, consider using public transportation, reducing meat consumption, and minimizing energy usage at home. Small changes like using reusable bags and bottles can also make a difference.';
        } else if (lowerMessage.includes('vitamin d') || lowerMessage.includes('sun')) {
            return 'For optimal vitamin D levels, try to get 15-20 minutes of direct sunlight daily. During winter months or if you live in less sunny areas, consider vitamin D supplements. Foods like fatty fish, egg yolks, and fortified dairy can also help.';
        } else if (lowerMessage.includes('recycling') || lowerMessage.includes('recycle')) {
            return 'Effective recycling starts with proper sorting. Clean containers before recycling, remove non-recyclable components, and check your local recycling guidelines. Remember that reducing and reusing are even more effective than recycling.';
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return 'Hello! I\'m your EcoSphere assistant. How can I help you with sustainability today?';
        } else {
            return 'Thank you for your question about sustainability. I\'m here to help with information about carbon footprint reduction, vitamin D optimization, and eco-friendly practices. Could you provide more details about what you\'d like to know?';
        }
    }
    
    // Get current time
    function getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Get current date
    function getCurrentDate() {
        const now = new Date();
        return now.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Format date for history
    function formatDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
}

/**
 * Profile section functionality
 */
function initializeProfileSection() {
    loadUserData();
}

/**
 * Logout functionality
 */
function initializeLogout() {
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    
    if (logoutBtns.length > 0) {
        logoutBtns.forEach(logoutBtn => {
            logoutBtn.addEventListener('click', function() {
            // Send logout request
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                // Redirect to login page
                window.location.href = '/';
            })
            .catch(error => {
                console.error('Error logging out:', error);
                // Redirect anyway
                window.location.href = '/';
            });
        });
        });
    }
}

/**
 * Dark mode toggle
 */
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
        body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    // Toggle dark mode
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.checked);
            
            // Add transition class for smooth color changes
            document.body.classList.add('color-transition');
            setTimeout(() => {
                document.body.classList.remove('color-transition');
            }, 500);
        });
    }
}

/**
 * Page navigation
 */
function initializePageNavigation() {
    const menuLinks = document.querySelectorAll('.menu li a');
    const pageContents = document.querySelectorAll('.page-content');
    
    if (menuLinks && pageContents) {
        menuLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Get the target page ID
                const targetPage = this.getAttribute('data-page');
                
                // Hide all pages
                pageContents.forEach(page => {
                    page.style.display = 'none';
                });
                
                // Show the target page
                const page = document.getElementById(targetPage);
                if (page) {
                    page.style.display = 'block';
                }
                
                // Update active menu item
                menuLinks.forEach(menuItem => {
                    menuItem.parentElement.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                // Close sidebar on mobile
                const sidebar = document.getElementById('sidebar');
                if (sidebar && window.innerWidth < 768) {
                    sidebar.classList.remove('active');
                }
                
                // Reload weather data when returning to dashboard page
                if (targetPage === 'dashboard-page') {
                    // Check if we have cached weather data
                    const cachedWeatherData = localStorage.getItem('weatherData');
                    if (cachedWeatherData) {
                        try {
                            const weatherData = JSON.parse(cachedWeatherData);
                            updateDashboardCards(weatherData);
                        } catch (e) {
                            console.error('Error parsing cached weather data:', e);
                        }
                    }
                }
            });
        });
    }
    
    // Initialize carbon footprint calculator
    initializeCarbonCalculator();
}

/**
 * Note modal functionality
 */
function initializeNoteModal() {
    const newNoteBtn = document.getElementById('newNoteBtn');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const noteModalClose = document.querySelector('.note-modal-close');
    const noteForm = document.querySelector('.note-form');
    
    // Handle '+ New Note' button click
    if (newNoteBtn && noteModal) {
        newNoteBtn.addEventListener('click', function() {
            noteModal.style.display = 'flex';
        });
    }
    
    // Handle 'Add Note' button click
    if (addNoteBtn && noteModal) {
        addNoteBtn.addEventListener('click', function() {
            noteModal.style.display = 'flex';
        });
    }
    
    // Handle close button click
    if (noteModalClose && noteModal) {
        noteModalClose.addEventListener('click', function() {
            noteModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === noteModal) {
            noteModal.style.display = 'none';
        }
    });
    
    // Handle form submission
    if (noteForm) {
        noteForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const titleInput = noteForm.querySelector('input[type="text"]');
            const contentInput = noteForm.querySelector('textarea');
            
            if (titleInput && contentInput) {
                const title = titleInput.value.trim();
                const content = contentInput.value.trim();
                
                if (title && content) {
                    // Create new note element
                    const noteContainer = document.querySelector('.card .note').parentNode;
                    const newNote = document.createElement('div');
                    newNote.className = 'note';
                    newNote.innerHTML = `
                        <h3 class="note-title">${escapeHtml(title)}</h3>
                        <p class="note-content">${escapeHtml(content)}</p>
                    `;
                    
                    // Add to beginning of notes list
                    if (noteContainer.firstChild) {
                        noteContainer.insertBefore(newNote, noteContainer.firstChild);
                    } else {
                        noteContainer.appendChild(newNote);
                    }
                    
                    // Add points for creating a note
                    USER.points += 5;
                    USER.activity.unshift({ts:Date.now(), text:'Created a new note: ' + title});
                    updatePointsProgress();
                    renderActivity();
                    saveLocal();
                    
                    // Show success message
                    showToast('Note saved successfully! +5 points', 'success');
                    
                    // Reset form and close modal
                    titleInput.value = '';
                    contentInput.value = '';
                    noteModal.style.display = 'none';
                }
            }
        });
    }
    
    // Server-side note submission is disabled in this demo
    // The local storage implementation above is used instead
}

/**
 * Load user data
 */
function loadUserData() {
    // Try to fetch from API first
    fetch('/api/auth/user')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.user) {
                // Update USER object with server data
                USER.id = data.user.id || USER.id;
                USER.name = `${data.user.first_name} ${data.user.last_name}` || USER.name;
                USER.email = data.user.email || USER.email;
                USER.points = data.user.progress || USER.points;
                USER.unlockedBadges = data.user.badges || USER.unlockedBadges;
                USER.displayBadge = data.user.display_badge || USER.displayBadge;
                USER.bio = data.user.bio || USER.bio;
                USER.avatarChoice = data.user.avatar_choice || USER.avatarChoice;
                
                // Update UI
                renderAll();
            }
        })
        .catch(error => {
            console.error('Error loading user data from API:', error);
            // Fall back to local storage
            loadLocal();
            renderAll();
        });
}

/**
 * Load weather data
 */
function loadWeatherData() {
    // Check if geolocation is available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Store location in session storage for other pages
            sessionStorage.setItem('userLatitude', lat);
            sessionStorage.setItem('userLongitude', lon);
            
            // Also store in localStorage for persistence
            localStorage.setItem('weatherLatitude', lat);
            localStorage.setItem('weatherLongitude', lon);
            
            // Fetch weather data from API
            fetch(`/dashboard/api/weather?lat=${lat}&lon=${lon}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Cache the weather data
                    localStorage.setItem('weatherData', JSON.stringify(data));
                    localStorage.setItem('weatherDataTime', Date.now().toString());
                    
                    updateDashboardCards(data);
                    // Initialize charts with the data
                    initializeCharts(data);
                })
                .catch(error => {
                    console.error('Error loading weather data:', error);
                    updateDashboardCards(null);
                    // Initialize charts with dummy data
                    initializeCharts(null);
                });
        }, error => {
            console.error('Geolocation error:', error);
            // Show a user-friendly message
            showToast('Location access is required for weather data. Please enable location services and refresh the page.', 'warning');
            updateWeatherCards(null);
            // Initialize charts with dummy data
            initializeCharts(null);
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });
    } else {
        console.error('Geolocation not supported');
        updateWeatherCards(null);
        // Initialize charts with dummy data
        initializeCharts(null);
    }
}

/**
 * Update weather cards
 */
function updateWeatherCards(data) {
    const temperatureCard = document.querySelector('.stat-card.temperature .stat-info p');
    const humidityCard = document.querySelector('.stat-card.humidity .stat-info p');
    const lightCard = document.querySelector('.stat-card.light .stat-info p');
    const phCard = document.querySelector('.stat-card.ph .stat-info p');
    
    if (data) {
        // Update temperature
        if (temperatureCard && data.temperature) {
            temperatureCard.innerHTML = `${data.temperature}°C <span class="trend ${data.temperature_trend === 'up' ? 'up' : 'down'}"><i class="fas fa-arrow-${data.temperature_trend === 'up' ? 'up' : 'down'}"></i> ${data.temperature_change}°C</span>`;
        }
        
        // Update humidity
        if (humidityCard && data.humidity) {
            humidityCard.innerHTML = `${data.humidity}% <span class="trend ${data.humidity_trend === 'up' ? 'up' : 'down'}"><i class="fas fa-arrow-${data.humidity_trend === 'up' ? 'up' : 'down'}"></i> ${data.humidity_change}%</span>`;
        }
        
        // Update light/UV index
        if (lightCard && data.uv_index) {
            let uvStatus = 'Low';
            if (data.uv_index > 2 && data.uv_index <= 5) uvStatus = 'Moderate';
            if (data.uv_index > 5 && data.uv_index <= 7) uvStatus = 'High';
            if (data.uv_index > 7) uvStatus = 'Very High';
            
            lightCard.innerHTML = `UV: ${data.uv_index} <span class="trend ${data.uv_index > 5 ? 'down' : 'up'}"><i class="fas fa-${data.uv_index > 5 ? 'exclamation-triangle' : 'check'}"></i> ${uvStatus}</span>`;
        }
        
        // Update pH Level (placeholder)
        if (phCard) {
            phCard.innerHTML = `7.0 <span class="trend up"><i class="fas fa-check"></i> Neutral</span>`;
        }
    } else {
        // No data available
        if (temperatureCard) temperatureCard.innerHTML = 'No Data <span class="trend"><i class="fas fa-ban"></i></span>';
        if (humidityCard) humidityCard.innerHTML = 'No Data <span class="trend"><i class="fas fa-ban"></i></span>';
        if (lightCard) lightCard.innerHTML = 'No Data <span class="trend"><i class="fas fa-ban"></i></span>';
        if (phCard) phCard.innerHTML = 'No Data <span class="trend"><i class="fas fa-ban"></i></span>';
    }
}

/**
 * Update dashboard cards with weather data
 */
function updateDashboardCards(data) {
    // Update Temperature
    const tempElement = document.getElementById('temperature-value');
    const tempTrendElement = document.getElementById('temperature-trend');
    if (tempElement) {
        if (data && data.temperature) {
            tempElement.innerHTML = `${data.temperature}°C - Feels Like <span id="feelslike-value">--</span> `;
            if (tempTrendElement) {
                tempTrendElement.innerHTML = `<i class="fas fa-check"></i> Current`;
                tempTrendElement.className = 'trend up';
            }
            // Update feels like temperature
            if (data.feels_like !== undefined) {
                document.getElementById('feelslike-value').textContent = `${data.feels_like}°C`;
            }
        } else {
            tempElement.innerHTML = `N/A - Feels Like <span id="feelslike-value">N/A</span> `;
            if (tempTrendElement) {
                tempTrendElement.innerHTML = ``;
            }
        }
    }
    
    // Update Humidity
    const humidityElement = document.getElementById('humidity-value');
    const humidityTrendElement = document.getElementById('humidity-trend');
    if (humidityElement) {
        if (data && data.humidity) {
            humidityElement.innerHTML = `${data.humidity}% `;
            if (humidityTrendElement) {
                humidityTrendElement.innerHTML = `<i class="fas fa-check"></i> Current`;
                humidityTrendElement.className = 'trend up';
            }
        } else {
            humidityElement.innerHTML = `N/A `;
            if (humidityTrendElement) {
                humidityTrendElement.innerHTML = ``;
            }
        }
    }
    
    // Update Light (using UV index as a proxy)
    const lightElement = document.getElementById('light-value');
    const lightTrendElement = document.getElementById('light-trend');
    const visibilityElement = document.getElementById('visibility-value');
    if (lightElement) {
        if (data && data.uv_index !== undefined) {
            let lightStatus = 'Low';
            if (data.uv_index >= 3 && data.uv_index < 6) {
                lightStatus = 'Moderate';
            } else if (data.uv_index >= 6 && data.uv_index < 8) {
                lightStatus = 'High';
            } else if (data.uv_index >= 8) {
                lightStatus = 'Very High';
            }
            
            lightElement.innerHTML = `${lightStatus}`;
            if (lightTrendElement) {
                lightTrendElement.innerHTML = `<i class="fas fa-check"></i> UV: ${data.uv_index}`;
                lightTrendElement.className = 'trend up';
            }
            
            // Update visibility
            if (data.visibility !== undefined) {
                // Visibility is already in kilometers from the API
                const visibilityKm = data.visibility.toFixed(1);
                visibilityElement.textContent = `Visibility: ${visibilityKm} km`;
            } else {
                visibilityElement.textContent = `Visibility: N/A`;
            }
        } else {
            lightElement.innerHTML = `N/A`;
            visibilityElement.textContent = ` / Visibility N/A`;
            if (lightTrendElement) {
                lightTrendElement.innerHTML = ``;
            }
        }
    }
    
    // Update pH Level (using a placeholder value as pH is not available from weather API)
    const phElement = document.getElementById('ph-value');
    const phTrendElement = document.getElementById('ph-trend');
    if (phElement) {
        phElement.innerHTML = `7.0 `;
        if (phTrendElement) {
            phTrendElement.innerHTML = `<i class="fas fa-check"></i> Neutral`;
            phTrendElement.className = 'trend up';
        }
    }
    
    // Update weather insights card if it exists
    updateWeatherInsights(data);
    
    // Update Wind card
    const windValueElement = document.getElementById('wind-value');
    const windTrendElement = document.getElementById('wind-trend');
    if (windValueElement) {
        if (data && data.wind_speed !== undefined) {
            const direction = data.wind_deg !== undefined ? getWindDirection(data.wind_deg) : 'N/A';
            let windText = `${data.wind_speed} m/s ${direction}`;
            if (data.wind_gust) {
                windText += ` (Gusts: ${data.wind_gust} m/s)`;
            }
            windValueElement.innerHTML = `${windText} `;
            if (windTrendElement) {
                windTrendElement.innerHTML = `<i class="fas fa-check"></i> Current`;
                windTrendElement.className = 'trend up';
            }
        } else {
            windValueElement.innerHTML = `No Data `;
            if (windTrendElement) {
                windTrendElement.innerHTML = ``;
            }
        }
    }
    
    // Update Sky card
    const rainChanceElement = document.getElementById('rain-chance');
    const cloudCoverElement = document.getElementById('cloud-cover');
    if (rainChanceElement && cloudCoverElement) {
        // Update cloud cover
        if (data && data.cloud_cover !== undefined) {
            cloudCoverElement.textContent = `${data.cloud_cover}%`;
        } else {
            cloudCoverElement.textContent = 'N/A';
        }
        
        // Update rain chance/amount
        if (data && data.rain_1h !== undefined) {
            // If we have actual rain amount, show it
            rainChanceElement.textContent = `${data.rain_1h} mm`;
        } else {
            // Otherwise show N/A
            rainChanceElement.textContent = 'N/A';
        }
    }
    
    // Update Moon Phase card
    const moonPhaseElement = document.getElementById('moon-phase');
    if (moonPhaseElement) {
        const today = new Date();
        const phase = getMoonPhase(today);
        moonPhaseElement.textContent = phase;
    }
}

// Function to get wind direction from degrees
function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Function to calculate moon phase based on date
function getMoonPhase(date) {
    // Moon cycle is approximately 29.53 days
    const synodic = 29.53;
    
    // Convert date to Julian date
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Calculate approximate moon age in days
    let c = 0;
    let e = 0;
    let jd = 0;
    
    if (month < 3) {
        year--;
        month += 12;
    }
    
    ++month;
    c = 365.25 * year;
    e = 30.6 * month;
    jd = c + e + day - 694039.09;
    jd /= 29.53;
    
    // Get just the fractional part
    let phase = jd % 1;
    
    if (phase < 0) {
        phase += 1;
    }
    
    // Determine moon phase name based on age
    if (phase < 0.0625 || phase >= 0.9375) {
        return "New Moon";
    } else if (phase < 0.1875) {
        return "Waxing Crescent";
    } else if (phase < 0.3125) {
        return "First Quarter";
    } else if (phase < 0.4375) {
        return "Waxing Gibbous";
    } else if (phase < 0.5625) {
        return "Full Moon";
    } else if (phase < 0.6875) {
        return "Waning Gibbous";
    } else if (phase < 0.8125) {
        return "Last Quarter";
    } else {
        return "Waning Crescent";
    }
}

/**
 * Generate and update weather insights based on current weather data
 */
function updateWeatherInsights(data) {
    const insightsElement = document.getElementById('weather-insights-text');
    if (!insightsElement) return;
    
    // Check if data is null or all three main properties are missing
    if (!data || (data.temperature === undefined && data.humidity === undefined && data.uv_index === undefined)) {
        insightsElement.innerHTML = 'Weather insights unavailable. Please check your location settings.';
        return;
    }
    
    // Extract weather data
    const temp = data.temperature;
    const humidity = data.humidity;
    const uvIndex = data.uv_index;
    const condition = data.weather_condition || '';
    const description = data.weather_description || '';
    
    // Generate insights based on weather conditions
    let insights = '';
    
    // Temperature insights
    if (temp !== undefined) {
        if (temp < 5) {
            insights += `It's quite cold at ${temp}°C. Bundle up with layers and consider a warm hat and gloves. `;
        } else if (temp >= 5 && temp < 15) {
            insights += `At ${temp}°C, it's cool but manageable. A light jacket should be sufficient for outdoor activities. `;
        } else if (temp >= 15 && temp < 25) {
            insights += `The temperature is a comfortable ${temp}°C, perfect for most outdoor activities. `;
        } else if (temp >= 25 && temp < 30) {
            insights += `It's warm at ${temp}°C. Consider light clothing and stay hydrated if you're active outside. `;
        } else {
            insights += `It's hot at ${temp}°C! Stay hydrated, seek shade when possible, and consider limiting strenuous outdoor activities. `;
        }
    }
    
    // UV Index insights
    if (uvIndex !== undefined) {
        if (uvIndex < 3) {
            insights += `The UV index is low (${uvIndex}), but it's still good practice to apply sunscreen if you'll be outside for extended periods. `;
        } else if (uvIndex >= 3 && uvIndex < 6) {
            insights += `With a moderate UV index of ${uvIndex}, apply SPF 30+ sunscreen and wear a hat during peak sun hours. `;
        } else if (uvIndex >= 6 && uvIndex < 8) {
            insights += `The UV index is high (${uvIndex}). Apply broad-spectrum SPF 30+ sunscreen, wear protective clothing, and limit direct sun exposure between 10am-4pm. `;
        } else if (uvIndex >= 8) {
            insights += `Very high UV levels (${uvIndex}) today! Take extra precautions: apply and reapply broad-spectrum SPF 50+, wear protective clothing, and minimize sun exposure. `;
        }
    }
    
    // Humidity insights
    if (humidity !== undefined) {
        if (humidity < 30) {
            insights += `The air is quite dry with ${humidity}% humidity. Consider using a moisturizer and staying well-hydrated. `;
        } else if (humidity >= 30 && humidity < 50) {
            insights += `Humidity is at a comfortable ${humidity}%, creating ideal conditions for most activities. `;
        } else if (humidity >= 50 && humidity < 70) {
            insights += `With ${humidity}% humidity, the air feels a bit heavy. Stay hydrated if you're active outdoors. `;
        } else {
            insights += `High humidity (${humidity}%) will make it feel warmer than the actual temperature. Take breaks and hydrate frequently during outdoor activities. `;
        }
    }
    
    // Weather condition specific insights
    if (condition.toLowerCase().includes('rain') || description.toLowerCase().includes('rain')) {
        insights += `Rainy conditions expected. Bring an umbrella and consider waterproof footwear. `;
    } else if (condition.toLowerCase().includes('snow') || description.toLowerCase().includes('snow')) {
        insights += `Snowy conditions expected. Dress warmly in layers and wear appropriate footwear with good traction. `;
    } else if (condition.toLowerCase().includes('cloud') || description.toLowerCase().includes('cloud')) {
        insights += `Cloudy skies today. While UV exposure is reduced, don't forget sun protection if you'll be out for long periods. `;
    } else if (condition.toLowerCase().includes('clear') || description.toLowerCase().includes('clear') || condition.toLowerCase().includes('sun') || description.toLowerCase().includes('sun')) {
        insights += `Clear, sunny skies today! It's a great day for outdoor activities, but remember your sun protection. `;
    }
    
    // Add a general eco-friendly tip
    const ecoTips = [
        "Consider walking or biking for short trips to reduce your carbon footprint.",
        "Today is a good day to air-dry laundry instead of using a dryer if possible.",
        "Remember to carry a reusable water bottle to stay hydrated sustainably.",
        "Consider the environmental impact of your food choices today.",
        "Take a moment to appreciate nature around you today."
    ];
    
    const randomTip = ecoTips[Math.floor(Math.random() * ecoTips.length)];
    insights += `Eco Tip: ${randomTip}`;
    
    // Update the insights element
    insightsElement.innerHTML = insights;
}

/* Modal & toast helpers */
function showModal(innerHTML){ 
    const modalRoot = document.getElementById('modalRoot');
    if (!modalRoot) return;
    
    modalRoot.innerHTML = `<div class='modal-backdrop' onclick='if(event.target.classList.contains("modal-backdrop")) closeModal()'><div class='modal' onclick='event.stopPropagation()'>${innerHTML}</div></div>`; 
}

function openModal(html){ 
    showModal(html); 
}

function closeModal(){ 
    const modalRoot = document.getElementById('modalRoot');
    if (modalRoot) modalRoot.innerHTML = ''; 
}

function showToast(text, ttl=2400){ 
    const toastRoot = document.getElementById('toastRoot');
    if (!toastRoot) return;
    
    const div = document.createElement('div'); 
    div.className='toast'; 
    div.textContent = text; 
    toastRoot.appendChild(div); 
    
    // Make the toast visible (for animation)
    setTimeout(() => div.classList.add('visible'), 10);
    
    setTimeout(()=>{ 
        div.classList.remove('visible');
        setTimeout(()=>div.remove(),400);
    }, ttl); 
}

/**
 * Initialize all charts in the dashboard
 */
function initializeCharts(data) {
    // Initialize analytics chart
    initializeAnalyticsChart();
    
    // Initialize other charts if needed
    initializeTemperatureChart(data);
    initializePHChart(data);
    initializeCO2Chart();
    initializeVitaminDChart();
}

/**
 * Initialize the analytics chart
 */
function initializeAnalyticsChart() {
    const analyticsChartEl = document.getElementById('analyticsChart');
    if (!analyticsChartEl) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(analyticsChartEl);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Sample data for the chart
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = {
        labels: labels,
        datasets: [{
            label: 'Carbon Footprint (kg CO₂)',
            data: [120, 115, 110, 105, 100, 95, 90, 85, 80, 75, 70, 65],
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            tension: 0.4,
            fill: true
        }, {
            label: 'Energy Usage (kWh)',
            data: [200, 190, 185, 180, 175, 170, 165, 160, 155, 150, 145, 140],
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.2)',
            tension: 0.4,
            fill: true
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    };
    
    // Create the chart
    new Chart(analyticsChartEl, config);
    
    // Add event listeners for time period buttons
    const timeButtons = document.querySelectorAll('.time-btn');
    if (timeButtons) {
        timeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                timeButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update chart data based on selected time period
                // This is just a simulation - in a real app, you'd fetch data for the selected period
                const period = this.dataset.period;
                let newData;
                
                if (period === 'day') {
                    newData = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
                } else if (period === 'month') {
                    newData = [120, 115, 110, 105, 100, 95, 90, 85, 80, 75, 70, 65];
                } else if (period === 'year') {
                    newData = [1200, 1150, 1100, 1050, 1000, 950, 900, 850, 800, 750, 700, 650];
                }
                
                // Update chart data
                const chart = Chart.getChart(analyticsChartEl);
                chart.data.datasets[0].data = newData;
                chart.data.datasets[1].data = newData.map(val => val * 1.5);
                chart.update();
            });
        });
    }
}

/**
 * Initialize the temperature chart
 */
function initializeTemperatureChart(data) {
    const temperatureChartEl = document.getElementById('temperatureChart');
    if (!temperatureChartEl) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(temperatureChartEl);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Sample data for the chart
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const chartData = {
        labels: labels,
        datasets: [{
            label: 'Temperature (°C)',
            data: [22, 23, 25, 24, 22, 21, 20],
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.2)',
            tension: 0.4,
            fill: true
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    };
    
    // Create the chart
    new Chart(temperatureChartEl, config);
}

/**
 * Initialize the pH chart
 */
function initializePHChart(data) {
    const phChartEl = document.getElementById('phChart');
    if (!phChartEl) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(phChartEl);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Sample data for the chart
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'pH Level',
            data: [6.8, 7.0, 7.2, 7.1, 6.9, 7.0, 7.2],
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.2)',
            tension: 0.4,
            fill: true
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    };
    
    // Create the chart
    new Chart(phChartEl, config);
}

/**
 * Initialize the CO2 chart
 */
function initializeCO2Chart() {
    const co2ChartEl = document.getElementById('co2Chart');
    if (!co2ChartEl) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(co2ChartEl);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Sample data for the chart
    const chartData = {
        labels: ['Transport', 'Food', 'Energy', 'Other'],
        datasets: [{
            label: 'CO₂ Emissions (kg)',
            data: [45, 30, 20, 5],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    };
    
    // Create the chart
    new Chart(co2ChartEl, config);
}

/**
 * Initialize the Vitamin D chart
 */
function initializeVitaminDChart() {
    const vitaminChartEl = document.getElementById('vitaminChart');
    if (!vitaminChartEl) return;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(vitaminChartEl);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Sample data for the chart
    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Vitamin D (IU)',
            data: [400, 600, 800, 500, 300, 900, 700],
            borderColor: '#FFC107',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            tension: 0.4,
            fill: true
        }]
    };
    
    // Chart configuration
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    };
    
    // Create the chart
    new Chart(vitaminChartEl, config);
}

function escapeHtml(s){ 
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}

/**
 * Carbon Footprint Calculator functionality
 */
function initializeCarbonCalculator() {
    // Get the calculate CO2 footprint button
    const calculateBtn = document.querySelector('.calculate-co2-btn');
    const logEntryBtn = document.getElementById('log-entry');
    const categorySelect = document.getElementById('category-select');
    
    // Handle the Calculate CO2 Footprint button
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            const categorySelect = document.getElementById('categorySelect');
            if (categorySelect) {
                const category = categorySelect.value;
                const popupId = `popup-${category}`;
                const popup = document.getElementById(popupId);
                
                if (popup) {
                    popup.style.display = 'flex';
                    
                    // Get the iframe inside the popup
                    const iframe = popup.querySelector('.popup-iframe');
                    if (iframe) {
                        // Set the src attribute based on the category
                        if (category === 'transport') {
                            iframe.src = 'transport.html';
                        } else if (category === 'food') {
                            iframe.src = 'food.html';
                        } else if (category === 'energy') {
                            iframe.src = 'energy.html';
                        }
                    }
                }
            }
        });
    }
    
    // Handle the log entry button
    if (logEntryBtn && categorySelect) {
        logEntryBtn.addEventListener('click', function() {
            const category = categorySelect.value;
            const popupId = `popup-${category}`;
            const popup = document.getElementById(popupId);
            
            console.log('Opening popup for category:', category, 'Popup ID:', popupId);
            
            if (popup) {
                popup.style.display = 'flex';
                
                // Get the iframe inside the popup
                const iframe = popup.querySelector('.popup-iframe');
                if (iframe) {
                    // Set the src attribute based on the category
                    if (category === 'transport') {
                        iframe.src = '/api/carbon/transport';
                    } else if (category === 'food') {
                        iframe.src = '/api/carbon/food';
                    } else if (category === 'energy') {
                        iframe.src = '/api/carbon/energy';
                    }
                    console.log('Set iframe src to:', iframe.src);
                }
            } else {
                console.error('Popup not found for category:', category);
            }
        });
    }
    
    // Add event listeners to close buttons for popups
    const closeButtons = document.querySelectorAll('.popup-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const popup = this.closest('.popup-overlay');
            if (popup) {
                popup.style.display = 'none';
            }
        });
    });
}

// Function to close popups
function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
    }
}