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

function resetPage() {
    location.reload();
}

function showNextAbility() {
    let messageBox = document.getElementById('messageBox');
    let number = document.getElementById('number');
    
    if (currentIndex < abilities.length) {
        if (currentIndex === 0) {
            fetch('/start-timer');
            timerInterval = setInterval(function() {
                fetch('/get-time')
                    .then(response => response.json())
                    .then(data => {
                        let seconds = data.time.toFixed(3);
                        document.getElementById('timer').innerHTML = 'Время: ' + seconds + ' секунд';
                    });
            }, 50);
        }
        
        messageBox.innerHTML = abilities[currentIndex];
        number.innerHTML = currentIndex + 1;
        currentIndex++;
        
        if (currentIndex === abilities.length) {
            fetch('/stop-timer');
            clearInterval(timerInterval);
        }
    } else {
        messageBox.innerHTML = "конец";
    }
}