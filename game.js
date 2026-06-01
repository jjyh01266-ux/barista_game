const stageNames = [
  "인사하기",
  "주문받기",
  "추가정보확인",
  "매장/포장확인",
  "손님 응답",
  "주문 확인",
  "음료 전달",
  "마무리 인사"
];

const sceneImages = [
  "assets/cafe-interior-pixel.png",
  "assets/cafe-interior-light.png"
];

const menus = ["아메리카노", "카페라떼", "바닐라라떼", "초코라떼", "카페모카"];
const temps = ["아이스", "따뜻한"];
const quantities = [
  { value: 1, label: "한 잔" },
  { value: 2, label: "두 잔" },
  { value: 3, label: "세 잔" }
];
const places = ["매장", "포장"];

const greetings = [
  "안녕하세요.",
  "주문할게요.",
  "음료 주문하려고요.",
  "여기 주문 가능한가요?",
  "처음 왔어요."
];

const thanks = ["감사합니다.", "고마워요.", "잘 마실게요.", "또 올게요."];
const placeReplies = {
  "매장": ["먹고 갈게요.", "여기서 마실게요.", "매장에서 마실게요."],
  "포장": ["포장이요.", "가져갈게요.", "포장해 주세요."]
};

const fieldSituations = [
  {
    speech: "우유 알레르기가 있어요. 우유가 들어가나요?",
    correct: "확인 후 안내드리겠습니다.",
    wrong: ["괜찮아요.", "그냥 드셔도 돼요."],
    feedback: "알레르기는 임의로 괜찮다고 말하지 않고 반드시 확인 후 안내해야 합니다."
  },
  {
    speech: "아이스로 주문했는데 따뜻한 걸로 바꿀 수 있나요?",
    correct: "확인해 보겠습니다. 잠시만 기다려 주세요.",
    wrong: ["안 돼요.", "처음부터 잘 말했어야죠."],
    feedback: "변경 요청은 바로 거절하지 않고 가능한지 확인한 뒤 안내합니다."
  },
  {
    speech: "아직 멀었어요? 빨리 주세요.",
    correct: "기다리게 해 죄송합니다. 잠시만 기다려 주세요.",
    wrong: ["기다리세요.", "저도 바빠요."],
    feedback: "재촉하는 손님에게도 정중하게 사과하고 기다림을 안내합니다."
  },
  {
    speech: "제가 주문한 음료가 아닌 것 같아요.",
    correct: "죄송합니다. 주문 내역을 다시 확인해 드리겠습니다.",
    wrong: ["맞는데요.", "그냥 드세요."],
    feedback: "불만이 있을 때는 먼저 사과하고 주문 내역을 다시 확인합니다."
  },
  {
    speech: "공짜로 하나 더 주세요.",
    correct: "죄송하지만 추가 음료는 결제가 필요합니다.",
    wrong: ["네, 그냥 드릴게요.", "안 돼요. 가세요."],
    feedback: "무리한 요구는 정중하지만 분명하게 기준을 안내합니다."
  }
];

const screens = {
  start: document.querySelector("#startScreen"),
  game: document.querySelector("#gameScreen"),
  result: document.querySelector("#resultScreen")
};

const sceneImage = document.querySelector("#sceneImage");
const sceneNote = document.querySelector("#sceneNote");
const customerBubble = document.querySelector("#customerBubble");
const baristaBubble = document.querySelector("#baristaBubble");
const stageBar = document.querySelector("#stageBar");
const sceneTitle = document.querySelector("#sceneTitle");
const speech = document.querySelector("#speech");
const choices = document.querySelector("#choices");
const confirmButton = document.querySelector("#confirmButton");
const feedback = document.querySelector("#feedback");
const ticketMenu = document.querySelector("#ticketMenu");
const ticketTemp = document.querySelector("#ticketTemp");
const ticketQty = document.querySelector("#ticketQty");
const ticketPlace = document.querySelector("#ticketPlace");
const modePill = document.querySelector("#modePill");
const resultTitle = document.querySelector("#resultTitle");
const scoreText = document.querySelector("#scoreText");
const resultMessage = document.querySelector("#resultMessage");
const summaryList = document.querySelector("#summaryList");

let mode = "beginner";
let scenario;
let stageIndex = 0;
let selectedChoice = null;
let submitted = false;
let hadMistake = false;
let history = [];
let audioContext;

function modeLabel() {
  if (mode === "expert") return "전문 바리스타";
  if (mode === "field") return "실전 카페실습";
  return "초보 바리스타";
}

function showScreen(name) {
  Object.entries(screens).forEach(([screenName, element]) => {
    element.classList.toggle("active", screenName === name);
  });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copied = [...items];
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
  }
  return copied;
}

function makeStage(title, speechText, correct, wrongChoices, feedbackText, extra = {}) {
  const options = shuffle([
    { label: correct, correct: true },
    ...wrongChoices.map((label) => ({ label, correct: false }))
  ]);
  return {
    title,
    speech: speechText,
    choices: options.map((option) => option.label),
    answer: options.findIndex((option) => option.correct),
    feedback: feedbackText,
    ...extra
  };
}

function orderText(order) {
  return `${order.temp} ${order.menu} ${order.qty.label}, ${order.place}`;
}

function wrongOrderConfirmations(order) {
  const wrongMenu = pickRandom(menus.filter((menu) => menu !== order.menu));
  const wrongTemp = order.temp === "아이스" ? "따뜻한" : "아이스";
  const wrongQty = pickRandom(quantities.filter((qty) => qty.value !== order.qty.value));
  const wrongPlace = order.place === "매장" ? "포장" : "매장";
  return shuffle([
    `${wrongTemp} ${order.menu} ${order.qty.label}, ${order.place} 맞으신가요?`,
    `${order.temp} ${wrongMenu} ${order.qty.label}, ${order.place} 맞으신가요?`,
    `${order.temp} ${order.menu} ${wrongQty.label}, ${wrongPlace} 맞으신가요?`
  ]).slice(0, 2);
}

function wrongDrinkSentences(order) {
  const wrongMenu = pickRandom(menus.filter((menu) => menu !== order.menu));
  const wrongTemp = order.temp === "아이스" ? "따뜻한" : "아이스";
  const wrongQty = pickRandom(quantities.filter((qty) => qty.value !== order.qty.value));
  return shuffle([
    `주문하신 ${wrongTemp} ${order.menu} ${order.qty.label} 나왔습니다.`,
    `주문하신 ${order.temp} ${wrongMenu} ${order.qty.label} 나왔습니다.`,
    `주문하신 ${order.temp} ${order.menu} ${wrongQty.label} 나왔습니다.`
  ]).slice(0, 2);
}

function buildOrderSpeech(order, missing) {
  if (missing === "menu") return `${order.temp} 음료 ${order.qty.label} 주세요.`;
  if (missing === "temp") return `${order.menu} ${order.qty.label} 주세요.`;
  return `${order.temp} ${order.menu} 주세요.`;
}

function buildMissingQuestion(missing) {
  if (missing === "menu") {
    return {
      correct: "어떤 음료로 주문하시나요?",
      response: (order) => `${order.menu}로 주세요.`,
      wrong: ["아메리카노로 준비하겠습니다.", "그냥 아무 음료나 드릴게요."],
      feedback: "메뉴가 빠져 있으면 어떤 음료를 원하는지 먼저 확인합니다."
    };
  }
  if (missing === "temp") {
    return {
      correct: "뜨거운 음료로 드릴까요, 아이스로 드릴까요?",
      response: (order) => order.temp === "아이스" ? "아이스로 주세요." : "따뜻하게 주세요.",
      wrong: ["아이스로 준비할게요.", "따뜻한 걸로 드리면 되죠?"],
      feedback: "온도가 빠져 있으면 뜨거운 음료인지 아이스인지 확인합니다."
    };
  }
  return {
    correct: "몇 잔 주문하시나요?",
    response: (order) => `${order.qty.label}이요.`,
    wrong: ["한 잔으로 할게요.", "수량은 제가 정하겠습니다."],
    feedback: "수량이 빠져 있으면 몇 잔인지 확인합니다."
  };
}

function createScenario(nextMode) {
  const order = {
    menu: pickRandom(menus),
    temp: pickRandom(temps),
    qty: pickRandom(quantities),
    place: pickRandom(places)
  };
  const missing = pickRandom(["menu", "temp", "qty"]);
  const missingInfo = buildMissingQuestion(missing);
  const placeReply = pickRandom(placeReplies[order.place]);
  const fieldSituation = nextMode === "field" ? pickRandom(fieldSituations) : null;
  const customerStage5Speech = fieldSituation
    ? `${placeReply} 그리고 ${fieldSituation.speech}`
    : placeReply;
  const customerStage5Correct = fieldSituation
    ? fieldSituation.correct
    : order.place === "매장"
      ? "네, 매장 이용으로 준비하겠습니다."
      : "네, 포장으로 준비하겠습니다.";
  const customerStage5Wrong = fieldSituation
    ? fieldSituation.wrong
    : ["제가 알아서 준비하겠습니다.", order.place === "매장" ? "포장으로 준비하겠습니다." : "매장에서 드시면 됩니다."];
  const customerStage5Feedback = fieldSituation
    ? fieldSituation.feedback
    : "손님의 이용 방법을 정확히 듣고 같은 내용으로 확인합니다.";

  return {
    order,
    stages: [
      makeStage(
        "손님이 들어왔습니다",
        pickRandom(greetings),
        "어서 오세요. 주문 도와드리겠습니다.",
        ["주문은 저쪽에서 하세요.", "메뉴판 보고 빨리 골라 주세요."],
        "손님이 들어오면 먼저 반갑게 인사하고 주문을 도와드린다고 말합니다."
      ),
      makeStage(
        "주문을 받습니다",
        buildOrderSpeech(order, missing),
        missingInfo.correct,
        missingInfo.wrong,
        missingInfo.feedback
      ),
      makeStage(
        "추가 정보를 확인합니다",
        missingInfo.response(order),
        "네, 확인했습니다.",
        ["그건 안 됩니다.", "다시 처음부터 말씀해 주세요."],
        "손님이 빠진 정보를 알려주면 정중하게 확인했다고 응답합니다."
      ),
      makeStage(
        "매장/포장을 확인합니다",
        "네, 그렇게 해주세요.",
        "매장에서 드시고 가시나요, 포장이신가요?",
        ["매장으로 준비하겠습니다.", "포장으로 드릴게요."],
        "이용 방법을 손님이 말하지 않았을 때는 매장인지 포장인지 확인합니다."
      ),
      makeStage(
        fieldSituation ? "손님 요청을 듣습니다" : "손님 응답을 듣습니다",
        customerStage5Speech,
        customerStage5Correct,
        customerStage5Wrong,
        customerStage5Feedback
      ),
      makeStage(
        "주문을 확인합니다",
        "주문 확인 부탁드려요.",
        `${orderText(order)} 맞으신가요?`,
        wrongOrderConfirmations(order),
        "앞 단계에서 저장한 메뉴, 온도, 수량, 이용 방법을 모두 넣어 다시 확인합니다."
      ),
      makeStage(
        "음료를 전달합니다",
        "제 음료 받을 수 있을까요?",
        `주문하신 ${order.temp} ${order.menu} ${order.qty.label} 나왔습니다.`,
        wrongDrinkSentences(order),
        "주문 정보와 일치하는 음료명과 수량으로 손님에게 전달합니다."
      ),
      makeStage(
        "마무리 인사",
        pickRandom(thanks),
        "감사합니다. 안녕히 가세요.",
        ["네, 끝났습니다.", "빨리 나가 주세요."],
        "손님이 나갈 때도 밝고 정중하게 마무리 인사를 합니다."
      )
    ]
  };
}

function labelOf(option) {
  return typeof option === "string" ? option : option.label;
}

function playTone(type) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequencies = { click: 420, correct: 660, wrong: 180, finish: 520 };
    oscillator.frequency.value = frequencies[type] || 360;
    oscillator.type = type === "wrong" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(0.06, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.16);
  } catch {
    // Sound is optional. Some browsers block audio until the first user action.
  }
}

function renderStageBar() {
  stageBar.innerHTML = "";
  stageNames.forEach((name, index) => {
    const item = document.createElement("div");
    item.className = "step";
    if (index < stageIndex) item.classList.add("done");
    if (index === stageIndex) item.classList.add("current");

    const number = document.createElement("span");
    number.className = "step-number";
    number.textContent = String(index + 1);
    const label = document.createElement("small");
    label.textContent = name;
    item.append(number, label);
    stageBar.append(item);
  });
}

function renderTicket() {
  const order = scenario.order;
  const reveal = stageIndex >= 5;
  ticketMenu.textContent = reveal ? order.menu : "?";
  ticketTemp.textContent = reveal ? order.temp : "?";
  ticketQty.textContent = reveal ? order.qty.label : "?";
  ticketPlace.textContent = reveal ? order.place : "?";
}

function setReaction(state) {
  customerBubble.className = "face-bubble customer";
  baristaBubble.className = "face-bubble barista";

  if (state === "correct") {
    customerBubble.textContent = "😊";
    customerBubble.classList.add("show", "good");
    sceneNote.textContent = "손님이 만족해합니다. 다음 단계로 진행하세요.";
    return;
  }

  if (state === "wrong") {
    customerBubble.textContent = "😠";
    baristaBubble.textContent = "😥";
    customerBubble.classList.add("show", "bad");
    baristaBubble.classList.add("show", "awkward");
    sceneNote.textContent = "손님이 불편해합니다. 피드백을 확인하세요.";
    return;
  }

  sceneNote.textContent = "손님의 말을 잘 듣고 알맞은 응대 문장을 선택하세요.";
}

function setFeedback(kind, title, detail, iconText = "") {
  feedback.className = `feedback show ${kind}`;
  feedback.replaceChildren();

  if (iconText) {
    const icon = document.createElement("div");
    icon.className = "feedback-icon";
    icon.textContent = iconText;
    feedback.append(icon);
  }

  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = detail;
  feedback.append(strong, span);
}

function renderChoices(stage) {
  choices.innerHTML = "";

  stage.choices.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = option;
    button.addEventListener("click", () => selectChoice(index));
    choices.append(button);
  });
}

function renderStage() {
  const stage = scenario.stages[stageIndex];
  selectedChoice = null;
  submitted = false;

  modePill.textContent = modeLabel();
  renderStageBar();
  renderTicket();
  setReaction("neutral");

  sceneTitle.textContent = stage.title;
  speech.textContent = stage.speech;
  feedback.className = "feedback";
  feedback.replaceChildren();

  confirmButton.disabled = true;
  confirmButton.hidden = false;
  confirmButton.textContent = "확인";
  confirmButton.onclick = submitChoice;

  renderChoices(stage);
}

function selectChoice(index) {
  if (submitted) return;
  selectedChoice = index;
  confirmButton.disabled = false;
  playTone("click");

  [...choices.querySelectorAll(".choice")].forEach((button, buttonIndex) => {
    button.classList.toggle("selected", buttonIndex === index);
  });
}

function showFailure(stage) {
  const isField = mode === "field";
  setFeedback(
    "warning",
    isField ? "손님이 화가 나서 나가버렸어요." : "손님이 화가 나서 카페를 나가버렸습니다.",
    isField ? "사장님이 화가 났어요." : "전문 바리스타 모드에서는 한 번이라도 틀리면 해당 시나리오는 실패합니다.",
    isField ? "😡 사장님" : ""
  );
  confirmButton.hidden = false;
  confirmButton.disabled = false;
  confirmButton.textContent = "확인";
  confirmButton.onclick = goHome;
}

function submitChoice() {
  if (selectedChoice === null || submitted) return;

  const stage = scenario.stages[stageIndex];
  const isCorrect = selectedChoice === stage.answer;
  const selectedLabel = labelOf(stage.choices[selectedChoice]);
  const answerLabel = labelOf(stage.choices[stage.answer]);
  submitted = true;

  history.push({
    stage: stageNames[stageIndex],
    selected: selectedLabel,
    correct: answerLabel,
    success: isCorrect
  });

  [...choices.querySelectorAll(".choice")].forEach((button, index) => {
    button.disabled = true;
    button.classList.remove("selected");
    if (index === stage.answer) button.classList.add("correct");
    if (index === selectedChoice && !isCorrect) button.classList.add("wrong");
  });

  if (isCorrect) {
    setReaction("correct");
    playTone("correct");
    setFeedback("success", "좋아요. 알맞은 응대입니다.", stage.feedback);
    confirmButton.textContent = stageIndex === stageNames.length - 1 ? "결과 보기" : "다음";
    confirmButton.disabled = false;
    confirmButton.onclick = nextStage;
    return;
  }

  hadMistake = true;
  setReaction("wrong");
  playTone("wrong");

  if (mode !== "beginner") {
    showFailure(stage);
    return;
  }

  setFeedback(
    "warning",
    `정답은 “${answerLabel}”입니다.`,
    stage.feedback
  );
  confirmButton.textContent = stageIndex === stageNames.length - 1 ? "결과 보기" : "다음";
  confirmButton.disabled = false;
  confirmButton.onclick = nextStage;
}

function nextStage() {
  playTone("click");
  if (stageIndex < stageNames.length - 1) {
    stageIndex += 1;
    renderStage();
    return;
  }

  renderResult();
  showScreen("result");
}

function renderResult() {
  const success = !hadMistake;
  playTone("finish");

  resultTitle.textContent = mode === "beginner" ? "연습 완료" : "응대 결과";
  scoreText.textContent = success ? "판매 성공" : "판매 실패";
  resultMessage.textContent = success
    ? "손님 응대를 끝까지 잘 마쳤습니다."
    : "중간에 실수가 있어 다시 연습이 필요합니다.";

  summaryList.innerHTML = "";
  history.forEach((item) => {
    const li = document.createElement("li");
    li.className = item.success ? "success" : "fail";
    li.textContent = `${item.stage}: ${item.success ? "성공" : "연습 필요"} · 선택: ${item.selected}`;
    summaryList.append(li);
  });
}

function goHome() {
  playTone("click");
  showScreen("start");
}

function startGame(nextMode) {
  mode = nextMode;
  scenario = createScenario(mode);
  stageIndex = 0;
  selectedChoice = null;
  submitted = false;
  hadMistake = false;
  history = [];
  sceneImage.src = pickRandom(sceneImages);
  showScreen("game");
  renderStage();
}

document.querySelectorAll("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.mode));
});

document.querySelector("#homeButton").addEventListener("click", goHome);
document.querySelector("#modeButton").addEventListener("click", goHome);
document.querySelector("#retryButton").addEventListener("click", () => startGame(mode));
