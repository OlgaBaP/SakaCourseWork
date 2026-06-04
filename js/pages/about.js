import { createReview, getReviews } from "../api/api.js";
import { t, translateValue } from "../common/i18n.js";

const reviewsList = document.querySelector("[data-reviews-list]");
const reviewsError = document.querySelector("[data-reviews-error]");
const openReviewButton = document.querySelector("[data-review-open]");
const modal = document.querySelector("[data-review-modal]");
const reviewForm = document.querySelector("[data-review-form]");
const authorInput = document.querySelector("[data-review-author]");
const textInput = document.querySelector("[data-review-text]");
const message = document.querySelector("[data-review-message]");
const closeButtons = document.querySelectorAll("[data-review-close]");
const prevReviewsButton = document.querySelector("[data-reviews-prev]");
const nextReviewsButton = document.querySelector("[data-reviews-next]");

let reviews = [];
let activeReviewIndex = 0;
const reviewsPerPage = 3;

function createReviewCard(review) {
  const card = document.createElement("article");
  const text = document.createElement("p");
  const author = document.createElement("strong");

  card.className = "review-card";
  text.className = "review-card__text";
  author.className = "review-card__author";

  text.textContent = translateValue("review", review.text);
  author.textContent = translateValue("person", review.author);

  card.append(text, author);

  return card;
}

function renderReviews() {
  const visibleReviews = reviews.slice(
    activeReviewIndex,
    activeReviewIndex + reviewsPerPage,
  );

  reviewsList.innerHTML = "";

  visibleReviews.forEach((review) => {
    reviewsList.append(createReviewCard(review));
  });

  updateReviewsControls();
}

function updateReviewsControls() {
  const hasExtraReviews = reviews.length > reviewsPerPage;

  prevReviewsButton.hidden = !hasExtraReviews;
  nextReviewsButton.hidden = !hasExtraReviews;
  prevReviewsButton.disabled = activeReviewIndex === 0;
  nextReviewsButton.disabled =
    activeReviewIndex + reviewsPerPage >= reviews.length;
}

function showPrevReviews() {
  activeReviewIndex = Math.max(activeReviewIndex - reviewsPerPage, 0);
  renderReviews();
}

function showNextReviews() {
  const lastPageIndex =
    Math.floor((reviews.length - 1) / reviewsPerPage) * reviewsPerPage;

  activeReviewIndex = Math.min(
    activeReviewIndex + reviewsPerPage,
    lastPageIndex,
  );
  renderReviews();
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

function clearMessage() {
  message.textContent = "";
  message.hidden = true;
}

function openModal() {
  modal.hidden = false;
  clearMessage();
  authorInput.focus();
}

function closeModal() {
  modal.hidden = true;
  reviewForm.reset();
  clearMessage();
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  const author = authorInput.value.trim();
  const text = textInput.value.trim();

  if (!author || !text) {
    showMessage(t("common.submitRequired"));
    return;
  }

  const reviewData = {
    author,
    text,
    createdAt: new Date().toISOString(),
  };

  try {
    const savedReview = await createReview(reviewData);
    reviews.push(savedReview);
    renderReviews();
    closeModal();
  } catch {
    showMessage(t("reviews.saveFailed"));
  }
}

async function initReviews() {
  try {
    reviews = await getReviews();
    activeReviewIndex = 0;
    renderReviews();
  } catch {
    reviewsError.hidden = false;
    updateReviewsControls();
  }
}

openReviewButton.addEventListener("click", openModal);
reviewForm.addEventListener("submit", handleReviewSubmit);
prevReviewsButton.addEventListener("click", showPrevReviews);
nextReviewsButton.addEventListener("click", showNextReviews);
window.addEventListener("i18n:changed", renderReviews);

closeButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});

initReviews();
