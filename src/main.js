const canRun = window.location.href.split("/")[3] === "";
var timer = null;
var totalSugRemoved = 0;
var totalSponRemoved = 0;

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
var categorizeNodes = (data, isSug = false, isSpon = false, isAuto = false) => {
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
      postParent.remove();
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
    target.remove();
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

// links: array of <a> tag
const getLikeBtnsFromObj = (objs) => {
  var btns = [];
  objs.forEach((obj) => {
    const post = getSecondParentEmptyDiv(obj);
    if (post.firstChild.tagName !== "BUTTON") {
      const child = document.createElement("button");
      child.setAttribute("name", "FBATLIKE");
      child.value = obj.firstChild.href;
      child.innerText = "Auto Like This Friend";
      post.prepend(child);
    }
    if (!post.lastChild.firstChild.firstChild.firstChild) {
      return;
    }
    const children =
      post.lastChild.firstChild.firstChild.firstChild.firstChild.children;
    const btn =
      children.length === 1
        ? children[0].firstChild.firstChild.firstChild
        : children[1].firstChild.firstChild.firstChild;
    if (btn.style.transform !== "none") {
      btns.push(btn);
    }
  });
  return btns;
};

const likeFriendPosts = () => {
  const objectElements = document.getElementsByTagName("object");
  const profileObjects = getProfileObjects(objectElements);
  const btns = getLikeBtnsFromObj(profileObjects);
  btns.forEach((btn) => {
    btn.style.border = "1px solid red";
  });
};

const getProfileObjects = (objectElements) => {
  var objects = [];
  for (let i = 0; i < objectElements.length; i++) {
    if (
      objectElements[i].firstChild &&
      !objectElements[i].firstChild.href.includes("/#") &&
      !objectElements[i].firstChild.href.includes("/stories/")
    ) {
      objects.push(objectElements[i]);
    }
  }
  return objects;
};

const scanHTMLATags = (isSug = false, isSpon = false, isAuto) => {
  if (!isAuto) {
    const btns = document.querySelectorAll('button[name="FBATLIKE"]');
    for (let i = 0; i < btns.length; i++) {
      btns[i].remove();
    }
  }
  if (!isSug && !isSpon && !isAuto) return;

  console.log("facebook-purify:", "scanning");
  const aTags = document.getElementsByTagName("a");
  const nodes = categorizeNodes(aTags, isSug, isSpon, isAuto);

  if (isSug) {
    removeSuggestionPosts(nodes.sug);
  }
  if (isSpon) {
    removeSponsoredPosts(nodes.spon);
  }
  if (isAuto) {
    likeFriendPosts();
  }
};

const startTimer = (timeout) => {
  timer = setTimeout(() => {
    clearTimeout(timer);
    timer = null;
  }, timeout);
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

addEventListener("wheel", async () => {
  const isSug = await getValue("removeSuggestionPosts");
  const isSpon = await getValue("removeSponsoredPosts");
  const isAuto = await getValue("autoLike");
  const timeout = 2200;

  if (!timer) {
    startTimer(timeout);
    scanHTMLATags(isSug, isSpon, isAuto);
    setTimeout(() => {
      scanHTMLATags(isSug, isSpon, isAuto);
    }, 1800);
  }
});
