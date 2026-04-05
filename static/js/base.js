function showToast(msg, duration = 5000) {
  document.getElementById('toast-body').textContent = msg;
  const el = document.getElementById('app-toast');
  const t = bootstrap.Toast.getOrCreateInstance(el, { delay: duration, autohide: true });
  t.show();
}


const abilities = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado', 
  'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast'];
let currentIndex = 0;
let timerInterval = null;

function startTimer() {
    fetch('/start-timer', { method: 'POST' })
        .then(() => {
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
        });
}

function updateTimer() {
    fetch('/get-time')
        .then(response => response.json())
        .then(data => {
            if (data.running) {
                document.getElementById('timer').innerHTML = 'Время: ' + data.time + ' секунд';
            }
        });
}

function stopTimer() {
    fetch('/stop-timer', { method: 'POST' });
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function showNextAbility() {
    let messageBox = document.getElementById('messageBox');
    let number = document.getElementById('number');
    
    if (currentIndex < abilities.length) {
        if (currentIndex === 0) {
            startTimer();
        }
        
        messageBox.innerHTML = abilities[currentIndex];
        number.innerHTML = currentIndex + 1;
        currentIndex++;
        
        if (currentIndex === abilities.length) {
            stopTimer();
        }
    } else {
        messageBox.innerHTML = "конец";
    }
}