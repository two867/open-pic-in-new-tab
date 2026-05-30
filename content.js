// Open Image in New Tab - Content Script
// 鼠标悬浮在图片上时，按 Tab 键在新标签页打开该图片

(function () {
  "use strict";

  // 当前鼠标悬浮的图片元素
  let hoveredImage = null;

  /**
   * 获取图片的最佳 URL
   * 优先使用原图地址，兼容多种图片场景
   * @param {HTMLElement} element - 图片元素或包含背景图的元素
   * @returns {string|null} 图片 URL
   */
  function getImageUrl(element) {
    // 1. 标准 <img> 标签
    if (element.tagName === "IMG") {
      // 优先使用 currentSrc（响应式图片的实际加载地址）
      return element.currentSrc || element.src || null;
    }

    // 2. <picture> 内的 <source> 对应的 <img>
    if (element.tagName === "PICTURE") {
      const img = element.querySelector("img");
      return img ? img.currentSrc || img.src : null;
    }

    // 3. SVG 中的 <image> 标签
    if (element.tagName === "image" || element.tagName === "IMAGE") {
      return (
        element.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
        element.getAttribute("href") ||
        null
      );
    }

    // 4. <video> 的 poster 属性
    if (element.tagName === "VIDEO" && element.poster) {
      return element.poster;
    }

    // 5. CSS 背景图片
    const bgImage = window.getComputedStyle(element).backgroundImage;
    if (bgImage && bgImage !== "none") {
      const match = bgImage.match(/url\(["']?(.*?)["']?\)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 查找鼠标下方最近的图片元素
   * 向上遍历 DOM 树，最多查找 3 层父元素
   * @param {HTMLElement} target - 事件目标元素
   * @returns {HTMLElement|null} 包含图片的元素
   */
  function findImageElement(target) {
    let el = target;
    // 最多向上查找 3 层，覆盖常见的图片包裹结构（如 <a><img></a>）
    for (let i = 0; i < 4 && el; i++) {
      if (getImageUrl(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  // 监听鼠标移动，记录当前悬浮的图片
  document.addEventListener(
    "mouseover",
    function (e) {
      hoveredImage = findImageElement(e.target);
    },
    true
  );

  // 鼠标移出时清除记录
  document.addEventListener(
    "mouseout",
    function (e) {
      // 确保鼠标确实离开了图片区域
      const relatedImage = e.relatedTarget
        ? findImageElement(e.relatedTarget)
        : null;
      if (!relatedImage) {
        hoveredImage = null;
      }
    },
    true
  );

  // 监听键盘按下事件
  document.addEventListener(
    "keydown",
    function (e) {
      // 仅在鼠标悬浮在图片上且按下 Tab 键时触发
      if (e.key !== "Tab" || !hoveredImage) {
        return;
      }

      // 忽略输入框中的 Tab 键（保留正常的 Tab 跳转行为）
      const activeTag = document.activeElement?.tagName;
      if (
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        activeTag === "SELECT" ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }

      const imageUrl = getImageUrl(hoveredImage);
      if (!imageUrl) {
        return;
      }

      // 阻止 Tab 的默认焦点切换行为
      e.preventDefault();
      e.stopPropagation();

      // 在新标签页打开图片
      window.open(imageUrl, "_blank");
    },
    true
  );
})();
