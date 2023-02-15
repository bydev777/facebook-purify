const canRun = window.location.href.split("/")[3] === "";
var timer = null;
var isDone = true;
var totalSugRemoved = 0;
var likeTimer = null;
var totalSponRemoved = 0;
const LIKE_LIMIT = 200;
const getChildSpanTag = (node) => {
  if (node === null) {
    return null;
  }
  if (node.tagName === "SPAN") {
    return node;
  }
  return getChildSpanTag(node.firstChild);
};

const getSecondParentEmptyDiv = (node, times = 1) => {
  if (node === null) return null;
  if (node.tagName === "DIV" && node.className === "") {
    if (times === 1) {
      times += 1;
    } else {
      return node;
    }
  }
  return getSecondParentEmptyDiv(node.parentElement, times);
};

const getFirstParentEmptyDiv = (node) => {
  if (node === null) return null;
  if (node.tagName === "DIV" && node.className === "") {
    return node;
  }
  return getFirstParentEmptyDiv(node.parentElement);
};

// @param data - children of <div class="">
const isContainsSuggestion = (data) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].checkVisibility()) {
      const spanNode = getChildSpanTag(data[i]);
      if (spanNode === null) return false;
      if (spanNode.childElementCount === 0) {
        return true;
      } else {
        return false;
      }
    }
  }
  return false;
};

// @param data - HTML collection of <a> tag
// @return {Object} result - { sug, spon }
var categorizeNodes = (data, isSug = false, isSpon = false) => {
  var sug = [];
  var spon = [];
  for (let i = 0; i < data.length; i++) {
    if (isSug && data[i].getAttribute("aria-label") === "hide post") {
      sug.push(data[i]);
      continue;
    }
    const href = data[i].getAttribute("href");
    if (isSpon && href && href.includes("#") && data[i].offsetWidth === 65) {
      spon.push(data[i]);
    }
  }
  return {
    sug,
    spon,
  };
};

var removeSuggestionPosts = (data) => {
  var count = 0;
  for (let i = 0; i < data.length; i++) {
    let postParent =
      data[i].parentElement.parentElement.parentElement.parentElement;
    if (isContainsSuggestion(postParent.firstChild.children)) {
      postParent.parentElement.remove();
      // postParent.style.border = '1px solid red';
      count++;
      totalSugRemoved++;
    }
  }
  if (count) {
    console.log(
      "facebook-purify:",
      "removed",
      count,
      "suggestion posts",
      ", total: ",
      totalSugRemoved
    );
  }
};

// <a> nodes
const removeSponsoredPosts = (nodes) => {
  var count = 0;
  for (let i = 0; i < nodes.length; i++) {
    const target = getSecondParentEmptyDiv(nodes[i]);
    target.parentElement.remove();
    // target.style.border = "1px solid red";
    totalSponRemoved++;
    count++;
    if (count) {
      console.log(
        "facebook-purify:",
        "removed",
        count,
        "sponsored posts",
        ", total: ",
        totalSponRemoved
      );
    }
  }
};

const getAutoLikeList = async () => {
  let list = await getValue("autoLikeList");
  if (list) {
    return list.split(",").filter((item) => item !== "");
  } else {
    return [];
  }
};

const appendToAutoLikeList = async (value) => {
  let listArr = await getAutoLikeList();
  if (listArr.includes(value)) {
    return;
  }
  listArr.push(value);
  await setValue("autoLikeList", listArr.join(","));
};

const removeFromAutoLikeList = async (value) => {
  let listArr = await getAutoLikeList();
  if (listArr.includes(value)) {
    listArr = listArr.filter((item) => item !== value);
    await setValue("autoLikeList", listArr.join(","));
  }
};

const parseIdFromFBLink = (link) => {
  if (!link) {
    return "";
  }
  if (link.includes("/profile")) {
    let p1 = link.indexOf("id=");
    let p2 = link.indexOf("&");
    link = link.substring(p1 + 3, p2);
  } else {
    let p1 = link.indexOf(".com/");
    let p2 = link.indexOf("?");
    link = link.substring(p1 + 5, p2);
  }
  link = link.replace("/", "");
  return link;
};

getFirstChildATag = (node) => {
  if (node === null) return null;
  if (node.tagName === "A") {
    return node;
  }
  return getFirstChildATag(node.firstChild);
};

getRealProfileLink = (objectNode) => {
  const group = getFirstParentEmptyDiv(objectNode);
  if (group) {
    if (group.firstChild.children.length < 2) {
      return "";
    }
    const aTag = getFirstChildATag(group.firstChild.children[1]);
    if (!aTag) {
      return "";
    }
    return aTag.href;
  } else {
    return "";
  }
};

// links: array of <a> tag
const getLikeBtnsFromObj = async (objs) => {
  var results = [];

  for (let i = 0; i < objs.length; i++) {
    let obj = objs[i];
    let canGo = true;
    const post = getSecondParentEmptyDiv(obj);
    const profileLink = getRealProfileLink(obj);
    const id = parseIdFromFBLink(profileLink);
    const listArr = await getAutoLikeList();

    if (post.parentElement.firstChild.tagName !== "BUTTON") {
      const removeF = () => {
        const child = document.createElement("button");
        child.setAttribute("name", "FBATLIKE");
        child.value = obj.firstChild.href;
        child.innerText = "Remove Auto Like This Friend";

        child.addEventListener("click", async () => {
          const value = id;
          await removeFromAutoLikeList(value);
          child.remove();
          addF();
        });

        post.parentElement.prepend(child);
        canGo = true;
      };

      const addF = () => {
        const child = document.createElement("button");
        child.setAttribute("name", "FBATLIKE");
        child.value = obj.firstChild.href;
        child.innerText = "Auto Like This Friend";

        child.addEventListener("click", async () => {
          const value = id;
          await appendToAutoLikeList(value);
          child.remove();
          removeF();
        });

        post.parentElement.prepend(child);
        canGo = false;
      };

      if (!listArr.includes(id)) {
        addF();
      } else {
        removeF();
      }
    } else {
      if (!listArr.includes(id)) {
        canGo = false;
      }
    }

    if (!post.lastChild.firstChild || !post.lastChild.firstChild.firstChild) {
      return;
    }

    if (post.lastChild.firstChild.firstChild.firstChild && canGo) {
      const children =
        post.lastChild.firstChild.firstChild.firstChild.firstChild.children;
      const btn =
        children.length === 1
          ? children[0].firstChild.firstChild.firstChild
          : children[1].firstChild.firstChild.firstChild;

      const likeLabel = ["Like", "Thích"];
      if (
        btn.tagName === "DIV" &&
        likeLabel.includes(btn.getAttribute("aria-label"))
      ) {
        results.push(btn);
      }
    }
  }

  return results;
};

const randomNum = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

// 24,222: dayofmonth,liked
// returns arr [dayofmon, liked]
const processLiked = (liked) => {
  const today = new Date().getDate();
  if (!liked) {
    return [today.toString(), "0"];
  }
  const parsed = liked.split(",");

  if (!liked || !parsed[0] || !parsed[1]) {
    return [today.toString(), "0"];
  }
  if (today.toString() !== parsed[0]) {
    return [today.toString(), "0"];
  } else {
    const intParsed1 = parseInt(parsed[1]);
    if (intParsed1 < LIKE_LIMIT) {
      return [today.toString(), parsed[1]];
    }
    return null;
  }
};

const likeFriendPosts = async () => {
  console.log("facebook-purify:", "LFP scanning...");
  const objectElements = document.getElementsByTagName("object");
  const profileObjects = getProfileObjects(objectElements);
  const btns = await getLikeBtnsFromObj(profileObjects);
  const liked = await getValue("liked");
  const newLiked = processLiked(liked);

  if (!newLiked) {
    console.log("facebook-purify:", "Likes limit exceed!");
    isDone = true;
    return;
  }

  let count = 0;

  const doJob = (timeout, btn) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        btn.click();
        resolve();
      }, timeout);
    });
  };

  const likeLabel = ["Like", "Thích"];
  for (let i = 0; i < btns.length; i++) {
    const btn = btns[i];
    if (!likeLabel.includes(btn.getAttribute("aria-label"))) {
      continue;
    }
    const timeout = randomNum(1800, 3000);
    await doJob(timeout, btn);
    count++;
  }
  const total = parseInt(newLiked[1]) + count;
  newLiked[1] = total.toString();
  await setValue("liked", newLiked.join(","));
  if (count) {
    console.log(
      "facebook-purify:",
      "Liked ",
      total,
      "/",
      LIKE_LIMIT,
      " friend posts"
    );
  }
  isDone = true;
};

const getProfileObjects = (objectElements) => {
  var objects = [];
  for (let i = 0; i < objectElements.length; i++) {
    if (
      objectElements[i].firstChild &&
      !objectElements[i].firstChild.href.includes("/#") &&
      objectElements[i].offsetWidth > objectElements[i].offsetHeight
    ) {
      objects.push(objectElements[i]);
    }
  }
  return objects;
};

const scanHTMLATags = (
  isSug = false,
  isSpon = false,
  isAuto = false,
  skipAuto = false
) => {
  if (!isAuto) {
    const btns = document.querySelectorAll('button[name="FBATLIKE"]');
    for (let i = 0; i < btns.length; i++) {
      btns[i].remove();
    }
  }
  if (!isSug && !isSpon && !isAuto) return;

  if (isSpon || isSug) {
    console.log("facebook-purify:", "SP SU scanning...");
    const aTags = document.getElementsByTagName("a");
    const nodes = categorizeNodes(aTags, isSug, isSpon);
    if (isSug) {
      removeSuggestionPosts(nodes.sug);
    }
    if (isSpon) {
      removeSponsoredPosts(nodes.spon);
    }
  }

  if (isAuto && !skipAuto) {
    likeFriendPosts();
  }
};

const setValue = (key, value) => {
  let obj = {};
  obj[key] = value;
  return browser.storage.local.set(obj);
};

const getValue = async (key) => {
  let data = await browser.storage.local.get(key);
  return data[key];
};

const startLikeTimer = (timeout) => {
  likeTimer = setTimeout(() => {
    clearTimeout(likeTimer);
    likeTimer = null;
  }, timeout);
};

const startTimer = (timeout) => {
  timer = setTimeout(() => {
    clearTimeout(timer);
    timer = null;
  }, timeout);
};

addEventListener("wheel", async () => {
  const isSug = await getValue("removeSuggestionPosts");
  const isSpon = await getValue("removeSponsoredPosts");
  const isAuto = await getValue("autoLike");
  const timeout = 2200;
  const likeTimeout = 2000;

  if (!timer) {
    startTimer(timeout);
    scanHTMLATags(isSug, isSpon, isAuto, true);
    setTimeout(() => {
      scanHTMLATags(isSug, isSpon, isAuto, true);
    }, 1800);
  }

  if (isDone && !likeTimer) {
    isDone = false;
    startLikeTimer(likeTimeout);
    scanHTMLATags(false, false, isAuto, false);
  }
});
