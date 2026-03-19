/**
 * @typedef {{ groups: ColumnGroup[] }} TableSchema
 * @typedef {{ id: string, title: string, columns: ColumnDef[] }} ColumnGroup
 * @typedef {{ id: string, title: string, width?: number }} ColumnDef
 * @typedef {{ rows: TableRow[] }} TableData
 * @typedef {{ id: string, cells: Record<string, CellData> }} TableRow
 * @typedef {{ text?: string, image?: { url: string, alt?: string, fileName?: string } }} CellData
 */

const demoSchema = {
  groups: [
    {
      id: "planning",
      title: "内容策划",
      columns: [
        { id: "theme", title: "主题", width: 250 },
        { id: "story", title: "场景说明", width: 300 },
      ],
    },
    {
      id: "visuals",
      title: "视觉素材",
      columns: [
        { id: "heroImage", title: "主图", width: 260 },
        { id: "detailImage", title: "细节图", width: 260 },
      ],
    },
    {
      id: "delivery",
      title: "交付备注",
      columns: [
        { id: "cta", title: "引导信息", width: 240 },
        { id: "notes", title: "补充备注", width: 280 },
      ],
    },
  ],
};

const initialData = {
  rows: [
    createRow(demoSchema, {
      theme: { text: "春季上新主视觉，强调自然光和手作质感。" },
      story: { text: "桌面、陶器、花材都偏暖色，画面中尽量留白。" },
      heroImage: { text: "点击这里上传主图" },
      detailImage: { text: "可以放局部特写或材质图" },
      cta: { text: "主标题建议控制在 10 个字内" },
      notes: { text: "支持图片和文字同时存在，方便做视觉说明。" },
    }),
    createRow(demoSchema),
  ],
};

export class ImageTable {
  /**
   * @param {HTMLElement} root
   * @param {{
   *   schema: TableSchema,
   *   value: TableData,
   *   onChange?: (nextValue: TableData) => void,
   *   onAddRow?: () => void,
   *   onDeleteRow?: (rowId: string) => void
   * }} options
   */
  constructor(root, options) {
    this.root = root;
    this.schema = options.schema;
    this.value = cloneData(options.value);
    this.onChange = options.onChange;
    this.onAddRow = options.onAddRow;
    this.onDeleteRow = options.onDeleteRow;
    this.columns = flattenColumns(this.schema);
    this.activeCell = null;
    this.previewImage = null;
    this.objectUrls = new Set();
    this.renderShell();
    this.renderAll();
    this.bindEvents();
    window.addEventListener("beforeunload", () => this.cleanupObjectUrls());
  }

  renderShell() {
    this.root.innerHTML = `
      <section class="image-table-shell">
        <div class="toolbar">
          <div class="toolbar-copy">
            <h2>图片表格组件</h2>
            <p>固定列、可增减行。点击任意单元格即可录入图片和说明文字。</p>
          </div>
          <div class="toolbar-metrics" aria-label="表格状态"></div>
          <div class="toolbar-actions">
            <button class="ghost-button" type="button" data-action="reset-sample">恢复示例</button>
            <button class="button" type="button" data-action="add-row">新增一行</button>
          </div>
        </div>

        <div class="table-frame">
          <div class="table-scroll">
            <table class="image-table">
              <colgroup></colgroup>
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </section>

      <div class="panel-overlay" data-role="overlay"></div>

      <aside class="editor-drawer" aria-hidden="true" data-role="drawer">
        <div class="drawer-head">
          <div>
            <h3>编辑单元格</h3>
            <p data-role="drawer-subtitle">选择一个单元格开始编辑</p>
          </div>
          <button class="icon-button" type="button" data-action="close-drawer" aria-label="关闭编辑面板">×</button>
        </div>

        <div class="drawer-section">
          <span class="drawer-label">图片</span>
          <div class="drawer-image" data-role="drawer-image"></div>
          <div class="drawer-actions">
            <input class="sr-only" type="file" accept="image/*" data-role="file-input" />
            <button class="button" type="button" data-action="upload-image">上传或替换图片</button>
            <button class="ghost-button" type="button" data-action="preview-image">预览</button>
            <button class="ghost-button" type="button" data-action="remove-image">删除图片</button>
          </div>
          <p class="drawer-help">每个单元格仅支持 1 张图片。图片会在当前浏览器会话中本地预览。</p>
        </div>

        <div class="drawer-section">
          <label class="drawer-label" for="cell-note">说明文字</label>
          <textarea
            id="cell-note"
            class="drawer-textarea"
            data-role="text-input"
            placeholder="补充这个格子的说明文字，例如画面要求、文案建议、拍摄角度等"
          ></textarea>
        </div>

        <div class="drawer-footer">
          <span data-role="drawer-status">未选择单元格</span>
          <span>修改会自动保存到当前表格状态</span>
        </div>
      </aside>

      <div class="preview-backdrop" data-role="preview-backdrop">
        <div class="preview-dialog">
          <div class="preview-toolbar">
            <strong data-role="preview-title">图片预览</strong>
            <button class="ghost-button" type="button" data-action="close-preview">关闭</button>
          </div>
          <div class="preview-frame" data-role="preview-frame"></div>
        </div>
      </div>
    `;

    this.metricsEl = this.root.querySelector(".toolbar-metrics");
    this.colgroupEl = this.root.querySelector("colgroup");
    this.theadEl = this.root.querySelector("thead");
    this.tbodyEl = this.root.querySelector("tbody");
    this.drawerEl = this.root.querySelector('[data-role="drawer"]');
    this.overlayEl = this.root.querySelector('[data-role="overlay"]');
    this.drawerImageEl = this.root.querySelector('[data-role="drawer-image"]');
    this.drawerSubtitleEl = this.root.querySelector('[data-role="drawer-subtitle"]');
    this.drawerStatusEl = this.root.querySelector('[data-role="drawer-status"]');
    this.textInputEl = this.root.querySelector('[data-role="text-input"]');
    this.fileInputEl = this.root.querySelector('[data-role="file-input"]');
    this.previewButtonEl = this.root.querySelector('[data-action="preview-image"]');
    this.removeImageButtonEl = this.root.querySelector('[data-action="remove-image"]');
    this.previewBackdropEl = this.root.querySelector('[data-role="preview-backdrop"]');
    this.previewFrameEl = this.root.querySelector('[data-role="preview-frame"]');
    this.previewTitleEl = this.root.querySelector('[data-role="preview-title"]');
  }

  bindEvents() {
    this.root.addEventListener("click", (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      if (target === this.previewBackdropEl) {
        this.closePreview();
        return;
      }

      const actionEl = target.closest("[data-action]");
      if (actionEl) {
        const action = actionEl.getAttribute("data-action");
        if (action) {
          this.handleAction(action, actionEl);
          return;
        }
      }

      const cellButton = target.closest("[data-cell-trigger]");
      if (cellButton) {
        this.openCell(cellButton.getAttribute("data-row-id"), cellButton.getAttribute("data-column-id"));
      }
    });

    this.fileInputEl.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) {
        this.attachImage(file);
      }
      event.target.value = "";
    });

    this.textInputEl.addEventListener("input", (event) => {
      if (!this.activeCell) {
        return;
      }
      this.patchActiveCell({ text: event.target.value });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (this.previewImage) {
          this.closePreview();
          return;
        }
        if (this.activeCell) {
          this.closeDrawer();
        }
      }
    });
  }

  handleAction(action, actionEl) {
    if (action === "add-row") {
      this.addRow();
      return;
    }

    if (action === "reset-sample") {
      this.cleanupObjectUrls();
      this.value = cloneData(initialData);
      this.closeDrawer();
      this.closePreview();
      this.renderAll();
      this.onChange?.(cloneData(this.value));
      return;
    }

    if (action === "close-drawer") {
      this.closeDrawer();
      return;
    }

    if (action === "upload-image") {
      this.fileInputEl.click();
      return;
    }

    if (action === "preview-image") {
      if (!this.activeCell?.cell.image) {
        return;
      }
      this.openPreview(this.activeCell.cell.image);
      return;
    }

    if (action === "remove-image") {
      this.patchActiveCell({ image: undefined });
      return;
    }

    if (action === "close-preview") {
      this.closePreview();
      return;
    }

    if (action === "close-overlay") {
      this.closeDrawer();
      return;
    }

    const rowId = actionEl.getAttribute("data-row-id");
    if (!rowId) {
      return;
    }

    if (action === "delete-row") {
      this.deleteRow(rowId);
      return;
    }

    if (action === "duplicate-row") {
      this.duplicateRow(rowId);
      return;
    }

    if (action === "move-up") {
      this.moveRow(rowId, -1);
      return;
    }

    if (action === "move-down") {
      this.moveRow(rowId, 1);
      return;
    }

  }

  renderAll() {
    this.renderMetrics();
    this.renderTable();
    this.renderDrawer();
    this.renderPreview();
  }

  renderMetrics() {
    const imageCount = this.value.rows.reduce((count, row) => {
      return count + Object.values(row.cells).filter((cell) => cell.image).length;
    }, 0);
    const noteCount = this.value.rows.reduce((count, row) => {
      return count + Object.values(row.cells).filter((cell) => cell.text).length;
    }, 0);

    this.metricsEl.innerHTML = `
      <div class="metric">
        <span>行数</span>
        <strong>${this.value.rows.length}</strong>
      </div>
      <div class="metric">
        <span>图片单元格</span>
        <strong>${imageCount}</strong>
      </div>
      <div class="metric">
        <span>说明文字</span>
        <strong>${noteCount}</strong>
      </div>
    `;
  }

  renderTable() {
    this.colgroupEl.innerHTML = this.columns
      .map((column) => `<col style="width: ${column.width ?? 240}px" />`)
      .join("");

    this.theadEl.innerHTML = `
      <tr class="group-row">
        ${this.schema.groups
          .map((group) => `<th colspan="${group.columns.length}" scope="colgroup">${escapeHtml(group.title)}</th>`)
          .join("")}
      </tr>
      <tr class="column-row">
        ${this.columns.map((column) => `<th scope="col">${escapeHtml(column.title)}</th>`).join("")}
      </tr>
    `;

    this.renderRows();
  }

  renderRows() {
    this.tbodyEl.innerHTML = this.value.rows
      .map((row, rowIndex) => {
        return `
          <tr data-row-id="${row.id}">
            ${this.columns
              .map((column, columnIndex) => {
                const cell = row.cells[column.id] ?? {};
                const isActive = this.activeCell?.rowId === row.id && this.activeCell?.columnId === column.id;
                const content = this.renderCellContent(cell);
                const maybeToolbar =
                  columnIndex === this.columns.length - 1
                    ? `
                      <div class="row-toolbar" role="toolbar" aria-label="行操作">
                        <button class="mini-button" type="button" data-action="move-up" data-row-id="${row.id}" aria-label="上移" ${rowIndex === 0 ? "disabled" : ""}>↑</button>
                        <button class="mini-button" type="button" data-action="move-down" data-row-id="${row.id}" aria-label="下移" ${rowIndex === this.value.rows.length - 1 ? "disabled" : ""}>↓</button>
                        <button class="mini-button" type="button" data-action="duplicate-row" data-row-id="${row.id}">复制</button>
                        <button class="mini-button" type="button" data-action="delete-row" data-row-id="${row.id}">删除</button>
                      </div>
                    `
                    : "";

                return `
                  <td class="${columnIndex === this.columns.length - 1 ? "row-toolbar-anchor" : ""}">
                    <button
                      class="cell-button ${isActive ? "is-active" : ""}"
                      type="button"
                      data-cell-trigger
                      data-row-id="${row.id}"
                      data-column-id="${column.id}"
                    >
                      ${content}
                    </button>
                    ${maybeToolbar}
                  </td>
                `;
              })
              .join("")}
          </tr>
        `;
      })
      .join("");
  }

  renderCellContent(cell) {
    const tags = [];
    if (cell.image) {
      tags.push('<span class="cell-tag">已添加图片</span>');
    }
    if (cell.text) {
      tags.push('<span class="cell-tag">含说明</span>');
    }

    if (!cell.image && !cell.text) {
      return `<div class="cell-empty">添加图片或说明<br />点击打开编辑面板</div>`;
    }

    return `
      ${cell.image ? `<div class="cell-thumb"><img src="${escapeAttribute(cell.image.url)}" alt="${escapeAttribute(cell.image.alt ?? "")}" /></div>` : ""}
      ${cell.text ? `<p class="cell-text">${escapeHtml(cell.text)}</p>` : ""}
      ${tags.length ? `<div class="cell-tags">${tags.join("")}</div>` : ""}
    `;
  }

  renderDrawer() {
    const isOpen = Boolean(this.activeCell);
    this.overlayEl.classList.toggle("is-open", isOpen);
    this.drawerEl.classList.toggle("is-open", isOpen);
    this.drawerEl.setAttribute("aria-hidden", String(!isOpen));

    if (!this.activeCell) {
      this.overlayEl.setAttribute("data-action", "");
      this.drawerSubtitleEl.textContent = "选择一个单元格开始编辑";
      this.drawerStatusEl.textContent = "未选择单元格";
      this.drawerImageEl.innerHTML = `<div class="drawer-empty">先点击表格中的任意格子，再为它上传图片或填写说明。</div>`;
      this.textInputEl.value = "";
      this.previewButtonEl.disabled = true;
      this.removeImageButtonEl.disabled = true;
      return;
    }

    this.overlayEl.setAttribute("data-action", "close-overlay");
    const { rowId, columnId, cell } = this.activeCell;
    const column = this.columns.find((item) => item.id === columnId);
    const rowIndex = this.value.rows.findIndex((row) => row.id === rowId) + 1;
    const group = this.schema.groups.find((entry) => entry.columns.some((item) => item.id === columnId));

    this.drawerSubtitleEl.textContent = `${group?.title ?? "未分组"} / ${column?.title ?? "未命名列"}`;
    this.drawerStatusEl.textContent = `正在编辑第 ${rowIndex} 行`;
    this.textInputEl.value = cell.text ?? "";
    const hasImage = Boolean(cell.image);
    this.previewButtonEl.disabled = !hasImage;
    this.removeImageButtonEl.disabled = !hasImage;
    this.drawerImageEl.innerHTML = cell.image
      ? `<img src="${escapeAttribute(cell.image.url)}" alt="${escapeAttribute(cell.image.alt ?? "")}" />`
      : `<div class="drawer-empty">这个单元格还没有图片。<br />可以上传一张主图或说明图。</div>`;
  }

  renderPreview() {
    const isOpen = Boolean(this.previewImage);
    this.previewBackdropEl.classList.toggle("is-open", isOpen);

    if (!this.previewImage) {
      this.previewTitleEl.textContent = "图片预览";
      this.previewFrameEl.innerHTML = "";
      return;
    }

    this.previewTitleEl.textContent = this.previewImage.fileName || "图片预览";
    this.previewFrameEl.innerHTML = `<img src="${escapeAttribute(this.previewImage.url)}" alt="${escapeAttribute(this.previewImage.alt ?? "")}" />`;
  }

  addRow() {
    this.value.rows.push(createRow(this.schema));
    this.renderAll();
    this.onAddRow?.();
    this.onChange?.(cloneData(this.value));
  }

  deleteRow(rowId) {
    const rowIndex = this.value.rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) {
      return;
    }

    this.value.rows.splice(rowIndex, 1);
    if (this.activeCell?.rowId === rowId) {
      this.activeCell = null;
    }
    this.renderAll();
    this.onDeleteRow?.(rowId);
    this.onChange?.(cloneData(this.value));
  }

  duplicateRow(rowId) {
    const sourceRow = this.value.rows.find((row) => row.id === rowId);
    if (!sourceRow) {
      return;
    }

    const nextRow = {
      id: createId(),
      cells: Object.fromEntries(
        this.columns.map((column) => {
          const sourceCell = sourceRow.cells[column.id] ?? {};
          return [
            column.id,
            {
              text: sourceCell.text ?? "",
              image: sourceCell.image ? { ...sourceCell.image } : undefined,
            },
          ];
        }),
      ),
    };

    const sourceIndex = this.value.rows.findIndex((row) => row.id === rowId);
    this.value.rows.splice(sourceIndex + 1, 0, nextRow);
    this.renderAll();
    this.onChange?.(cloneData(this.value));
  }

  moveRow(rowId, direction) {
    const sourceIndex = this.value.rows.findIndex((row) => row.id === rowId);
    const nextIndex = sourceIndex + direction;
    if (sourceIndex === -1 || nextIndex < 0 || nextIndex >= this.value.rows.length) {
      return;
    }

    const [row] = this.value.rows.splice(sourceIndex, 1);
    this.value.rows.splice(nextIndex, 0, row);
    this.renderAll();
    this.onChange?.(cloneData(this.value));
  }

  openCell(rowId, columnId) {
    if (!rowId || !columnId) {
      return;
    }
    const row = this.value.rows.find((entry) => entry.id === rowId);
    if (!row) {
      return;
    }
    this.activeCell = {
      rowId,
      columnId,
      cell: row.cells[columnId] ?? {},
    };
    this.renderRows();
    this.renderDrawer();
  }

  closeDrawer() {
    this.activeCell = null;
    this.renderRows();
    this.renderDrawer();
  }

  attachImage(file) {
    if (!this.activeCell) {
      return;
    }
    const url = URL.createObjectURL(file);
    this.objectUrls.add(url);
    this.patchActiveCell({
      image: {
        url,
        fileName: file.name,
        alt: file.name.replace(/\.[^.]+$/, ""),
      },
    });
  }

  patchActiveCell(patch) {
    if (!this.activeCell) {
      return;
    }
    const row = this.value.rows.find((entry) => entry.id === this.activeCell.rowId);
    if (!row) {
      return;
    }

    const existingCell = row.cells[this.activeCell.columnId] ?? {};
    const nextCell = {
      ...existingCell,
      ...patch,
    };

    if (!nextCell.text) {
      delete nextCell.text;
    }
    if (!nextCell.image) {
      delete nextCell.image;
    }

    row.cells[this.activeCell.columnId] = nextCell;
    this.activeCell = {
      ...this.activeCell,
      cell: nextCell,
    };
    this.renderMetrics();
    this.renderRows();
    this.renderDrawer();
    this.onChange?.(cloneData(this.value));
  }

  openPreview(image) {
    this.previewImage = image;
    this.renderPreview();
  }

  closePreview() {
    this.previewImage = null;
    this.renderPreview();
  }

  cleanupObjectUrls() {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}

function flattenColumns(schema) {
  return schema.groups.flatMap((group) => group.columns);
}

function createRow(schema, cellOverrides = {}) {
  return {
    id: createId(),
    cells: Object.fromEntries(
      flattenColumns(schema).map((column) => [
        column.id,
        normalizeCell(cellOverrides[column.id]),
      ]),
    ),
  };
}

function normalizeCell(cell) {
  if (!cell) {
    return {};
  }
  return {
    text: cell.text ?? "",
    image: cell.image ? { ...cell.image } : undefined,
  };
}

function cloneData(data) {
  return {
    rows: data.rows.map((row) => ({
      id: row.id,
      cells: Object.fromEntries(
        Object.entries(row.cells).map(([key, cell]) => [
          key,
          {
            text: cell.text ?? "",
            image: cell.image ? { ...cell.image } : undefined,
          },
        ]),
      ),
    })),
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `row-${Math.random().toString(36).slice(2, 10)}`;
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

const appRoot = document.querySelector("#app");

if (appRoot) {
  const table = new ImageTable(appRoot, {
    schema: demoSchema,
    value: initialData,
    onChange: (nextValue) => {
      window.demoTableValue = nextValue;
    },
  });

  window.demoImageTable = table;
}
