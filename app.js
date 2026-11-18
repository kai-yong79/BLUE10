const keywordInput = document.querySelector("#keyword");
const clearButton = document.querySelector("#clear-search");
const resultCount = document.querySelector("#result-count");
const articleList = document.querySelector("#article-list");
const notice = document.querySelector("#notice");
const articleTemplate = document.querySelector("#article-template");
const photo = document.querySelector(".hero-photo img");

function showPhotoFallback() {
  if (photo.dataset.fallback) {
    photo.src = photo.dataset.fallback;
    delete photo.dataset.fallback;
  }
}

photo.addEventListener("error", showPhotoFallback);
if (photo.complete && photo.naturalWidth === 0) showPhotoFallback();

function normalize(value) {
  return value.normalize("NFC").trim().toLocaleLowerCase("ko-KR");
}

function getParagraphs(body) {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph && !/^#\s|^---$/.test(paragraph))
    .map(paragraph => paragraph.replace(/\*\*(.*?)\*\*/g, "$1"));
}

function createCard(article) {
  const card = articleTemplate.content.cloneNode(true);
  const paragraphs = getParagraphs(article.본문);

  card.querySelector(".department").textContent = article.부처;
  card.querySelector("h3").textContent = article.제목;
  card.querySelector(".summary").textContent = paragraphs[0] || article.본문;

  const body = card.querySelector(".body-text");
  for (const text of paragraphs) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    body.append(paragraph);
  }
  return card;
}

function render(articles) {
  const keyword = normalize(keywordInput.value);
  const matches = articles.filter(({ department, body }) =>
    department.includes(keyword) || body.includes(keyword)
  );
  articleList.replaceChildren(...matches.map(({ article }) => createCard(article)));
  resultCount.textContent = `결과 ${matches.length}건`;
  clearButton.hidden = keywordInput.value === "";
  notice.hidden = matches.length !== 0;
  notice.textContent = "일치하는 보도자료가 없습니다.";
}

async function loadArticles() {
  try {
    const response = await fetch("./보도자료데이터.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.json();
    const articles = source.map(article => ({
      article,
      department: normalize(article.부처),
      body: normalize(article.본문)
    }));

    keywordInput.disabled = false;
    keywordInput.addEventListener("input", () => render(articles));
    clearButton.addEventListener("click", () => {
      keywordInput.value = "";
      render(articles);
      keywordInput.focus();
    });
    render(articles);
  } catch {
    resultCount.textContent = "오류";
    notice.textContent = "보도자료를 불러오지 못했습니다. 페이지를 다시 열어 주세요.";
    notice.hidden = false;
  } finally {
    articleList.setAttribute("aria-busy", "false");
  }
}

loadArticles();
