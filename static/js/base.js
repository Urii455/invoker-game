function showToast(msg, duration = 5000) {
  document.getElementById('toast-body').textContent = msg;
  const el = document.getElementById('app-toast');
  const t = bootstrap.Toast.getOrCreateInstance(el, { delay: duration, autohide: true });
  t.show();
}

const sk1 = 'Cold Snap - Q Q Q'
const sk2 = 'Ghost Walk - Q Q W'
const sk3 = 'Ice Wall - Q Q E'
const sk4 = 'EMP - W W W'
const sk5 = 'Tornado - W W Q'
const sk6 = 'Alacrity - W W E'
const sk7 = 'Sun Strike - E E E'
const sk8 = 'Forge Spirit - E E Q'
const sk9 = 'Chaos Meteor - E E W'
const sk10 = 'Deafening Blast - Q W E'

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const originalAbilities = ['Cold Snap', 'Ghost Walk', 'Ice Wall', 'EMP', 'Tornado',
  'Alacrity', 'Sun Strike', 'Forge Spirit', 'Chaos Meteor', 'Deafening Blast'];

let abilities = shuffleArray([...originalAbilities]);
let currentIndex = 0;
let timerInterval = null;
let lastTime = null;

function saveLastTimeToJSON(timeInSeconds) {
    lastTime = parseFloat(timeInSeconds.toFixed(3));

    const jsonStr = JSON.stringify({ lastTime: lastTime }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'last_time.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`Последнее время сохранено: ${lastTime}с`);
    showToast(`Время ${lastTime}с сохранено`, 2000);
}

function resetPage() {
    abilities = shuffleArray([...originalAbilities]);
    currentIndex = 0;
    lastTime = null;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.getElementById('messageBox').innerHTML = '';
    document.getElementById('number').innerHTML = '';
    document.getElementById('timer').innerHTML = 'Время: 0.000 секунд';
    fetch('/stop-timer');
}

const resultDiv = document.getElementById('result');
let listening = false;
let keysPressed = [];

function resetListener() {
    keysPressed = [];
    listening = true;
    if (resultDiv) resultDiv.textContent = '';
    console.log('Слушаю 3 клавиши (R не считается)...');
}

function onKeyPress(event) {
    if (!listening) return;
    
    let keyName = event.key.toUpperCase();
    
    if (keyName === 'R') {
        console.log('Клавиша R нажата, но игнорируется (не считается)');
        return;
    }
    
    if (keyName !== 'Q' && keyName !== 'W' && keyName !== 'E') {
        console.log(`Клавиша ${keyName} игнорируется (разрешены только Q, W, E)`);
        return;
    }
    
    keysPressed.push(keyName);
    console.log(`Нажата клавиша ${keysPressed.length}: ${keyName}`);
    
    if (keysPressed.length === 3) {
        listening = false;
        resultDiv.textContent = `Нажатые клавиши: ${keysPressed.join(' → ')}`;
        console.log('Готово!', keysPressed);
    }
}

function onStartKeyPress(event) {
    if (event.key === 'r' || event.key === 'R') {
        console.log('Нажата R - запускаю showNextAbility (R не считается)');
        showNextAbility();
    }
}

function showNextAbility() {
    let messageBox = document.getElementById('messageBox');
    let number = document.getElementById('number');

    if (!listening) {
        resetListener();
    }

    if (currentIndex < abilities.length) {
        if (currentIndex === 0) {
            fetch('/start-timer');
            timerInterval = setInterval(function() {
                fetch('/get-time')
                    .then(response => response.json())
                    .then(data => {
                        let seconds = data.time.toFixed(3);
                        document.getElementById('timer').innerHTML = 'Время: ' + seconds + ' секунд';
                    })
                    .catch(error => console.error('Ошибка получения времени:', error));
            }, 50);
        }

        messageBox.innerHTML = abilities[currentIndex];
        number.innerHTML = currentIndex + 1;

        if (currentIndex === abilities.length - 1) {
            fetch('/get-time')
                .then(response => response.json())
                .then(data => {
                    saveLastTimeToJSON(data.time);
                })
                .catch(error => console.error('Ошибка получения времени:', error));
        }

        currentIndex++;

        if (currentIndex === abilities.length) {
            fetch('/stop-timer');
            clearInterval(timerInterval);
            timerInterval = null;
            console.log('Все способности завершены!');
            showToast('Последнее время сохранено!', 3000);
        }
    } else {
        messageBox.innerHTML = "конец";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    resetListener();
    document.addEventListener('keydown', onStartKeyPress);
    document.addEventListener('keydown', onKeyPress);
});

function updateTime() {
  const now = new Date();
  const options = { 
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  };
  document.getElementById('datetime').innerHTML = now.toLocaleDateString('ru-RU', options);
}
updateTime();
setInterval(updateTime, 1000);

function emptyFunction1() { return; }
function emptyFunction2() { return; }
function emptyFunction3() { return; }
function emptyFunction4() { return; }
function emptyFunction5() { return; }
function emptyFunction6() { return; }
function emptyFunction7() { return; }
function emptyFunction8() { return; }
function emptyFunction9() { return; }
function emptyFunction10() { return; }

const extraVar1 = null;
const extraVar2 = null;
const extraVar3 = null;
const extraVar4 = null;
const extraVar5 = null;
const extraVar6 = null;
const extraVar7 = null;
const extraVar8 = null;
const extraVar9 = null;
const extraVar10 = null;


console.log('Используйте R для старта');
console.log('Нажимайте Q, W, E в правильном порядке');

buttons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const mode = btn.dataset.mode;
    const answer = document.getElementById('answer').value.trim();
    
    console.log('Button clicked:', mode, 'Answer length:', answer.length);

    buttons.forEach(b => { b.disabled = true; b.classList.remove('active'); });
    btn.classList.add('active');
    if (panel) panel.style.display = 'block';
    if (label) label.textContent = modeLabels[mode];
    if (responseEl) {
      responseEl.className = 'ai-response';
      responseEl.innerHTML = '<span class="ai-cursor"></span>';
    }

    const body = new FormData();
    body.append('mode', mode);
    body.append('answer', answer);

    try {
      const res = await fetch('/problem/ai', { method: 'POST', body });
      const data = await res.json();
      
      console.log('Response:', res.status, data);

      if (res.status === 429) {
        const mins = Math.ceil(data.wait / 60);
        if (panel) panel.style.display = 'none';
        if (typeof showToast === 'function') {
          showToast(`Too many requests - please wait ${mins} minute${mins !== 1 ? 's' : ''} before asking again.`);
        }
        return;
      }

      if (!res.ok || data.error) {
        if (responseEl) responseEl.textContent = data.error || 'Request failed.';
        return;
      }

      if (mode === 'check') {
        if (responseEl) renderMarkdown(responseEl, data.text);
        if (data.verdict === 'CORRECT') {
          if (responseEl) responseEl.classList.add('check-correct');
          if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.title = ''; }
        } else if (data.verdict === 'INCORRECT') {
          if (responseEl) responseEl.classList.add('check-wrong');
        }
      } else {
        if (responseEl) renderMarkdown(responseEl, data.text);
      }

    } catch (e) {
      console.error('Error:', e);
      if (responseEl) responseEl.textContent = 'Request failed: ' + e.message;
    } finally {
      buttons.forEach(b => { b.disabled = false; });
      btn.classList.remove('active');
    }
  });
});
