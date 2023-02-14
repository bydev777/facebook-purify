const inputSugg = document.getElementById("removeSuggestionPosts");
const inputSpon = document.getElementById("removeSponsoredPosts");
const inputAutoLike = document.getElementById("autoLike");
const logs = document.getElementById("logs");

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

inputSugg.addEventListener("change", async () => {
  await setValue("removeSuggestionPosts", inputSugg.checked);
});
inputSpon.addEventListener("change", async () => {
  await setValue("removeSponsoredPosts", inputSpon.checked);
});
inputAutoLike.addEventListener("change", async () => {
  await setValue("autoLike", inputAutoLike.checked);
});

init().catch(e => log(e))

