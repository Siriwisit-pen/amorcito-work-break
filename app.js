const messages = [
  "Estoy contigo en este ratito. Tu esfuerzo importa, tu corazón importa, y no tienes que ser invencible para ser maravillosa.",
  "Mi amor, si hoy todo pesa, deja que este minuto sea liviano. Respira. Yo creo en ti, incluso cuando tú estás cansada.",
  "No tienes que resolverlo todo de una vez. Un paso, un correo, una pausa, otro paso. Estoy orgulloso de ti.",
  "Ojalá pudiera aparecer con agua, comida rica y un abrazo. Por ahora te mando todo mi cariño desde esta pantalla.",
  "Tu ternura no desaparece cuando estás agotada. Sigues siendo mi persona favorita, también en los días difíciles.",
  "Que este pedacito del día te recuerde algo simple: eres amada, eres capaz, y mereces descansar sin culpa."
];

const moodNotes = {
  cansada:
    "Descansa un minuto sin culpa. El mundo puede esperar; tu paz también es importante.",
  dudando:
    "La duda no borra todo lo que has logrado. Hoy puedes avanzar despacio y seguir siendo increíble.",
  lejos:
    "Aunque estemos en lugares distintos, mi cariño encuentra camino. Te pienso bonito y te abrazo desde aquí."
};

const dailyMessage = document.querySelector("#dailyMessage");
const newMessageButton = document.querySelector("#newMessage");
const heartButton = document.querySelector("#heartBurst");
const fireworkButton = document.querySelector("#fireworkButton");
const heartLayer = document.querySelector("#heartLayer");
const moodButtons = document.querySelectorAll(".mood-chip");
const moodNote = document.querySelector("#moodNote");
const breathButton = document.querySelector("#breathToggle");
const breathWord = document.querySelector("#breathWord");
const breathGuide = document.querySelector("#breathGuide");
const canvas = document.querySelector("#fireworks");
const ctx = canvas.getContext("2d");
const visitEndpoint = "https://formsubmit.co/ajax/siriwisit.pen@gmail.com";

let lastMessage = 0;
let breathing = false;
let breathTimer = 0;
let breathStep = 0;
let width = 0;
let height = 0;
let particles = [];
let rockets = [];
let animationRunning = false;

function formatTime(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short"
  }).format(new Date());
}

function shouldNotifyVisit() {
  const params = new URLSearchParams(window.location.search);
  const localHosts = ["localhost", "127.0.0.1", ""];

  return (
    !params.has("noNotify") &&
    window.location.protocol !== "file:" &&
    !localHosts.includes(window.location.hostname)
  );
}

function notifyVisit() {
  if (!shouldNotifyVisit()) {
    return;
  }

  const payload = new URLSearchParams({
    _subject: "Amorcito page opened",
    _template: "table",
    _captcha: "false",
    opened_at_bangkok: formatTime("Asia/Bangkok"),
    opened_at_ecuador: formatTime("America/Guayaquil")
  });

  window
    .fetch(visitEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: payload.toString(),
      keepalive: true
    })
    .catch(() => {});
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickMessage() {
  let next = Math.floor(Math.random() * messages.length);
  if (next === lastMessage) {
    next = (next + 1) % messages.length;
  }
  lastMessage = next;
  dailyMessage.textContent = messages[next];
}

function createHearts(amount = 24) {
  const colors = ["#e94f64", "#ff8f6b", "#18a999", "#ffd447", "#d3384e"];

  for (let i = 0; i < amount; i += 1) {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = "♥";
    heart.style.setProperty("--x", `${randomBetween(4, 96)}vw`);
    heart.style.setProperty("--size", `${randomBetween(18, 42)}px`);
    heart.style.setProperty("--duration", `${randomBetween(3.8, 6.6)}s`);
    heart.style.setProperty("--drift", `${randomBetween(-90, 90)}px`);
    heart.style.setProperty("--turn", `${randomBetween(-45, 45)}deg`);
    heart.style.setProperty("--heart-color", colors[i % colors.length]);
    heartLayer.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
  }
}

function setMood(button) {
  moodButtons.forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  moodNote.textContent = moodNotes[button.dataset.mood];
}

function setBreathStep() {
  const states = [
    {
      word: "inhala",
      guide: "Inhala despacio. Deja que entre aire como si fuera calma."
    },
    {
      word: "sostén",
      guide: "Quédate aquí un momento. No tienes que correr."
    },
    {
      word: "suelta",
      guide: "Suelta el aire, los hombros y un poquito del peso de hoy."
    }
  ];
  const state = states[breathStep % states.length];
  breathWord.textContent = state.word;
  breathGuide.textContent = state.guide;
  breathStep += 1;
}

function toggleBreathing() {
  breathing = !breathing;
  breathButton.classList.toggle("is-breathing", breathing);
  breathButton.setAttribute("aria-pressed", String(breathing));

  if (breathing) {
    breathStep = 0;
    setBreathStep();
    breathTimer = window.setInterval(setBreathStep, 2500);
  } else {
    window.clearInterval(breathTimer);
    breathWord.textContent = "toca";
    breathGuide.textContent =
      "Baja los hombros. Afloja la mandíbula. Aquí va un abrazo lento.";
  }
}

function launchFirework(x = randomBetween(width * 0.18, width * 0.82)) {
  rockets.push({
    x,
    y: height + 12,
    targetY: randomBetween(height * 0.17, height * 0.48),
    speed: randomBetween(8, 12),
    hue: randomBetween(0, 360),
    trail: []
  });
  startAnimation();
}

function explode(rocket) {
  const count = 74;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = randomBetween(1.2, 5.2);
    particles.push({
      x: rocket.x,
      y: rocket.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      size: randomBetween(1.2, 2.8),
      hue: rocket.hue + randomBetween(-28, 28)
    });
  }
}

function drawFireworks() {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  rockets = rockets.filter((rocket) => {
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 8) {
      rocket.trail.shift();
    }

    rocket.y -= rocket.speed;
    ctx.strokeStyle = `hsla(${rocket.hue}, 95%, 62%, 0.75)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    rocket.trail.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    if (rocket.y <= rocket.targetY) {
      explode(rocket);
      return false;
    }
    return true;
  });

  particles = particles.filter((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.035;
    particle.vx *= 0.99;
    particle.alpha -= 0.014;

    ctx.fillStyle = `hsla(${particle.hue}, 95%, 62%, ${particle.alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    return particle.alpha > 0;
  });

  ctx.globalCompositeOperation = "source-over";

  if (rockets.length || particles.length) {
    window.requestAnimationFrame(drawFireworks);
  } else {
    animationRunning = false;
    ctx.clearRect(0, 0, width, height);
  }
}

function startAnimation() {
  if (!animationRunning) {
    animationRunning = true;
    window.requestAnimationFrame(drawFireworks);
  }
}

newMessageButton.addEventListener("click", () => {
  pickMessage();
  createHearts(12);
});

heartButton.addEventListener("click", () => createHearts(34));

fireworkButton.addEventListener("click", () => {
  launchFirework();
  window.setTimeout(() => launchFirework(), 220);
});

moodButtons.forEach((button) => {
  button.addEventListener("click", () => setMood(button));
});

breathButton.addEventListener("click", toggleBreathing);

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
notifyVisit();
window.setTimeout(() => createHearts(12), 450);
window.setTimeout(() => launchFirework(width * 0.5), 900);
