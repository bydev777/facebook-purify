const LIKE_LIMIT = 200;
const inputSugg = document.getElementById("removeSuggestionPosts");
const inputSpon = document.getElementById("removeSponsoredPosts");
const inputAutoLike = document.getElementById("autoLike");
const logs = document.getElementById("logs");
const autoLikeListPre = document.getElementById("autoLikeList");
const btnViewAutoLikeList = document.getElementById("viewAutoLikeList");
const currentLikes = document.getElementById("currentLikes");
autoLikeListPre.style.visibility = "hidden";

const log = (text) => {
  const child = document.createElement("pre");
  child.innerText = JSON.stringify(text);
  logs.appendChild(child);
};

const init = async () => {
  const sugVal = await getValue("removeSuggestionPosts");

  if (typeof sugVal !== "boolean") {
    inputSugg.checked = true;
    await setValue("removeSuggestionPosts", true);
  } else {
    inputSugg.checked = sugVal;
  }
  inputSpon.checked = await getValue("removeSponsoredPosts");
  inputAutoLike.checked = await getValue("autoLike");
  const liked = await getValue("liked");
  if (liked && liked.includes(",")) {
    const val = liked.split(",")[1];
    currentLikes.innerText = val + "/" + LIKE_LIMIT + " likes ";
    if (val == LIKE_LIMIT.toString()) {
      const child = document.createElement("span");
      child.style.color = "red";
      child.style.fontWeight = "bold";
      child.innerText = "(Limit exceeded!. Come back tomorrow!)";
      currentLikes.appendChild(child);
    }
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

const getAutoLikeList = async () => {
  let list = await getValue("autoLikeList");
  if (list) {
    return list.split(",").filter((item) => item !== "");
  } else {
    return [];
  }
};

const removeAutoLikeList = async () => {
  await setValue("autoLikeList", null);
};

inputSugg.addEventListener("change", async () => {
  await setValue("removeSuggestionPosts", inputSugg.checked);
});
inputSpon.addEventListener("change", async () => {
  await setValue("removeSponsoredPosts", inputSpon.checked);
});
inputAutoLike.addEventListener("change", async () => {
  await setValue("autoLike", inputAutoLike.checked);
});
btnViewAutoLikeList.addEventListener("click", async () => {
  autoLikeListPre.style.visibility = "visible";
  btnViewAutoLikeList.style.visibility = "hidden";
  inner = "";
  listArr = await getAutoLikeList();
  listArr.forEach((item) => {
    const pEle = document.createElement('p')
    pEle.innerText = item;
    autoLikeListPre.appendChild(pEle);
  });

  if (btnViewAutoLikeList.lastChild.tagName !== "BUTTON" && listArr.length) {
    const removeAllBtn = document.createElement("button");
    removeAllBtn.innerText = "Remove All";
    removeAllBtn.addEventListener("click", async () => {
      await removeAutoLikeList();
      autoLikeListPre.innerHTML = "";
    });
    autoLikeListPre.appendChild(removeAllBtn);
  }
});

init().catch((e) => log(e));
