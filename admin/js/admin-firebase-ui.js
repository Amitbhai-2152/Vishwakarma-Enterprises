import { isFirebaseConfigured } from "./firebase.js";
import { requireAuth, logout } from "./auth.js";
import {
  collections,
  createRecord,
  deleteRecord,
  listRecords,
  updateRecord
} from "./firestore.js";

const page = document.documentElement.dataset.page;
const main = document.getElementById("admin-content");
const PAGE_SIZE = 10;

const escapeHtml = (value) => String(value || "").replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  "\"": "&quot;"
}[character]));

function showMessage(text, type = "error") {
  let message = document.getElementById("firebaseMessage");

  if (!message) {
    message = document.createElement("p");
    message.id = "firebaseMessage";
    message.className = "form-message";
    main.prepend(message);
  }

  message.style.color = type === "success" ? "#168341" : "";
  message.textContent = text;
}

function getProductData() {
  return {
    nameEn: document.getElementById("nameEn").value.trim(),
    nameHi: document.getElementById("nameHi").value.trim(),
    category: document.getElementById("category").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    descriptionEn: document.getElementById("descriptionEn").value.trim(),
    descriptionHi: document.getElementById("descriptionHi").value.trim(),
    sizes: document.getElementById("sizes").value
      .split(",")
      .map((size) => size.trim())
      .filter(Boolean)
  };
}

async function renderProducts() {
  const state = {
    records: [],
    pages: [],
    pageIndex: 0
  };

  main.innerHTML = `
    <div class="page-heading">
      <div>
        <h1>Products</h1>
        <p>Manage public catalogue items stored in Firestore.</p>
      </div>
    </div>
    <div class="product-workspace">
      <section class="data-table-wrap" aria-label="Product records">
        <div class="table-toolbar">
          <input id="productSearch" placeholder="Search products" aria-label="Search products">
          <select id="categoryFilter" aria-label="Filter by category">
            <option value="">All categories</option>
          </select>
        </div>
        <div id="productTable"></div>
        <div class="pagination">
          <button class="secondary-action" id="previousPage" type="button" disabled>Previous</button>
          <span id="pageInfo" aria-live="polite">Page 1</span>
          <button class="secondary-action" id="nextPage" type="button">Next</button>
        </div>
      </section>

      <form class="product-form" id="productForm">
        <h2 id="formTitle">Add product</h2>
        <input type="hidden" id="productId">
        <div class="form-row">
          <label>English name<input id="nameEn" required></label>
          <label>Hindi name<input id="nameHi" required></label>
        </div>
        <div class="form-row">
          <label>Category<input id="category" required placeholder="e.g. plumbing"></label>
          <label>Brand<input id="brand" required></label>
        </div>
        <label>English description<textarea id="descriptionEn" required></textarea></label>
        <label>Hindi description<textarea id="descriptionHi" required></textarea></label>
        <label>Sizes (comma separated)<input id="sizes" placeholder="1 inch, 2 inch"></label>
        <p class="form-message">Image uploads are temporarily unavailable while Firebase Storage is disabled.</p>
        <p id="formStatus" class="form-message" aria-live="polite"></p>
        <button class="primary-action" type="submit">Save product</button>
        <button class="secondary-action" type="button" id="resetForm">Cancel</button>
      </form>
    </div>`;

  const table = document.getElementById("productTable");
  const form = document.getElementById("productForm");
  const search = document.getElementById("productSearch");
  const filter = document.getElementById("categoryFilter");
  const status = document.getElementById("formStatus");
  const previousButton = document.getElementById("previousPage");
  const nextButton = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  function resetForm() {
    form.reset();
    document.getElementById("productId").value = "";
    document.getElementById("formTitle").textContent = "Add product";
    status.textContent = "";
  }

  function renderTable() {
    const searchTerm = search.value.toLowerCase();
    const selectedCategory = filter.value;
    const visibleRecords = state.records.filter((item) => {
      const searchableText = `${item.nameEn || ""} ${item.nameHi || ""} ${item.brand || ""}`.toLowerCase();
      return searchableText.includes(searchTerm)
        && (!selectedCategory || item.category === selectedCategory);
    });

    if (!visibleRecords.length) {
      table.innerHTML = '<p class="loading-row">No products found.</p>';
      return;
    }

    table.innerHTML = `
      <table class="data-table">
        <thead>
          <tr><th>Product</th><th>Category</th><th>Brand</th><th>Actions</th></tr>
        </thead>
        <tbody>
          ${visibleRecords.map((item) => `
            <tr>
              <td>
                ${item.images?.[0] ? `<img class="product-thumbnail" src="${escapeHtml(item.images[0])}" alt="">` : ""}
                <strong>${escapeHtml(item.nameEn)}</strong><br>
                <small>${escapeHtml(item.nameHi)}</small>
              </td>
              <td>${escapeHtml(item.category)}</td>
              <td>${escapeHtml(item.brand)}</td>
              <td>
                <div class="table-actions">
                  <button type="button" data-edit="${item.id}" aria-label="Edit ${escapeHtml(item.nameEn)}">Edit</button>
                  <button type="button" class="delete" data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.nameEn)}">Delete</button>
                </div>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>`;

    table.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => editProduct(button.dataset.edit));
    });

    table.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => removeProduct(button.dataset.delete));
    });
  }

  function updatePagination() {
    const current = state.pages[state.pageIndex];
    previousButton.disabled = state.pageIndex === 0;
    nextButton.disabled = !current?.nextCursor || state.records.length < PAGE_SIZE;
    pageInfo.textContent = `Page ${state.pageIndex + 1}`;
  }

  function updateCategoryFilter() {
    const selected = filter.value;
    const categories = [...new Set(state.records.map((item) => item.category).filter(Boolean))];
    filter.innerHTML = '<option value="">All categories</option>'
      + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    filter.value = categories.includes(selected) ? selected : "";
  }

  async function loadPage(index, cursor = null) {
    table.innerHTML = '<p class="loading-row">Loading products&hellip;</p>';

    try {
      const response = await listRecords(collections.products, {
        lastDoc: cursor,
        pageSize: PAGE_SIZE
      });

      state.records = response.records;
      state.pages[index] = { cursor, nextCursor: response.lastDoc, records: response.records };
      state.pageIndex = index;
      updateCategoryFilter();
      renderTable();
      updatePagination();
    } catch (error) {
      table.innerHTML = '<p class="loading-row">Unable to load products. Check Firestore rules and indexes.</p>';
      showMessage(error.message);
    }
  }

  function editProduct(id) {
    const item = state.records.find((record) => record.id === id);
    if (!item) return;

    document.getElementById("productId").value = item.id;
    document.getElementById("nameEn").value = item.nameEn || "";
    document.getElementById("nameHi").value = item.nameHi || "";
    document.getElementById("category").value = item.category || "";
    document.getElementById("brand").value = item.brand || "";
    document.getElementById("descriptionEn").value = item.descriptionEn || "";
    document.getElementById("descriptionHi").value = item.descriptionHi || "";
    document.getElementById("sizes").value = (item.sizes || []).join(", ");
    document.getElementById("formTitle").textContent = "Edit product";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function removeProduct(id) {
    const item = state.records.find((record) => record.id === id);
    if (!item || !window.confirm(`Delete ${item.nameEn}? This cannot be undone.`)) return;

    try {
      await deleteRecord(collections.products, id);
      showMessage("Product deleted.", "success");
      await loadPage(state.pageIndex, state.pages[state.pageIndex]?.cursor || null);
    } catch (error) {
      showMessage(error.message);
    }
  }

  search.addEventListener("input", renderTable);
  filter.addEventListener("change", renderTable);
  previousButton.addEventListener("click", () => {
    const previousIndex = state.pageIndex - 1;
    const previous = state.pages[previousIndex];
    state.records = previous.records;
    state.pageIndex = previousIndex;
    updateCategoryFilter();
    renderTable();
    updatePagination();
  });
  nextButton.addEventListener("click", () => {
    const current = state.pages[state.pageIndex];
    loadPage(state.pageIndex + 1, current.nextCursor);
  });
  document.getElementById("resetForm").addEventListener("click", resetForm);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.style.color = "";
    status.textContent = "Saving&hellip;";

    const id = document.getElementById("productId").value;
    const existing = state.records.find((item) => item.id === id);

    try {
      if (id) {
        await updateRecord(collections.products, id, getProductData());
      } else {
        await createRecord(collections.products, {
          ...getProductData(),
          images: existing?.images || []
        });
      }

      status.style.color = "#168341";
      status.textContent = "Product saved successfully.";
      resetForm();
      await loadPage(0);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  await loadPage(0);
}

async function init() {
  if (!isFirebaseConfigured) {
    main.insertAdjacentHTML(
      "afterbegin",
      '<div class="firebase-banner">Demo mode: add Firebase web configuration in <code>admin/js/config.js</code> to enable login and Firestore.</div>'
    );
    return;
  }

  const user = await requireAuth();
  if (!user) return;

  const dropdown = document.getElementById("profileDropdown");
  dropdown.insertAdjacentHTML(
    "beforeend",
    '<button id="logoutButton" class="secondary-action" type="button">Sign out</button>'
  );
  document.getElementById("logoutButton").addEventListener("click", logout);

  if (page === "products") {
    await renderProducts();
  }
}

init().catch((error) => showMessage(error.message));
