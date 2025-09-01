// Badge list unchanged
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

    // Avatars: use DiceBear seeds to match dashboard.html look
    const AVATAR_URL = seed => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
    const AVATARS = [
      {id:'m1',seed:'Explorer_Male_1'}, {id:'m2',seed:'Hero_Male_2'}, {id:'m3',seed:'Guardian_Male_3'}, {id:'m4',seed:'Adventurer_Male_4'}, {id:'m5',seed:'Wanderer_Male_5'},
      {id:'f1',seed:'Nature_Female_1'}, {id:'f2',seed:'Voyager_Female_2'}, {id:'f3',seed:'Healer_Female_3'}, {id:'f4',seed:'Healer_Female_4'}, {id:'f5',seed:'Voyager_Female_5'}
    ];

    let USER = {
      id: 'user_001', name:'Jane Doe', email:'jane@example.com', points:0,
      unlockedBadges:[], displayBadge:null, bio:'', avatarChoice:null, avatarUpload:null, activity:[]
    };

    function saveLocal(){ localStorage.setItem('demo_user_v3', JSON.stringify(USER)); }
    function loadLocal(){ const d = localStorage.getItem('demo_user_v3'); if(d) USER = JSON.parse(d); }

    function init(){
      loadLocal();
      if(!USER.unlockedBadges.includes('Seedling')){ USER.unlockedBadges.push('Seedling'); USER.activity.unshift({ts:Date.now(),text:'Seedling unlocked on first login'}); }
      renderAll();
    }

    function renderAll(){
      document.getElementById('profileName').textContent = USER.name || 'User';
      document.getElementById('profileEmail').textContent = USER.email || '';
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

    function renderBadges(){ const container = document.getElementById('badgesContainer'); container.innerHTML = ''; for(const b of BADGES){ const unlocked = USER.unlockedBadges.includes(b.name); const card = document.createElement('div'); card.className = 'badge-card '+(unlocked? 'unlocked':'locked'); card.innerHTML = `<div class='badge-icon'>${b.icon}</div><div class='badge-name'>${b.name}</div><div class='badge-desc'>${b.desc}</div><button class='claim-btn ${unlocked? 'primary':''}' onclick="onBadgeClick('${b.name}')">${unlocked? 'Select':'Locked'}</button>`; container.appendChild(card);} }

    function onBadgeClick(name){ if(USER.unlockedBadges.includes(name)){ USER.displayBadge = name; USER.activity.unshift({ts:Date.now(),text:`Displayed ${name} on profile`}); showToast(`${name} will now appear on your profile`); renderAll(); } else { showToast(`Badge locked — ${BADGES.find(b=>b.name===name).desc}`); } }

    function renderProgress(){ const level = computeLevel(); const currentBadge = BADGES[Math.max(0,level-1)]; const nextBadge = BADGES[Math.min(BADGES.length-1, level)]; const currentBase = currentBadge.points; const nextBase = nextBadge.points; const percent = Math.round(((USER.points - currentBase) / Math.max(1, nextBase - currentBase)) * 100); document.getElementById('rankFill').style.width = Math.max(0,Math.min(100,percent)) + '%'; document.getElementById('rankPercentText').textContent = Math.max(0,Math.min(100,percent)) + '%'; document.getElementById('rankDetails').textContent = `Level ${level} — ${currentBadge.name} • ${USER.points} / ${nextBadge.points} points`; }

    function renderHabits(){ const list = document.getElementById('habitList'); list.innerHTML = ''; const habits = [ {id:'bike',name:'Bike instead of car',count:3}, {id:'recycle',name:'Recycling reported',count:7}, {id:'plant',name:'Plant a tree',count:1} ]; for(const h of habits){ const el = document.createElement('div'); el.className='habit'; el.innerHTML = `<div style='display:flex;gap:10px;align-items:center'><div style='font-size:18px'>✅</div><div><div style='font-weight:600'>${h.name}</div><div class='small-muted'>Completed ${h.count} times</div></div></div><div><button class='btn ghost' onclick="openLogHabitModal('${h.id}','${h.name}')">Log</button></div>`; list.appendChild(el); } }

    function renderActivity(){ const el = document.getElementById('activityLog'); el.innerHTML=''; for(const a of USER.activity.slice(0,30)){ const d = new Date(a.ts).toLocaleString(); const div = document.createElement('div'); div.style.padding='6px 0'; div.innerHTML = `<div style='font-size:13px'>${a.text}</div><div class='small-muted' style='font-size:12px'>${d}</div>`; el.appendChild(div);} }

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
    async function handleEcoBotPoints(amount, reason){ if(!amount || amount<=0) return; USER.points += amount; USER.activity.unshift({ts:Date.now(),text:`+${amount} points — ${reason||'EcoBot'}`}); checkUnlocks(); renderAll(); try{ await fetch('/api/user/addPoints',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId:USER.id,amount,reason})}); }catch(e){ console.error('Persist points failed',e); } }
    window.handleEcoBotPoints = handleEcoBotPoints;

    function addPoints(amount, reason){ USER.points += amount; USER.activity.unshift({ts:Date.now(),text:`+${amount} points — ${reason}`}); checkUnlocks(); renderAll(); fetch('/api/user/addPoints',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userId:USER.id,amount,reason})}).catch(()=>{}); }

    function checkUnlocks(){ for(const b of BADGES){ if(!USER.unlockedBadges.includes(b.name) && USER.points >= b.points){ USER.unlockedBadges.push(b.name); USER.activity.unshift({ts:Date.now(),text:`Unlocked badge: ${b.name}`}); showToast(`Unlocked: ${b.name}`); } } }

    /* Habit logging modal — realistic: requires confirmation & server validation */
    function openLogHabitModal(habitId, habitName){ openModal(`<div style='padding:12px;color:#bfeff0'><h3>Log: ${habitName}</h3><p class='small-muted'>Confirm logging this action. The site should validate it server-side and then award points.</p><div style='display:flex;justify-content:flex-end;gap:8px;margin-top:12px'><button class='btn ghost' onclick='closeModal()'>Cancel</button><button class='btn' onclick="confirmLogHabit('${habitId}','${habitName}')">Confirm</button></div></div>`); }
    
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
    function openEditProfile(){ const gallery = AVATARS.map(a=>`<div class='avatar-option' data-id='${a.id}' onclick='selectAvatarOption("${a.id}")'><img src='${AVATAR_URL(a.seed)}' alt='${a.id}'/></div>`).join(''); const html = `
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
    `; showModal(html);
      setTimeout(()=>{ // mark selected
        document.querySelectorAll('.avatar-option').forEach(el=>el.classList.toggle('selected', el.dataset.id === USER.avatarChoice));
      },80);
    }

    function selectAvatarOption(id){ USER.avatarChoice = id; USER.avatarUpload = null; document.querySelectorAll('.avatar-option').forEach(el=>el.classList.toggle('selected', el.dataset.id===id)); }

    function handleAvatarUpload(e){ const f = e.target.files && e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ()=>{ USER.avatarUpload = reader.result; USER.avatarChoice = null; renderAll(); const front = document.getElementById('qrFront'); if(front) front.innerHTML = `<img src='${USER.avatarUpload}' style='width:100%;height:100%;border-radius:12px'/>`; showToast('Profile image uploaded (saved locally).'); }; reader.readAsDataURL(f); }

    function saveProfile(){ const n = document.getElementById('editName').value.trim(); const e = document.getElementById('editEmail').value.trim(); const b = document.getElementById('editBio').value.trim(); if(n) USER.name = n; if(e) USER.email = e; USER.bio = b; USER.activity.unshift({ts:Date.now(),text:'Profile updated'}); closeModal(); renderAll(); // persist to server in production
    }

    function toggleQR(){ const card = document.getElementById('qrCard'); if(card) card.classList.toggle('flipped'); }
    function shareProfile(){ const url = window.location.href.split('?')[0] + '?user=' + encodeURIComponent(USER.id); navigator.clipboard.writeText(url).then(()=> showToast('Profile link copied to clipboard')); }

    function openBadgeSelector(){ const unlocked = USER.unlockedBadges.slice(0); let body = `<div style='padding:12px;color:#bfeff0'><h3>Display Badge on Profile</h3><div class='small-muted' style='margin-bottom:8px'>Choose one badge to display on your public profile, or choose None.</div>`; body += `<div style='display:flex;flex-wrap:wrap;gap:8px'>`; body += `<label style='display:flex;align-items:center;gap:8px'><input type='radio' name='showBadge' value='none' ${!USER.displayBadge? 'checked':''}/> None</label>`; for(const b of unlocked) body += `<label style='display:flex;align-items:center;gap:8px'><input type='radio' name='showBadge' value='${b}' ${USER.displayBadge===b? 'checked':''}/> ${b}</label>`; body += `</div><div style='display:flex;justify-content:flex-end;gap:8px;margin-top:12px'><button class='btn ghost' onclick='closeModal()'>Cancel</button><button class='btn' onclick='saveBadgeSelection()'>Save</button></div></div>`; showModal(body); }
    function saveBadgeSelection(){ const r = document.querySelector('input[name="showBadge"]:checked'); USER.displayBadge = r && r.value !== 'none' ? r.value : null; USER.activity.unshift({ts:Date.now(),text: USER.displayBadge ? `Displayed ${USER.displayBadge} on profile` : 'Removed badge from profile'}); closeModal(); renderAll(); }

    function renderProfileBadge(){ const el = document.getElementById('profileBadge'); if(!USER.displayBadge){ el.style.display='none'; return; } const b = BADGES.find(x=>x.name===USER.displayBadge); el.style.display='flex'; el.innerHTML = b ? b.icon : '🏅'; }

    /* Modal & toast helpers */
    function showModal(innerHTML){ document.getElementById('modalRoot').innerHTML = `<div class='modal-backdrop' onclick='if(event.target.classList.contains("modal-backdrop")) closeModal()'><div class='modal' onclick='event.stopPropagation()'>${innerHTML}</div></div>`; }
    function openModal(html){ showModal(html); }
    function closeModal(){ document.getElementById('modalRoot').innerHTML = ''; }
    function showToast(text, ttl=2400){ const root = document.getElementById('toastRoot'); const div = document.createElement('div'); div.className='toast'; div.textContent = text; root.appendChild(div); setTimeout(()=>{ div.style.opacity=0; setTimeout(()=>div.remove(),400)}, ttl); }

    function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Init
    document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('DOMContentLoaded', init);

        // Dark Mode Toggle with smooth transition
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('change', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', darkModeToggle.checked);
            
            // Add transition class for smooth color changes
            document.body.classList.add('color-transition');
            setTimeout(() => {
                document.body.classList.remove('color-transition');
            }, 500);
        });

        // Check for saved dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            darkModeToggle.checked = true;
            document.body.classList.add('dark-mode');
        }

        // Mobile Menu Toggle with animation
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 576 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });

        // Page Navigation
        const menuLinks = document.querySelectorAll('.menu li a');
        const pageContents = document.querySelectorAll('.page-content');
        
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
                document.getElementById(targetPage).style.display = 'block';
                
                // Update active menu item
                menuLinks.forEach(item => {
                    item.parentElement.classList.remove('active');
                });
                this.parentElement.classList.add('active');
                
                // Close sidebar on mobile
                if (window.innerWidth <= 576) {
                    sidebar.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            });
        });

        // Notification System - Global functionality
        const notificationPopup = document.getElementById('notificationPopup');
        const notificationBadge = document.querySelectorAll('.badge');
        const notificationItems = document.querySelectorAll('.notification-item');
        
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
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            });
        }
        
        // Display notifications in popup
        function displayNotifications() {
            const notificationList = document.querySelector('.notification-list');
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
        
        // Toggle notification popup
        document.querySelectorAll('#notificationsBtn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                notificationPopup.classList.toggle('active');
                displayNotifications();
                
                // Mark all as read when opened
                notifications = notifications.map(n => ({ ...n, read: true }));
                localStorage.setItem('notifications', JSON.stringify(notifications));
                updateNotificationCount();
            });
        });
        
        // Close notification popup when clicking outside
        document.addEventListener('click', function() {
            notificationPopup.classList.remove('active');
        });
        
        // Prevent popup from closing when clicking inside it
        notificationPopup.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Clear all notifications
        document.querySelector('.notification-clear').addEventListener('click', function() {
            notifications = [];
            localStorage.setItem('notifications', JSON.stringify(notifications));
            document.querySelector('.notification-list').innerHTML = '<li class="notification-item"><div class="notification-message">No notifications</div></li>';
            updateNotificationCount();
        });
        
        // Initialize notification count on page load
        updateNotificationCount();

// Logout Button
document.querySelectorAll('#logoutBtn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userData');
                window.location.href = '/';
            } else {
                console.error('Logout failed');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    });
});
        // Export functionality - add this to your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Toggle export dropdown
    const exportDataBtn = document.getElementById('exportDataBtn');
    const exportDropdown = document.querySelector('.export-dropdown');
    
    if (exportDataBtn && exportDropdown) {
        exportDataBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            exportDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            exportDropdown.classList.remove('active');
        });
        
        // Handle export options
        document.querySelectorAll('.export-dropdown a').forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const type = this.getAttribute('data-type');
                exportData(type);
                exportDropdown.classList.remove('active');
            });
        });
    }
});

// Main export function
let librariesLoading = false;

function exportData(type) {
    if (librariesLoading) {
        alert('Please wait while libraries finish loading...');
        return;
    }
    const data = [
        { metric: "Avg. Temperature", value: "24.2°C", change: "+0.5°C" },
        { metric: "Avg. Humidity", value: "67%", change: "-2%" },
        { metric: "Light Hours", value: "14h", change: "+1h" },
        { metric: "Water Changes", value: "3", change: "+1" }
    ];

    try {
        switch(type) {
            case 'csv':
                exportToCSV(data);
                break;
            case 'pdf':
                exportToPDF(data);
                break;
            case 'json':
                exportToJSON(data);
                break;
            default:
                alert('Export type not supported');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Error during export: ' + error.message);
    }
}

// CSV Export
function exportToCSV(data) {
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(item => {
        const row = headers.map(header => {
            // Escape commas in values
            const value = item[header];
            return `"${value.replace(/"/g, '""')}"`;
        });
        csvRows.push(row.join(','));
    });
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecosphere_analytics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        URL.revokeObjectURL(url);
        alert('Data exported successfully as CSV!');
    }, 100);
}

// PDF Export with proper initialization
function initPDFExport(data) {
    if (typeof window.jspdf !== 'undefined') {
        exportToPDF(data);
    } else {
        librariesLoading = true;
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js', () => {
                librariesLoading = false;
                exportToPDF(data);
            });
        });
    }
}

function exportToPDF(data) {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.text('EcoSphere Analytics Report', 14, 15);
        
        // Date
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
        
        // Table
        const headers = [Object.keys(data[0])];
        const rows = data.map(item => Object.values(item));
        
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 30,
            styles: {
                cellPadding: 5,
                fontSize: 10,
                valign: 'middle'
            },
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: 255,
                fontStyle: 'bold'
            }
        });
        
        doc.save('ecosphere_analytics.pdf');
        alert('Data exported successfully as PDF!');
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Failed to generate PDF. Please try again.');
    }
}

// JSON Export
function exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecosphere_analytics.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        URL.revokeObjectURL(url);
        alert('Data exported successfully as JSON!');
    }, 100);
}
// Add these new functions to your existing JavaScript

// DOCX Export with proper initialization
function initDOCXExport(data) {
    if (typeof docx !== 'undefined') {
        exportToDOCX(data);
    } else {
        librariesLoading = true;
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/docx/7.8.2/docx.min.js', () => {
            librariesLoading = false;
            exportToDOCX(data);
        });
    }
}

function exportToDOCX(data) {
    try {
        const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;
        
        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: "Metric", bold: true })],
                        width: { size: 3500, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: "Value", bold: true })],
                        width: { size: 2000, type: WidthType.DXA }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: "Change", bold: true })],
                        width: { size: 2000, type: WidthType.DXA }
                    })
                ]
            }),
            ...data.map(item => new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph(item.metric)]
                    }),
                    new TableCell({
                        children: [new Paragraph(item.value)]
                    }),
                    new TableCell({
                        children: [new Paragraph(item.change)]
                    })
                ]
            }))
        ];

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "EcoSphere Analytics Report",
                                bold: true,
                                size: 28
                            })
                        ],
                        alignment: AlignmentType.CENTER
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        docx.Packer.toBlob(doc).then(blob => {
            saveAs(blob, "ecosphere_analytics.docx");
            alert('Data exported successfully as DOCX!');
        });
    } catch (error) {
        console.error('DOCX export error:', error);
        alert('Failed to generate DOCX. Please try again.');
    }
}

// PNG Export
function exportToPNG() {
    if (typeof html2canvas === 'undefined') {
        alert('Image export requires html2canvas. Loading it now...');
        loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js', () => {
            exportToPNG(); // Retry after loading
        });
        return;
    }

    const element = document.querySelector('.card'); // Export the card element
    
    html2canvas(element, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'ecosphere_analytics.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        alert('Data exported successfully as PNG!');
    });
}

// JPEG Export
function exportToJPEG() {
    if (typeof html2canvas === 'undefined') {
        alert('Image export requires html2canvas. Loading it now...');
        loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js', () => {
            exportToJPEG(); // Retry after loading
        });
        return;
    }

    const element = document.querySelector('.card'); // Export the card element
    
    html2canvas(element, {
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'ecosphere_analytics.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9); // 0.9 = quality
        link.click();
        alert('Data exported successfully as JPEG!');
    });
}

// Add these cases to your existing exportData function
function exportData(type) {
    // Sample data - replace with your actual analytics data
    const data = [
        { metric: "Avg. Temperature", value: "24.2°C", change: "+0.5°C" },
        { metric: "Avg. Humidity", value: "67%", change: "-2%" },
        { metric: "Light Hours", value: "14h", change: "+1h" },
        { metric: "Water Changes", value: "3", change: "+1" }
    ];

    try {
        switch(type) {
            case 'csv':
                exportToCSV(data);
                break;
            case 'pdf':
                exportToPDF(data);
                break;
            case 'docx':
                exportToDOCX(data);
                break;
            case 'json':
                exportToJSON(data);
                break;
            case 'png':
                exportToPNG();
                break;
            case 'jpeg':
                exportToJPEG();
                break;
            default:
                alert('Export type not supported');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Error during export: ' + error.message);
    }
}

// Helper function to save files
function saveAs(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

        // Chart Data Storage
        const chartData = {
            temperatureChart: {
                day: {
                    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'],
                    data: [22, 23, 24.5, 25, 24, 23, 22]
                },
                week: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    data: [21, 22, 23.5, 24, 23.5, 23, 22]
                },
                month: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    data: [22.5, 23.2, 23.8, 22.9]
                }
            },
            phChart: {
                day: {
                    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM'],
                    data: [7.0, 7.1, 7.2, 7.1, 7.0, 7.1, 7.0]
                },
                week: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    data: [6.9, 7.0, 7.2, 7.1, 7.0, 6.9, 7.0]
                },
                month: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    data: [7.1, 7.0, 6.9, 7.0]
                }
            }
        };

        // Initialize Charts
        const tempCtx = document.getElementById('temperatureChart').getContext('2d');
        const tempChart = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: chartData.temperatureChart.day.labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: chartData.temperatureChart.day.data,
                    borderColor: '#ff9a9e',
                    backgroundColor: 'rgba(255, 154, 158, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, min: 20, max: 26, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                    x: { grid: { display: false } }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' }
            }
        });

        const phCtx = document.getElementById('phChart').getContext('2d');
        const phChart = new Chart(phCtx, {
            type: 'line',
            data: {
                labels: chartData.phChart.day.labels,
                datasets: [{
                    label: 'pH Level',
                    data: chartData.phChart.day.data,
                    borderColor: '#84fab0',
                    backgroundColor: 'rgba(132, 250, 176, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: false, min: 6.5, max: 7.5, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                    x: { grid: { display: false } }
                },
                animation: { duration: 1000, easing: 'easeOutQuart' }
            }
        });

        // Analytics Chart
        const analyticsCtx = document.getElementById('analyticsChart').getContext('2d');
        const analyticsChart = new Chart(analyticsCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Temperature',
                        data: [22, 23, 24, 25, 26, 27],
                        backgroundColor: 'rgba(255, 154, 158, 0.7)',
                        borderColor: '#ff9a9e',
                        borderWidth: 1
                    },
                    {
                        label: 'Humidity',
                        data: [70, 68, 65, 67, 66, 64],
                        backgroundColor: 'rgba(161, 196, 253, 0.7)',
                        borderColor: '#a1c4fd',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Timeframe Switching Functionality
        document.querySelectorAll('.timeframe-btn').forEach(button => {
            button.addEventListener('click', function() {
                const chartCard = this.closest('.chart-card');
                const chartId = chartCard.querySelector('canvas').id.replace('Chart', '').toLowerCase() + 'Chart';
                const timeframe = this.dataset.timeframe;
                
                // Update active button state
                chartCard.querySelectorAll('.timeframe-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                
                // Update the chart
                updateChartTimeframe(chartId, timeframe);
            });
        });

        function updateChartTimeframe(chartId, timeframe) {
            const chart = chartId === 'temperatureChart' ? tempChart : phChart;
            const data = chartData[chartId][timeframe];
            
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.data;
            
            // Adjust Y-axis range for month view
            if (timeframe === 'month') {
                chart.options.scales.y.min = chartId === 'temperatureChart' ? 20 : 6.5;
                chart.options.scales.y.max = chartId === 'temperatureChart' ? 26 : 7.5;
            }
            
            chart.update();
        }

        // Carbon Footprint Chart
        const co2Ctx = document.getElementById('co2Chart').getContext('2d');
        const co2Chart = new Chart(co2Ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [
                    {
                        label: 'Transport CO₂',
                        data: Array.from({length: 24}, (_, i) => Math.random() * 5 + (i > 8 && i < 18 ? 10 : 5)),
                        borderColor: '#a1c4fd',
                        backgroundColor: 'rgba(161, 196, 253, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Food CO₂',
                        data: Array.from({length: 24}, (_, i) => Math.random() * 3 + (i > 11 && i < 14 ? 8 : (i > 18 && i < 20 ? 6 : 3))),
                        borderColor: '#84fab0',
                        backgroundColor: 'rgba(132, 250, 176, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Energy CO₂',
                        data: Array.from({length: 24}, (_, i) => Math.random() * 4 + (i > 6 && i < 22 ? 7 : 2)),
                        borderColor: '#ffecd2',
                        backgroundColor: 'rgba(255, 236, 210, 0.2)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kg CO₂',
                            color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'rgba(0, 0, 0, 0.7)'
                        }
                    }
                }
            }
        });
        
document.addEventListener("DOMContentLoaded", function() {
    const calcBtn = document.getElementById("log-entry");
    const categorySelect = document.getElementById("category-select");

    calcBtn.addEventListener("click", function(e) {
        e.preventDefault();
        const selected = categorySelect.value;

        // Hide any open popups first
        document.querySelectorAll(".popup-overlay").forEach(popup => {
            popup.style.display = "none";
        });

        if (selected === "transport") {
            document.getElementById("popup-transport").style.display = "block";
        } else if (selected === "food") {
            document.getElementById("popup-food").style.display = "block";
        } else if (selected === "energy") {
            document.getElementById("popup-energy").style.display = "block";
        }
    });
});

// Close popup function
function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}

        // Vitamin D Page Functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Tab Switching
            document.getElementById('auto-detect').addEventListener('click', function() {
                this.classList.add('active');
                document.getElementById('manual-input').classList.remove('active');
                document.getElementById('auto-section').style.display = 'block';
                document.getElementById('manual-section').style.display = 'none';
            });

            document.getElementById('manual-input').addEventListener('click', function() {
                this.classList.add('active');
                document.getElementById('auto-detect').classList.remove('active');
                document.getElementById('auto-section').style.display = 'none';
                document.getElementById('manual-section').style.display = 'block';
            });

            // 🌞 Vitamin D Estimator Fix
document.addEventListener("DOMContentLoaded", function () {
    const detectBtn = document.getElementById("detect-location-btn");
    const manualBtn = document.getElementById("manual-city-btn");


// --- Function to auto-detect user location ---
function autoDetectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Success: we got coordinates
function successLocation(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    // Send coordinates to backend (Flask /vitamin route)
    fetch("api/vitamin/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: lat, lon: lon })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            updateDashboard(data);
        }
    })
    .catch(err => console.error("Fetch error:", err));
}

// Error: user denied location or problem occurred
function errorLocation(error) {
    console.error("Geolocation error:", error);
    alert("Please allow location access for Vitamin D estimation.");
}

// --- Update dashboard with values ---
function updateDashboard(data) {
    // Assume your HTML has placeholders with IDs
    document.getElementById("temperature").innerText = data.temperature + "°C";
    document.getElementById("humidity").innerText = data.humidity + "%";
    document.getElementById("uvIndex").innerText = data.uv_index;
    document.getElementById("phLevel").innerText = data.ph || "N/A"; // only if you calculate pH
}

// --- Auto refresh every 10 minutes ---
setInterval(autoDetectLocation, 600000);


    // Manual city selection
    if (manualBtn) {
        manualBtn.addEventListener("click", function () {
            const city = document.getElementById("manual-city-input").value;
            if (!city) return;

            fetch('api/vitamin/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: city })
            })
            .then(res => res.json())
            .then(data => updateVitaminResult(data))
            .catch(err => console.error(err));
        });
    }

    // Update UI
    function updateVitaminResult(data) {
        if (data.error) {
            document.getElementById("uv-index").textContent = "Error";
            document.getElementById("vitamin-status").textContent = data.error;
        } else {
            document.getElementById("uv-index").textContent = data.uv_index;
            document.getElementById("vitamin-status").textContent = data.vitamin_status;
        }
    }
});


            // Country/City Selection
            const countries = [
                { name: 'Bangladesh', cities: ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Barishal', 'Rangpur', 'Rajshahi', 'Mymensingh'] },
                { name: 'India', cities: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad'] },
                { name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Miami'] },
                { name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow'] },
                { name: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Nagoya', 'Fukuoka'] },
                { name: 'China', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Wuhan'] },
                { name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton'] },
                { name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'] },
                { name: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte'] },
                { name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart'] },
                { name: 'France', cities: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Toulouse', 'Bordeaux'] },
                { name: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Florence', 'Venice', 'Turin'] },
                { name: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju'] },
                { name: 'Singapore', cities: ['Singapore'] },
                { name: 'Malaysia', cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Kuching', 'Kota Kinabalu', 'Malacca'] },
                { name: 'Thailand', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Ayutthaya', 'Krabi'] },
                { name: 'Vietnam', cities: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Nha Trang', 'Hue', 'Haiphong'] },
                { name: 'Pakistan', cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'] },
                { name: 'Nepal', cities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bhaktapur', 'Bharatpur'] },
                { name: 'Sri Lanka', cities: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura'] }
            ];

            const countrySelect = document.getElementById('country-select');
            const citySelect = document.getElementById('city-select');

            // Populate country dropdown
            function populateCountries() {
                countrySelect.innerHTML = '<option value="">Select Country</option>';
                for (const [code, countryData] of Object.entries(countries)) {
                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = `${countryData.flag} ${countryData.name}`;
                    countrySelect.appendChild(option);
                }
            }

            // Handle country change to populate cities
            countrySelect.addEventListener('change', function() {
                citySelect.innerHTML = '<option value="">Select City</option>';
                citySelect.disabled = !this.value;
                
                if (this.value) {
                    const countryCities = countries[this.value].cities;
                    countryCities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                }
            });

            // Initialize country dropdown
            populateCountries();

            // Vitamin D Calculation
            function calculateVitaminD(lat, lng) {
                const uvIndex = fetch_uv_index(lat, lng);
                const exposure = parseInt(document.getElementById('exposure-time').value);
                const skinType = document.getElementById('skin-type').value;
                
                document.getElementById('current-uv').textContent = uvIndex.toFixed(1);
                
                const recommendedTime = calculateRecommendedTime(uvIndex, skinType);
                document.getElementById('recommended-time').textContent = recommendedTime + ' min';
                
                const level = estimate_level(uvIndex, exposure);
                document.getElementById('vitamin-level').textContent = level;
            }

            function calculateRecommendedTime(uvIndex, skinType) {
                return Math.round((30 / uvIndex) * (6 / skinType));
            }

            // Mock functions (replace with actual implementations)
            function fetch_uv_index(lat, lng) {
                // Mock implementation - returns random UV index between 1-10
                return Math.random() * 9 + 1;
            }

            function estimate_level(uvIndex, exposure) {
                // Mock implementation - returns a random vitamin D level
                const levels = ['Low', 'Moderate', 'Sufficient', 'High'];
                return levels[Math.floor(Math.random() * levels.length)];
            }
        });

        // Chart Initialization
        fetch('api/vitamin/history')
        .then(res => res.json())
        .then(data => {
        const labels = data.map(r => r.timestamp);
        const uvValues = data.map(r => r.uv_index);

            new Chart(document.getElementById("vitaminChart"), {
            type: "line",
            data: {
            labels: labels,
            datasets: [{
                label: "UV Index",
                data: uvValues,
                borderColor: "#2e7d32",
                fill: false
            }]
        }
    });
});


        // Resize charts on window resize
        window.addEventListener('resize', function() {
            tempChart.resize();
            phChart.resize();
            analyticsChart.resize();
            co2Chart.resize();
            vitaminChart.resize();
        });

        // Note Modal Functionality
        const newNoteBtn = document.getElementById('newNoteBtn');
        const addNoteBtn = document.getElementById('addNoteBtn');
        const noteModal = document.getElementById('noteModal');
        const noteModalClose = noteModal.querySelector('.note-modal-close');

        newNoteBtn.addEventListener('click', () => {
            noteModal.style.display = 'block';
        });

        addNoteBtn.addEventListener('click', () => {
            noteModal.style.display = 'block';
        });

        noteModalClose.addEventListener('click', () => {
            noteModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === noteModal) {
                noteModal.style.display = 'none';
            }
        });
        // Add to your existing JavaScript
document.querySelectorAll('.attachment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const type = this.querySelector('i').className.split(' ')[1];
        
        switch(type) {
            case 'fa-image':
                // Create file input for image
                const imageInput = document.createElement('input');
                imageInput.type = 'file';
                imageInput.accept = 'image/*';
                imageInput.click();
                imageInput.onchange = (e) => {
                    if (e.target.files.length) {
                        alert(`Image ${e.target.files[0].name} attached!`);
                    }
                };
                break;
                
            case 'fa-paperclip':
                // Create file input for any file
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.click();
                fileInput.onchange = (e) => {
                    if (e.target.files.length) {
                        alert(`File ${e.target.files[0].name} attached!`);
                    }
                };
                break;
                
            case 'fa-map-marker-alt':
                // Get location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            alert(`Location attached: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                        },
                        error => {
                            alert('Could not get location: ' + error.message);
                        }
                    );
                } else {
                    alert('Geolocation is not supported by your browser');
                }
                break;
        }
    });
}); 

        // Profile Modal
        const modal = document.getElementById("profileModal");
        const editBtn = document.querySelector(".edit-profile i");
        const closeBtn = document.querySelector(".modal .close");

        editBtn.onclick = () => modal.style.display = "block";
        closeBtn.onclick = () => modal.style.display = "none";
        window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

        // EcoBot AI Assistant - Fully Functional
        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const chatbotMessages = document.getElementById("aiMessages");
            const chatbotInput = document.getElementById("aiInput");
            const sendBtn = document.getElementById("aiSend");
            const aiBtn = document.getElementById("aiAssistantBtn");
            const aiContainer = document.getElementById("aiAssistantContainer");
            const aiCloseBtn = document.getElementById("aiAssistantClose");
            const typingIndicator = document.getElementById("typingIndicator");
            const newChatBtn = document.getElementById("newChatBtn");
            const historyBtn = document.getElementById("historyBtn");
            const historyPanel = document.getElementById("historyPanel");
            const closeHistoryBtn = document.getElementById("closeHistoryBtn");
            const historyList = document.getElementById("historyList");
            const voiceBtn = document.getElementById("aiVoice");

            // State Management
            let currentChatId = null;
            let chats = JSON.parse(localStorage.getItem('ecobotChats')) || {};
            
            // Initialize the chat
            initChat();
            
            // Initialize with welcome message if new chat
            function initChat() {
                currentChatId = 'chat_' + Date.now();
                if (!chats[currentChatId]) {
                    chats[currentChatId] = {
                        id: currentChatId,
                        title: "New Conversation",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        messages: [
                            { role: "assistant", content: "Hi there! I'm EcoBot, your sustainability assistant. 🌱" },
                            { role: "assistant", content: "I can help with:\n- Carbon footprint calculations\n- Vitamin D recommendations\n- Eco-friendly living tips\n\nWhat would you like to know?" }
                        ]
                    };
                    saveChats();
                }
                renderChat(currentChatId);
                renderHistory();
            }
            
            // Save chats to localStorage
            function saveChats() {
                localStorage.setItem('ecobotChats', JSON.stringify(chats));
            }
            
            // Render chat messages
            function renderChat(chatId) {
                if (!chats[chatId]) return;
                
                currentChatId = chatId;
                chatbotMessages.innerHTML = '';
                
                // Add typing indicator at the bottom
                chatbotMessages.appendChild(typingIndicator);
                
                // Render each message
                chats[chatId].messages.forEach(msg => {
                    appendMessage(msg.role, msg.content);
                });
                
                // Scroll to bottom
                setTimeout(() => {
                    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
                }, 50);
            }
            
            // Render chat history
            function renderHistory() {
                historyList.innerHTML = '';
                
                const chatItems = Object.values(chats).sort((a, b) => 
                    new Date(b.updatedAt) - new Date(a.updatedAt)
                );
                
                if (chatItems.length === 0) {
                    historyList.innerHTML = '<div class="no-history">No conversation history yet</div>';
                    return;
                }
                
                chatItems.forEach(chat => {
                    const lastMessage = chat.messages.find(m => m.role === 'user') || 
                                      chat.messages[chat.messages.length - 1];
                    
                    const historyItem = document.createElement('div');
                    historyItem.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
                    historyItem.innerHTML = `
                        <i class="fas fa-comment-alt"></i>
                        <div class="history-item-content">
                            <div class="history-item-title">${chat.title}</div>
                            <div class="history-item-preview">${lastMessage?.content.substring(0, 50)}${lastMessage?.content.length > 50 ? '...' : ''}</div>
                            <div class="history-item-date">${formatDate(chat.updatedAt)}</div>
                        </div>
                    `;
                    
                    historyItem.addEventListener('click', () => {
                        renderChat(chat.id);
                        toggleHistoryPanel();
                    });
                    
                    historyList.appendChild(historyItem);
                });
            }
            
            // Format date for display
            function formatDate(dateString) {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            // Toggle history panel
            function toggleHistoryPanel() {
                historyPanel.classList.toggle('active');
            }
            
            // Append message to chat
            function appendMessage(role, text) {
                const msg = document.createElement("div");
                msg.className = `ai-message ${role}`;
                msg.textContent = text;
                chatbotMessages.insertBefore(msg, typingIndicator);
            }
            
            // Show typing indicator
            function showTyping() {
                typingIndicator.classList.add('active');
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }
            
            // Hide typing indicator
            function hideTyping() {
                typingIndicator.classList.remove('active');
            }
            
            // Process AI response
            async function processAIResponse(userInput) {
                try {
                    showTyping();
                    
                    // Update chat title if this is the first user message
                    if (chats[currentChatId].messages.filter(m => m.role === 'user').length === 1) {
                        chats[currentChatId].title = userInput.substring(0, 30) + (userInput.length > 30 ? '...' : '');
                    }
                    
                    // Mock responses for demo
                    const mockResponses = {
                        "footprint": "To reduce your carbon footprint:\n\n🚗 Transport: Use public transit, bike, or walk\n🍔 Food: Eat less meat (especially beef)\n🏠 Energy: Switch to LED bulbs and lower thermostat\n🛒 Shopping: Buy local and seasonal produce\n\nSmall changes add up to big impacts!",
                        "vitaminD": "For optimal Vitamin D from sunlight:\n\n☀️ Fair skin: 10-15 mins midday sun exposure\n🌤️ Darker skin: 25-30 mins may be needed\n🕒 Best time: Between 10am-3pm\n👕 Expose arms, legs, or back if possible\n\nAlways avoid sunburn!",
                        "recycling": "Recycling best practices:\n\n♻️ Rinse containers before recycling\n📦 Flatten cardboard boxes\n🚫 No plastic bags in curbside bins\n🍕 Remove food residue from pizza boxes\n🔍 Check local guidelines as rules vary\n\nReduce and reuse before recycling!",
                        "default": "I'm EcoBot, your sustainability assistant. I can help with:\n\n🌍 Carbon footprint analysis\n🌞 Vitamin D and sunlight advice\n♻️ Recycling and waste reduction\n🌱 Eco-friendly lifestyle tips\n\nWhat specific question can I answer for you?"
                    };
                    
                    // Simple keyword matching for demo
                    let response;
                    if (userInput.toLowerCase().includes('footprint') || userInput.toLowerCase().includes('carbon')) {
                        response = mockResponses.footprint;
                    } else if (userInput.toLowerCase().includes('vitamin') || userInput.toLowerCase().includes('sun')) {
                        response = mockResponses.vitaminD;
                    } else if (userInput.toLowerCase().includes('recycl') || userInput.toLowerCase().includes('waste')) {
                        response = mockResponses.recycling;
                    } else {
                        response = mockResponses.default;
                    }
                    
                    // Simulate typing delay
                    setTimeout(() => {
                        hideTyping();
                        appendMessage("bot", response);
                        
                        // Update chat history
                        chats[currentChatId].messages.push(
                            { role: "user", content: userInput },
                            { role: "assistant", content: response }
                        );
                        chats[currentChatId].updatedAt = new Date().toISOString();
                        saveChats();
                        renderHistory();
                    }, 1500 + Math.random() * 1000);
                    
                } catch (err) {
                    hideTyping();
                    appendMessage("bot", "Sorry, I'm having trouble connecting. Please try again later.");
                    console.error("Chat error:", err);
                }
            }
            
            // Send message handler
            async function sendMessage() {
                const userInput = chatbotInput.value.trim();
                if (!userInput) return;
                
                appendMessage("user", userInput);
                chatbotInput.value = "";
                
                await processAIResponse(userInput);
            }
            
            // Voice Input Functionality
            function setupVoiceRecognition() {
                try {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (!SpeechRecognition) {
                        console.warn("Speech recognition not supported");
                        voiceBtn.style.display = 'none';
                        return;
                    }
                    
                    recognition = new SpeechRecognition();
                    recognition.continuous = false;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';
                    
                    voiceBtn.addEventListener('click', () => {
                        if (voiceBtn.classList.contains('listening')) {
                            recognition.stop();
                            voiceBtn.classList.remove('listening');
                            return;
                        }
                        
                        voiceBtn.classList.add('listening');
                        recognition.start();
                    });
                    
                    recognition.onstart = () => {
                        chatbotInput.placeholder = "Listening...";
                    };
                    
                    recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript;
                        chatbotInput.value = transcript;
                        voiceBtn.classList.remove('listening');
                        chatbotInput.placeholder = "Ask about sustainability...";
                        sendMessage();
                    };
                    
                    recognition.onerror = (event) => {
                        console.error("Voice recognition error", event.error);
                        voiceBtn.classList.remove('listening');
                        chatbotInput.placeholder = "Ask about sustainability...";
                        appendMessage("bot", "Sorry, I couldn't understand your voice. Please try typing instead.");
                    };
                    
                    recognition.onend = () => {
                        voiceBtn.classList.remove('listening');
                        chatbotInput.placeholder = "Ask about sustainability...";
                    };
                    
                } catch (err) {
                    console.error("Voice setup error:", err);
                    voiceBtn.style.display = 'none';
                }
            }
            
            // Initialize voice recognition
            let recognition = null;
            setupVoiceRecognition();
            
            // Event Listeners
            aiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                aiContainer.classList.toggle('active');
            });
            
            aiCloseBtn.addEventListener('click', () => {
                aiContainer.classList.remove('active');
            });
            
            sendBtn.addEventListener('click', sendMessage);
            
            chatbotInput.addEventListener("keydown", e => {
                if (e.key === "Enter") sendMessage();
            });
            
            newChatBtn.addEventListener('click', () => {
                initChat();
            });
            
            historyBtn.addEventListener('click', toggleHistoryPanel);
            closeHistoryBtn.addEventListener('click', toggleHistoryPanel);
            
            // Quick action buttons
            document.querySelectorAll('.quick-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = this.getAttribute('data-action');
                    let message = '';
                    
                    switch(action) {
                        case 'footprint':
                            message = "How can I reduce my carbon footprint?";
                            break;
                        case 'vitaminD':
                            message = "How much sunlight do I need for vitamin D?";
                            break;
                        case 'recycling':
                            message = "What are the best practices for recycling?";
                            break;
                    }
                    
                    chatbotInput.value = message;
                    sendMessage();
                });
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!aiContainer.contains(e.target) && e.target !== aiBtn) {
                    aiContainer.classList.remove('active');
                    historyPanel.classList.remove('active');
                }
            });
            
            // Prevent clicks inside container from closing it
            aiContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Carbon-Footprint specific trigger
        document.getElementById('log-entry').addEventListener('click', function () {
            const cat = document.getElementById('category-select').value;
            const overlayId = 'popup-' + cat;
            document.getElementById(overlayId).style.display = 'block';
        });

        // Universal close helper
        function closePopup(id) {
            document.getElementById(id).style.display = 'none';
        }

        // Close when clicking overlay background
        document.querySelectorAll('.popup-overlay').forEach(overlay => {
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.style.display = 'none';
            });
        });

        function fetchVitaminD(lat, lon) {
    fetch("/api/vitamin/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: lat, lon: lon })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("uv-index").innerText = "UV Index: " + data.uv_index;
        document.getElementById("vitamin-advice").innerText = data.advice;
    })
    .catch(err => console.error(err));
}

navigator.geolocation.getCurrentPosition(pos => {
    fetchVitaminD(pos.coords.latitude, pos.coords.longitude);
});
 
// 🌞 Vitamin D Estimator Auto + Manual Fetch
document.addEventListener("DOMContentLoaded", function () {
    // Auto fetch using location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        console.log("Geolocation not supported.");
    }

    function success(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        fetch('api/vitamin/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: lat, lon: lon })
        })
        .then(res => res.json())
        .then(data => updateVitaminResult(data))
        .catch(err => console.error(err));
    }

    function error(err) {
        console.warn("Location not allowed:", err.message);
        // Optionally prompt user to select manual city
    }

    // Manual city input (if you have a <select> or <input> for cities)
    const manualCityBtn = document.getElementById("city-submit-btn");
    if (manualCityBtn) {
        manualCityBtn.addEventListener("click", function () {
            const city = document.getElementById("city-input").value;
            fetch('api/vitamin/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: city })
            })
            .then(res => res.json())
            .then(data => updateVitaminResult(data))
            .catch(err => console.error(err));
        });
    }

    // Update UI
    function updateVitaminResult(data) {
        if (data.error) {
            document.getElementById("vitamin-result").innerHTML = 
                `<p style="color:red;">${data.error}</p>`;
        } else {
            document.getElementById("uv-index").textContent = data.uv_index;
            document.getElementById("vitamin-status").textContent = data.vitamin_status;
        }
    }
});

// Vitamin D Estimation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Auto-detect location button
    const getLocationBtn = document.getElementById('get-location');
    if (getLocationBtn) {
        getLocationBtn.addEventListener('click', getCurrentLocation);
    }
    
    // Manual form submission
    const countrySelect = document.getElementById('country-select');
    const citySelect = document.getElementById('city-select');
    const skinTypeSelect = document.getElementById('skin-type');
    const exposureInput = document.getElementById('exposure-time');
    
    if (countrySelect && citySelect) {
        countrySelect.addEventListener('change', updateCities);
        citySelect.addEventListener('change', estimateVitaminDManual);
    }
    
    if (skinTypeSelect && exposureInput) {
        skinTypeSelect.addEventListener('change', estimateVitaminDManual);
        exposureInput.addEventListener('change', estimateVitaminDManual);
    }
});

// Get current location
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('get-location');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Detecting...';
    btn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            estimateVitaminD(lat, lon);
            
            // Restore button
            btn.innerHTML = originalText;
            btn.disabled = false;
        },
        error => {
            alert(`Error getting location: ${error.message}`);
            
            // Restore button
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    );
}

// Estimate Vitamin D from coordinates
function estimateVitaminD(lat, lon) {
    const skinType = document.getElementById('skin-type').value;
    const exposureTime = document.getElementById('exposure-time').value;
    
    fetch('api/vitamin/estimate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lat: lat,
            lon: lon,
            skin_type: skinType,
            exposure_time: exposureTime
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        updateVitaminDResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to get Vitamin D data: ' + error.message);
    });
}

// Estimate Vitamin D from manual city selection
function estimateVitaminDManual() {
    const citySelect = document.getElementById('city-select');
    const skinType = document.getElementById('skin-type').value;
    const exposureTime = document.getElementById('exposure-time').value;
    
    if (!citySelect.value) return;
    
    fetch('api/vitamin/estimate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            city: citySelect.value,
            skin_type: skinType,
            exposure_time: exposureTime
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        updateVitaminDResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to get Vitamin D data: ' + error.message);
    });
}

// Update UI with Vitamin D results
function updateVitaminDResults(data) {
    // Update the stats cards
    document.getElementById('current-uv').textContent = data.uv_index.toFixed(1);
    document.getElementById('recommended-time').textContent = data.recommended_exposure + ' min';
    document.getElementById('vitamin-level').textContent = data.vitamin_status;
    
    // Update the detailed information
    const uvIndexElement = document.getElementById('uv-index');
    const vitaminAdviceElement = document.getElementById('vitamin-advice');
    
    if (uvIndexElement) {
        uvIndexElement.textContent = `UV Index: ${data.uv_index.toFixed(1)}`;
    }
    
    if (vitaminAdviceElement) {
        let advice = '';
        if (data.vitamin_status === 'Low') {
            advice = `You need more sun exposure. Try to get ${data.recommended_exposure} minutes of sun during midday.`;
        } else if (data.vitamin_status === 'Moderate') {
            advice = `Your vitamin D levels are moderate. Maintain your current sun exposure habits.`;
        } else {
            advice = `Your vitamin D levels are good. Be careful not to get too much sun exposure.`;
        }
        vitaminAdviceElement.textContent = `Advice: ${advice}`;
    }
    
    // Update the chart if it exists
    updateVitaminChart(data);
}

// Update Vitamin D chart
function updateVitaminChart(data) {
    // This would update your chart with new data
    // You'll need to implement this based on your chart library
    console.log('Update chart with:', data);
}

// Populate cities based on country selection
function updateCities() {
    const countrySelect = document.getElementById('country-select');
    const citySelect = document.getElementById('city-select');
    const selectedCountry = countrySelect.value;
    
    // Clear existing options
    citySelect.innerHTML = '<option value="">Select City</option>';
    
    if (!selectedCountry) {
        citySelect.disabled = true;
        return;
    }
    
    citySelect.disabled = false;
    
    const cities = citiesByCountry[selectedCountry] || [];
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Fetch real-time environmental data
function fetchEnvironmentalData() {
    // This would fetch data from your backend which in turn queries OpenWeather API
    fetch('/api/environmental-data')
        .then(response => response.json())
        .then(data => {
            updateEnvironmentalStats(data);
        })
        .catch(error => {
            console.error('Error fetching environmental data:', error);
        });
}

// Update the environmental stats cards
function updateEnvironmentalStats(data) {
    // Update temperature
    const tempElement = document.querySelector('.stat-card.temperature .stat-info p');
    if (tempElement && data.temperature) {
        tempElement.innerHTML = `${data.temperature.toFixed(1)}°C <span class="trend up"><i class="fas fa-arrow-up"></i> 0.3°C</span>`;
    }
    
    // Update humidity
    const humidityElement = document.querySelector('.stat-card.humidity .stat-info p');
    if (humidityElement && data.humidity) {
        humidityElement.innerHTML = `${data.humidity}% <span class="trend down"><i class="fas fa-arrow-down"></i> 2%</span>`;
    }
    
    // Update other stats as needed
}

// Fetch data on page load and then every 5 minutes
document.addEventListener('DOMContentLoaded', function() {
    fetchEnvironmentalData();
    setInterval(fetchEnvironmentalData, 300000); // 5 minutes
});

(function () {
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val ?? "—";
  }

  async function fetchEnv(lat, lon) {
    const r = await fetch("/api/env/now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon })
    });
    return r.json();
  }

  async function fetchVitamin(lat, lon) {
    const r = await fetch("/api/vitamin/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon, skin_type: 3 })
    });
    return r.json();
  }

  async function updateUI(env, vit) {
    setText("current-uv", vit.uv_index ?? "—");
    setText("recommended-time", vit.suggested_exposure_minutes ? vit.suggested_exposure_minutes + " min" : "—");
    setText("vitamin-level", vit.risk ?? "—");
    setText("uv-index", "UV Index: " + (vit.uv_index ?? "—"));
    setText("vitamin-advice", "Advice: " + (vit.risk ?? "—"));
  }

  function askGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const [env, vit] = await Promise.all([fetchEnv(latitude, longitude), fetchVitamin(latitude, longitude)]);
        updateUI(env, vit);
      } catch (e) {
        console.error(e);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", askGeo);
})();

document.addEventListener("DOMContentLoaded", function () {
  const els = {
    uv: document.getElementById("uv-index"),
    temp: document.getElementById("temperature"),
    hum: document.getElementById("humidity"),
    clouds: document.getElementById("cloud-cover"),
    light: document.getElementById("light-level"),
    ph: document.getElementById("ph-level"),
    risk: document.getElementById("vitamin-risk"),
    minutes: document.getElementById("vitamin-minutes"),
    city: document.getElementById("city-label"),
  };

  function setText(el, val, suffix = "") {
    if (!el) return;
    if (val === null || val === undefined || Number.isNaN(val)) {
      el.textContent = "No data";
    } else {
      el.textContent = (typeof val === "number" ? val.toFixed(1) : val) + suffix;
    }
  }

  function updateVitamin(data) {
    setText(els.uv, data.uv_index);
    setText(els.temp, data.temperature_c, "°C");
    setText(els.hum, data.humidity_pct, "%");
    setText(els.clouds, data.cloud_cover_pct, "%");
    setText(els.risk, data.risk || "—");
    if (els.minutes) els.minutes.textContent = (data.suggested_exposure_minutes ?? "—") + " min";
    if (els.city) els.city.textContent = data.city || "";
    if (els.light) setText(els.light, null); // vitamin API doesn't return light; env API does
    if (els.ph) setText(els.ph, data.ph);    // will be No data
  }

  function updateEnv(data) {
    // Only fill fields vitamin didn’t
    if (els.light) setText(els.light, data.light_level);
    if (els.ph) setText(els.ph, data.ph);
    if (els.city && !els.city.textContent) els.city.textContent = data.city || "";
  }

  async function callVitaminByCoords(lat, lon) {
    const res = await fetch("/api/vitamin/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });
    return res.json();
  }

  async function callEnvByCoords(lat, lon) {
    const res = await fetch("/api/env/now", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lon }),
    });
    return res.json();
  }

  async function detectAndUpdate() {
    if (!("geolocation" in navigator)) {
      alert("Geolocation not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      try {
        const [vit, env] = await Promise.all([
          callVitaminByCoords(lat, lon),
          callEnvByCoords(lat, lon),
        ]);

        if (vit.error) {
          console.error("Vitamin error:", vit.error);
        } else {
          updateVitamin(vit);
        }

        if (env.error) {
          console.error("Env error:", env.error);
        } else {
          updateEnv(env);
        }

      } catch (e) {
        console.error("Fetch failed:", e);
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      alert("Please allow location access to enable real-time data.");
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  }

  // Wire up any “Detect my location” button
  const detectBtn = document.getElementById("detect-location-btn");
  if (detectBtn) detectBtn.addEventListener("click", detectAndUpdate);

  // Auto-run right after login
  detectAndUpdate();

  // Refresh every 10 minutes
  setInterval(detectAndUpdate, 10 * 60 * 1000);
});