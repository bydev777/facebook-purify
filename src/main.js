const canRun = window.location.href.split("/")[3] === "";
var timer = null;
var totalRemoved = 0;
// @param data - children of <div class="">
const isContainsSuggestion = (data) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].checkVisibility()) {
      return true;
    }
  }
  return false;
};

// @param data - HTML collection of <a> tag
var getHidePostButtons = (data) => {
  var result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].getAttribute("aria-label") === "hide post") {
      result.push(data[i]);
    }
  }
  return result;
};

// @param data - hide post button HTML collection
// var getSuggestionPostButtons = (data) => {
//   let suggestionPostBtns = [];
//   for (let i = 0; i < data.length; i++) {
//     let postParent =
//       data[i].parentElement.parentElement.parentElement.parentElement;
//     if (isContainsSuggestion(postParent.firstChild.children)) {
//       suggestionPostBtns.push(data[i]);
//     }
//   }
//   return suggestionPostBtns;
// };
// var closePosts = (postBtns) => {
//   postBtns.forEach((e) => {
//     const timeout = getRandom(500, 1500);
//     setTimeout(() => {
//       e.click();
//     }, timeout);
//   });
//   console.log('facebook-purify:','removed', postBtns.length, 'suggestion posts');
// };

var removeSuggestionPosts = (data) => {
  var count = 0;
  for (let i = 0; i < data.length; i++) {
    let postParent =
      data[i].parentElement.parentElement.parentElement.parentElement;
    if (isContainsSuggestion(postParent.firstChild.children)) {
      postParent.remove();
      count ++;
      totalRemoved ++;
    }
  }
  if (count) {
    console.log('facebook-purify:','removed', count, 'suggestion posts', ', total: ', totalRemoved);
  }
};

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

const closeSuggestionPosts = () => {
  console.log('facebook-purify:','scanning');
  const aTags = document.getElementsByTagName("a");
  const posts = getHidePostButtons(aTags);
  removeSuggestionPosts(posts);
};

const startTimer = (timeout) => {
  timer = setTimeout(() => {
    clearTimeout(timer);
    timer = null;
  }, timeout);
};

addEventListener("wheel", () => {
  const timeout = 3000;
  if (!timer) {
    startTimer(timeout);
    closeSuggestionPosts();
  }
});
