const tiers = [
  { id: "hang", label: "夯", color: "#ea5a9b" },
  { id: "top", label: "顶级", color: "#f0784d" },
  { id: "elite", label: "人上人", color: "#ffb4b7" },
  { id: "npc", label: "NPC", color: "#fff23d" },
  { id: "done", label: "拉完了", color: "#75d7ff" },
];

const movieIndex = [
  {
    title: "肖申克的救赎",
    description: "The Shawshank Redemption / 1994",
    imageUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    keywords: ["肖申克的救赎", "肖生克的救赎", "肖申克", "shawshank", "the shawshank redemption"],
  },
  {
    title: "教父",
    description: "The Godfather / 1972",
    imageUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    keywords: ["教父", "godfather", "the godfather"],
  },
  {
    title: "黑暗骑士",
    description: "The Dark Knight / 2008",
    imageUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    keywords: ["黑暗骑士", "蝙蝠侠黑暗骑士", "dark knight", "batman"],
  },
  {
    title: "盗梦空间",
    description: "Inception / 2010",
    imageUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    keywords: ["盗梦空间", "全面启动", "inception"],
  },
  {
    title: "星际穿越",
    description: "Interstellar / 2014",
    imageUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    keywords: ["星际穿越", "星际效应", "interstellar"],
  },
  {
    title: "阿甘正传",
    description: "Forrest Gump / 1994",
    imageUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    keywords: ["阿甘正传", "forrest gump"],
  },
  {
    title: "低俗小说",
    description: "Pulp Fiction / 1994",
    imageUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    keywords: ["低俗小说", "黑色追缉令", "pulp fiction"],
  },
  {
    title: "千与千寻",
    description: "Spirited Away / 2001",
    imageUrl: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    keywords: ["千与千寻", "神隐少女", "spirited away"],
  },
  {
    title: "寄生虫",
    description: "Parasite / 2019",
    imageUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    keywords: ["寄生虫", "寄生上流", "parasite"],
  },
  {
    title: "泰坦尼克号",
    description: "Titanic / 1997",
    imageUrl: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    keywords: ["泰坦尼克号", "铁达尼号", "titanic"],
  },
  {
    title: "黑客帝国",
    description: "The Matrix / 1999",
    imageUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    keywords: ["黑客帝国", "骇客任务", "matrix", "the matrix"],
  },
  {
    title: "搏击俱乐部",
    description: "Fight Club / 1999",
    imageUrl: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    keywords: ["搏击俱乐部", "斗阵俱乐部", "fight club"],
  },
];

const appRoot = document.querySelector("#app");

class TierListApp {
  constructor(root) {
    this.root = root;
    this.items = [];
    this.searchResults = [];
    this.selectedId = null;
    this.draggingId = null;
    this.pointerDrag = null;
    this.suppressClickUntil = 0;

    this.renderShell();
    this.bindEvents();
    this.render();
    this.setSearchMessage("搜索电影名，然后把海报导入待放区。");
  }

  renderShell() {
    this.root.innerHTML = `
      <section class="app-shell">
        <header class="topbar">
          <h1>电影排名榜</h1>
          <div class="topbar-actions">
            <button class="tool-button" type="button" data-action="delete-selected" disabled>删除选中</button>
            <button class="tool-button" type="button" data-action="clear">清空图片</button>
          </div>
        </header>

        <section class="search-panel" aria-label="电影图片搜索">
          <form class="search-form" data-role="search-form">
            <input
              class="search-input"
              type="search"
              placeholder="搜索电影图片，例如：肖申克的救赎"
              data-role="search-input"
              autocomplete="off"
            />
            <button class="search-button" type="submit">搜索</button>
          </form>
          <div class="search-message" data-role="search-message"></div>
          <div class="search-results" data-role="search-results"></div>
        </section>

        <section class="tier-board" aria-label="电影排名榜">
          <div class="tier-grid" data-role="tier-grid"></div>
        </section>

        <section class="holding-panel" data-drop-target="holding">
          <div class="holding-head">
            <div>
              <strong>待放区</strong>
              <span>电脑和手机都可拖拽；手机也可以先点海报，再点分区放入。</span>
            </div>
            <div class="holding-controls">
              <input class="sr-only" type="file" accept="image/*" multiple data-role="file-input" />
              <button class="local-import-button" type="button" data-action="import-local">导入本地图片</button>
              <div class="holding-status" data-role="status">0 张电影</div>
            </div>
          </div>
          <div class="holding-area" data-drop-target="holding" data-role="holding-area"></div>
        </section>
      </section>
    `;

    this.gridEl = this.root.querySelector('[data-role="tier-grid"]');
    this.holdingAreaEl = this.root.querySelector('[data-role="holding-area"]');
    this.statusEl = this.root.querySelector('[data-role="status"]');
    this.fileInputEl = this.root.querySelector('[data-role="file-input"]');
    this.deleteButtonEl = this.root.querySelector('[data-action="delete-selected"]');
    this.searchFormEl = this.root.querySelector('[data-role="search-form"]');
    this.searchInputEl = this.root.querySelector('[data-role="search-input"]');
    this.searchMessageEl = this.root.querySelector('[data-role="search-message"]');
    this.searchResultsEl = this.root.querySelector('[data-role="search-results"]');
  }

  bindEvents() {
    this.searchFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      this.searchMovies(this.searchInputEl.value.trim());
    });

    this.fileInputEl.addEventListener("change", (event) => {
      this.importLocalFiles(Array.from(event.target.files ?? []));
      event.target.value = "";
    });

    this.root.addEventListener("click", (event) => {
      if (Date.now() < this.suppressClickUntil) {
        event.preventDefault();
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const actionEl = target?.closest("[data-action]");
      const itemEl = target?.closest("[data-item-id]");
      const dropTarget = target?.closest("[data-drop-target]");

      if (actionEl) {
        const action = actionEl.getAttribute("data-action");
        if (action === "clear") {
          this.clearItems();
        }
        if (action === "delete-selected") {
          this.deleteSelected();
        }
        if (action === "delete-item") {
          this.deleteItem(actionEl.getAttribute("data-delete-id"));
        }
        if (action === "import-result") {
          this.importResult(actionEl.getAttribute("data-result-id"));
        }
        if (action === "import-local") {
          this.fileInputEl.click();
        }
        return;
      }

      if (itemEl) {
        this.selectedId = itemEl.getAttribute("data-item-id");
        this.renderItems();
        return;
      }

      if (dropTarget && this.selectedId) {
        this.moveItem(this.selectedId, dropTarget.getAttribute("data-drop-target"));
      }
    });

    this.root.addEventListener("pointerdown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-action]")) {
        return;
      }

      const itemEl = target?.closest("[data-item-id]");
      if (!itemEl) {
        return;
      }

      const itemId = itemEl.getAttribute("data-item-id");
      if (!itemId) {
        return;
      }

      this.selectedId = itemId;
      this.deleteButtonEl.disabled = false;
      this.pointerDrag = {
        id: itemId,
        itemEl,
        ghostEl: null,
        isDragging: false,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        width: itemEl.getBoundingClientRect().width,
        height: itemEl.getBoundingClientRect().height,
      };
      itemEl.setPointerCapture?.(event.pointerId);
    });

    window.addEventListener("pointermove", (event) => {
      this.handlePointerMove(event);
    });

    window.addEventListener("pointerup", (event) => {
      this.finishPointerDrag(event);
    });

    window.addEventListener("pointercancel", (event) => {
      this.finishPointerDrag(event);
    });

    this.root.addEventListener("dragstart", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const itemEl = target?.closest("[data-item-id]");
      if (!itemEl || !event.dataTransfer) {
        return;
      }

      event.preventDefault();
      const itemId = itemEl.getAttribute("data-item-id");
      this.draggingId = itemId;
      this.selectedId = itemId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", itemId);
      itemEl.classList.add("is-dragging");
      this.deleteButtonEl.disabled = false;
    });

    this.root.addEventListener("dragend", () => {
      this.draggingId = null;
      this.root.querySelectorAll(".is-over, .is-dragging").forEach((el) => {
        el.classList.remove("is-over", "is-dragging");
      });
    });

    this.root.addEventListener("dragover", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const dropTarget = target?.closest("[data-drop-target]");
      if (!dropTarget) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
      this.markDropTarget(dropTarget);
    });

    this.root.addEventListener("dragleave", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const dropTarget = target?.closest("[data-drop-target]");
      if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
        dropTarget.classList.remove("is-over");
      }
    });

    this.root.addEventListener("drop", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const dropTarget = target?.closest("[data-drop-target]");
      if (!dropTarget) {
        return;
      }

      event.preventDefault();
      dropTarget.classList.remove("is-over");
      const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
      if (files.length) {
        this.importLocalFiles(files, dropTarget.getAttribute("data-drop-target"));
        return;
      }

      const itemId = event.dataTransfer?.getData("text/plain") || this.draggingId;
      if (itemId) {
        this.moveItem(itemId, dropTarget.getAttribute("data-drop-target"));
      }
    });

    window.addEventListener("keydown", (event) => {
      if ((event.key === "Backspace" || event.key === "Delete") && this.selectedId) {
        event.preventDefault();
        this.deleteSelected();
      }
    });
  }

  render() {
    this.renderTiers();
    this.renderItems();
    this.updateStatus();
  }

  renderTiers() {
    this.gridEl.innerHTML = tiers
      .map(
        (tier) => `
          <div class="tier-row" style="--tier-color: ${tier.color}">
            <div class="tier-label">${tier.label}</div>
            <div class="tier-lane" data-drop-target="${tier.id}">
              <span class="lane-empty">拖到这里</span>
            </div>
          </div>
        `,
      )
      .join("");
  }

  renderItems() {
    const renderItem = (item) => `
      <div
        class="rank-item ${item.id === this.selectedId ? "is-selected" : ""}"
        draggable="false"
        data-item-id="${item.id}"
        title="${escapeAttribute(item.name)}"
        role="button"
        tabindex="0"
      >
        <button
          class="item-delete"
          type="button"
          data-action="delete-item"
          data-delete-id="${item.id}"
          aria-label="删除 ${escapeAttribute(item.name)}"
        >×</button>
        <img src="${escapeAttribute(item.url)}" alt="${escapeAttribute(item.name)}" draggable="false" />
        <span>${escapeHtml(item.name)}</span>
      </div>
    `;

    tiers.forEach((tier) => {
      const laneEl = this.gridEl.querySelector(`[data-drop-target="${tier.id}"]`);
      const laneItems = this.items.filter((item) => item.tierId === tier.id);
      laneEl.innerHTML = `${laneItems.map(renderItem).join("")}<span class="lane-empty">拖到这里</span>`;
      laneEl.classList.toggle("has-items", laneItems.length > 0);
    });

    const holdingItems = this.items.filter((item) => !item.tierId);
    this.holdingAreaEl.innerHTML = holdingItems.length
      ? holdingItems.map(renderItem).join("")
      : `<span class="holding-empty">导入电影海报后会出现在这里</span>`;
    this.holdingAreaEl.classList.toggle("has-items", holdingItems.length > 0);
    this.deleteButtonEl.disabled = !this.selectedId;
  }

  searchMovies(query) {
    if (!query) {
      this.setSearchMessage("请输入电影名。");
      return;
    }

    const results = getMovieSearchResults(query);
    this.searchResults = results;
    this.renderSearchResults();
    this.setSearchMessage(results.some((result) => result.isGenerated) ? "没有匹配到内置海报，已生成一张可导入的电影卡片。" : `找到 ${results.length} 个结果。`);
  }

  renderSearchResults() {
    this.searchResultsEl.innerHTML = this.searchResults
      .map(
        (result) => `
          <article class="result-card">
            <img src="${escapeAttribute(result.imageUrl)}" alt="${escapeAttribute(result.title)}" />
            <div>
              <h2>${escapeHtml(result.title)}</h2>
              <p>${escapeHtml(result.description || "电影图片结果")}</p>
            </div>
            <button class="import-button" type="button" data-action="import-result" data-result-id="${result.id}">
              导入
            </button>
          </article>
        `,
      )
      .join("");
  }

  importResult(resultId) {
    const result = this.searchResults.find((entry) => entry.id === resultId);
    if (!result) {
      return;
    }

    const item = {
      id: createId(),
      name: result.title,
      url: result.imageUrl,
      tierId: null,
    };
    this.items.push(item);
    this.selectedId = item.id;
    this.render();
  }

  async importLocalFiles(files, targetId = "holding") {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      return;
    }

    this.statusEl.textContent = "正在导入图片...";
    const importedItems = await Promise.all(
      imageFiles.map(async (file) => {
        const url = await createLocalImageUrl(file);
        return {
          id: createId(),
          name: file.name.replace(/\.[^.]+$/, ""),
          url,
          tierId: this.normalizeTarget(targetId),
          isLocal: true,
        };
      }),
    );

    this.items.push(...importedItems);
    this.selectedId = importedItems[importedItems.length - 1].id;
    this.render();
  }

  moveItem(itemId, targetId) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    item.tierId = this.normalizeTarget(targetId);
    this.selectedId = itemId;
    this.draggingId = null;
    this.render();
  }

  handlePointerMove(event) {
    if (!this.pointerDrag || event.pointerId !== this.pointerDrag.pointerId) {
      return;
    }

    const distance = Math.hypot(event.clientX - this.pointerDrag.startX, event.clientY - this.pointerDrag.startY);
    if (!this.pointerDrag.isDragging && distance < 8) {
      return;
    }

    event.preventDefault();
    if (!this.pointerDrag.isDragging) {
      this.startPointerDrag();
    }

    const ghostEl = this.pointerDrag.ghostEl;
    if (!ghostEl) {
      return;
    }

    ghostEl.style.left = `${event.clientX - this.pointerDrag.width / 2}px`;
    ghostEl.style.top = `${event.clientY - this.pointerDrag.height / 2}px`;
    ghostEl.style.width = `${this.pointerDrag.width}px`;
    ghostEl.style.height = `${this.pointerDrag.height}px`;

    const dropTarget = this.getDropTargetAt(event.clientX, event.clientY);
    this.root.querySelectorAll("[data-drop-target]").forEach((target) => {
      target.classList.toggle("is-over", target === dropTarget);
    });
    this.autoScrollDuringDrag(event.clientY);
  }

  startPointerDrag() {
    if (!this.pointerDrag) {
      return;
    }

    const ghostEl = this.pointerDrag.itemEl.cloneNode(true);
    ghostEl.classList.add("drag-ghost");
    ghostEl.querySelectorAll("[data-action]").forEach((el) => el.remove());
    document.body.append(ghostEl);
    this.pointerDrag.ghostEl = ghostEl;
    this.pointerDrag.isDragging = true;
    this.pointerDrag.itemEl.classList.add("is-pointer-source");
  }

  finishPointerDrag(event) {
    if (!this.pointerDrag || event.pointerId !== this.pointerDrag.pointerId) {
      return;
    }

    const drag = this.pointerDrag;
    this.pointerDrag = null;
    drag.itemEl.releasePointerCapture?.(event.pointerId);
    drag.ghostEl?.remove();
    drag.itemEl.classList.remove("is-pointer-source");
    this.root.querySelectorAll(".is-over").forEach((el) => el.classList.remove("is-over"));

    if (!drag.isDragging) {
      this.selectedId = drag.id;
      this.renderItems();
      return;
    }

    this.suppressClickUntil = Date.now() + 350;
    const dropTarget = this.getDropTargetAt(event.clientX, event.clientY);
    if (dropTarget) {
      this.moveItem(drag.id, dropTarget.getAttribute("data-drop-target"));
      return;
    }

    this.renderItems();
  }

  getDropTargetAt(x, y) {
    const hiddenGhost = this.pointerDrag?.ghostEl;
    const previousPointerEvents = hiddenGhost?.style.pointerEvents;
    if (hiddenGhost) {
      hiddenGhost.style.pointerEvents = "none";
    }
    const element = document.elementFromPoint(x, y);
    if (hiddenGhost) {
      hiddenGhost.style.pointerEvents = previousPointerEvents ?? "";
    }
    return element?.closest?.("[data-drop-target]") ?? null;
  }

  autoScrollDuringDrag(clientY) {
    const edgeSize = 86;
    const maxStep = 18;
    if (clientY < edgeSize) {
      window.scrollBy({ top: -maxStep, behavior: "auto" });
      return;
    }
    if (clientY > window.innerHeight - edgeSize) {
      window.scrollBy({ top: maxStep, behavior: "auto" });
    }
  }

  normalizeTarget(targetId) {
    return tiers.some((tier) => tier.id === targetId) ? targetId : null;
  }

  markDropTarget(activeTarget) {
    this.root.querySelectorAll("[data-drop-target]").forEach((target) => {
      target.classList.toggle("is-over", target === activeTarget);
    });
  }

  updateStatus() {
    const total = this.items.length;
    const placed = this.items.filter((item) => item.tierId).length;
    this.statusEl.textContent = total ? `${placed} / ${total} 张已放入分区` : "0 张电影";
  }

  setSearchMessage(message) {
    this.searchMessageEl.textContent = message;
  }

  deleteSelected() {
    if (!this.selectedId) {
      return;
    }

    this.deleteItem(this.selectedId);
  }

  deleteItem(itemId) {
    if (!itemId) {
      return;
    }

    const item = this.items.find((entry) => entry.id === itemId);
    this.items = this.items.filter((entry) => entry.id !== itemId);
    if (item?.isLocal) {
      URL.revokeObjectURL(item.url);
    }
    if (this.selectedId === itemId) {
      this.selectedId = null;
    }
    this.render();
  }

  clearItems() {
    this.items.forEach((item) => {
      if (item.isLocal) {
        URL.revokeObjectURL(item.url);
      }
    });
    this.items = [];
    this.selectedId = null;
    this.render();
  }
}

function getMovieSearchResults(query) {
  const correctedQuery = normalizeMovieQuery(query);
  const localResults = searchLocalMovies(correctedQuery);
  if (localResults.length) {
    return localResults;
  }

  return [
    {
      id: `generated-${normalizeSearchText(correctedQuery)}`,
      title: correctedQuery,
      description: "本地生成的电影卡片，可先导入排名。",
      imageUrl: createPosterDataUrl(correctedQuery),
      isGenerated: true,
    },
  ];
}

function searchLocalMovies(query) {
  const normalizedQuery = normalizeSearchText(query);
  return movieIndex
    .filter((movie) =>
      movie.keywords.some((keyword) => {
        const normalizedKeyword = normalizeSearchText(keyword);
        return normalizedKeyword.includes(normalizedQuery) || normalizedQuery.includes(normalizedKeyword);
      }),
    )
    .map((movie, index) => ({
      id: `local-${index}-${normalizeSearchText(movie.title)}`,
      title: movie.title,
      description: movie.description,
      imageUrl: movie.imageUrl,
    }));
}

function normalizeMovieQuery(query) {
  return query
    .replaceAll("肖生克", "肖申克")
    .replaceAll("肖申克救赎", "肖申克的救赎")
    .trim();
}

function normalizeSearchText(value) {
  return normalizeMovieQuery(value).toLowerCase().replace(/\s+/g, "");
}

function createPosterDataUrl(title) {
  const safeTitle = title || "未命名电影";
  const lines = splitPosterTitle(safeTitle);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="740" viewBox="0 0 500 740">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#2b2114"/>
          <stop offset="0.48" stop-color="#111417"/>
          <stop offset="1" stop-color="#030405"/>
        </linearGradient>
        <radialGradient id="spot" cx="50%" cy="16%" r="55%">
          <stop offset="0" stop-color="#ffd37a" stop-opacity="0.56"/>
          <stop offset="1" stop-color="#ffd37a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="500" height="740" fill="url(#bg)"/>
      <rect width="500" height="740" fill="url(#spot)"/>
      <g opacity="0.24">
        <rect x="34" y="42" width="36" height="656" fill="#f7efe0"/>
        <rect x="430" y="42" width="36" height="656" fill="#f7efe0"/>
        ${Array.from({ length: 12 }, (_, index) => {
          const y = 62 + index * 52;
          return `<rect x="42" y="${y}" width="20" height="24" rx="3" fill="#050607"/><rect x="438" y="${y}" width="20" height="24" rx="3" fill="#050607"/>`;
        }).join("")}
      </g>
      <circle cx="250" cy="262" r="116" fill="none" stroke="#f2c46d" stroke-width="12" opacity="0.6"/>
      <circle cx="250" cy="262" r="58" fill="none" stroke="#f2c46d" stroke-width="8" opacity="0.4"/>
      <text x="250" y="472" fill="#fff7e8" font-size="52" font-weight="900" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(lines[0])}</text>
      ${lines[1] ? `<text x="250" y="532" fill="#fff7e8" font-size="52" font-weight="900" text-anchor="middle" font-family="Arial, sans-serif">${escapeXml(lines[1])}</text>` : ""}
      <text x="250" y="646" fill="#f2c46d" font-size="24" font-weight="700" text-anchor="middle" font-family="Arial, sans-serif">MOVIE CARD</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function splitPosterTitle(title) {
  const compact = title.trim();
  if (compact.length <= 8) {
    return [compact];
  }
  return [compact.slice(0, 8), compact.slice(8, 16)];
}

async function createLocalImageUrl(file) {
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return URL.createObjectURL(file);
  }

  const image = await loadLocalImage(file);
  const maxSide = 720;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(URL.createObjectURL(blob || file));
      },
      "image/jpeg",
      0.84,
    );
  });
}

function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败"));
    };
    image.src = url;
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `item-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

if (appRoot) {
  window.tierListApp = new TierListApp(appRoot);
}
