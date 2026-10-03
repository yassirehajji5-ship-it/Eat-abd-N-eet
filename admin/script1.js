/* =========================================================
   EAT & MEET KÉNITRA
   ADMIN DASHBOARD
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const STORAGE = {
    products: "eatMeetProducts",
    categories: "eatMeetCategories",
    settings: "eatMeetSettings",
    orders: "eatMeetOrders"
};

/* =========================================================
   DEFAULT DATA
   ========================================================= */

let products = [];
let categories = [];
let settings = {};
let orders = [];

let filteredProducts = [];
let filteredOrders = [];

let currentProductId = null;
let currentCategoryId = null;

/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initAdmin();
});

/* =========================================================
   INITIALIZATION
   ========================================================= */

async function initAdmin() {
    try {
        await loadData();

        setupNavigation();
        setupMobileSidebar();
        setupSearch();
        setupButtons();
        setupProductForm();
        setupCategoryForm();
        setupSettingsForm();
        setupOrderFilters();

        renderAll();

        refreshIcons();

    } catch (error) {
        console.error("Erreur initialisation admin :", error);
        showToast(
            "Impossible de charger les données.",
            "error"
        );
    }
}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadData() {

    const [
        productsResponse,
        categoriesResponse,
        settingsResponse
    ] = await Promise.all([
        fetch("../data/products.json"),
        fetch("../data/categories.json"),
        fetch("../data/settings.json")
    ]);

    if (!productsResponse.ok) {
        throw new Error("products.json introuvable");
    }

    if (!categoriesResponse.ok) {
        throw new Error("categories.json introuvable");
    }

    if (!settingsResponse.ok) {
        throw new Error("settings.json introuvable");
    }

    const defaultProducts = await productsResponse.json();
    const defaultCategories = await categoriesResponse.json();
    const defaultSettings = await settingsResponse.json();

    products = getStoredData(
        STORAGE.products,
        defaultProducts
    );

    categories = getStoredData(
        STORAGE.categories,
        defaultCategories
    );

    settings = getStoredData(
        STORAGE.settings,
        defaultSettings
    );

    orders = getStoredData(
        STORAGE.orders,
        []
    );

    filteredProducts = [...products];
    filteredOrders = [...orders];
}

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function getStoredData(key, fallback) {

    try {

        const stored = localStorage.getItem(key);

        if (!stored) {
            return fallback;
        }

        return JSON.parse(stored);

    } catch (error) {

        console.error(
            `Erreur localStorage: ${key}`,
            error
        );

        return fallback;
    }
}

function saveProducts() {

    localStorage.setItem(
        STORAGE.products,
        JSON.stringify(products)
    );
}

function saveCategories() {

    localStorage.setItem(
        STORAGE.categories,
        JSON.stringify(categories)
    );
}

function saveSettings() {

    localStorage.setItem(
        STORAGE.settings,
        JSON.stringify(settings)
    );
}

function saveOrders() {

    localStorage.setItem(
        STORAGE.orders,
        JSON.stringify(orders)
    );
}

/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {

    renderDashboard();

    renderProducts();

    renderCategories();

    renderImages();

    renderOrders();

    renderSettings();

    refreshIcons();
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {

    setText(
        "productCount",
        products.length
    );

    setText(
        "categoryCount",
        categories.length
    );

    setText(
        "orderCount",
        orders.length
    );

    setText(
        "featuredCount",
        products.filter(
            product => product.featured === true
        ).length
    );

    renderRecentProducts();

    renderRecentOrders();
}

/* =========================================================
   RECENT PRODUCTS
   ========================================================= */

function renderRecentProducts() {

    const container =
        document.getElementById("recentProducts");

    if (!container) return;

    const recent =
        [...products]
            .slice()
            .reverse()
            .slice(0, 5);

    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="package-open"></i>
                <p>Aucun produit</p>
            </div>
        `;

        refreshIcons();
        return;
    }

    container.innerHTML = recent.map(product => {

        return `
            <div class="recent-item">

                <img
                    src="../${escapeHTML(product.image || "images/restaurant/placeholder.jpg")}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.src='../images/restaurant/placeholder.jpg'"
                >

                <div class="recent-item-info">

                    <strong>
                        ${escapeHTML(product.name)}
                    </strong>

                    <span>
                        ${formatPrice(product.price)}
                    </span>

                </div>

            </div>
        `;

    }).join("");

    refreshIcons();
}

/* =========================================================
   RECENT ORDERS
   ========================================================= */

function renderRecentOrders() {

    const container =
        document.getElementById("recentOrders");

    if (!container) return;

    const recent =
        [...orders]
            .slice()
            .reverse()
            .slice(0, 5);

    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shopping-bag"></i>
                <p>Aucune commande</p>
            </div>
        `;

        refreshIcons();
        return;
    }

    container.innerHTML = recent.map(order => {

        return `
            <div class="recent-order">

                <div>
                    <strong>
                        ${escapeHTML(
                            order.customerName ||
                            "Client"
                        )}
                    </strong>

                    <span>
                        ${formatPrice(order.total)}
                    </span>
                </div>

                <span class="status-badge ${getStatusClass(order.status)}">
                    ${escapeHTML(
                        order.status || "Nouvelle"
                    )}
                </span>

            </div>
        `;

    }).join("");

    refreshIcons();
}

/* =========================================================
   PRODUCTS
   ========================================================= */

function renderProducts() {

    const tbody =
        document.getElementById("productsTableBody");

    if (!tbody) return;

    if (!filteredProducts.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="100">
                    <div class="empty-state">
                        <i data-lucide="search-x"></i>
                        <p>Aucun produit trouvé</p>
                    </div>
                </td>
            </tr>
        `;

        refreshIcons();
        return;
    }

    tbody.innerHTML =
        filteredProducts.map(product => {

            const category =
                getCategoryName(product.category);

            return `
                <tr>

                    <td>

                        <div class="table-product">

                            <img
                                src="../${escapeHTML(product.image || "")}"
                                alt="${escapeHTML(product.name)}"
                                onerror="this.style.opacity='0.2'"
                            >

                            <div>
                                <strong>
                                    ${escapeHTML(product.name)}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        product.description || ""
                                    )}
                                </small>
                            </div>

                        </div>

                    </td>

                    <td>
                        ${escapeHTML(category)}
                    </td>

                    <td>
                        <strong>
                            ${formatPrice(product.price)}
                        </strong>
                    </td>

                    <td>

                        <button
                            class="status-toggle ${
                                product.available !== false
                                    ? "active"
                                    : ""
                            }"
                            onclick="toggleProductAvailability('${product.id}')"
                        >

                            ${
                                product.available !== false
                                    ? "Disponible"
                                    : "Indisponible"
                            }

                        </button>

                    </td>

                    <td>

                        <button
                            class="featured-toggle ${
                                product.featured
                                    ? "active"
                                    : ""
                            }"
                            onclick="toggleFeatured('${product.id}')"
                            title="Produit vedette"
                        >

                            <i data-lucide="star"></i>

                        </button>

                    </td>

                    <td>

                        <div class="table-actions">

                            <button
                                class="icon-btn"
                                onclick="editProduct('${product.id}')"
                                title="Modifier"
                            >
                                <i data-lucide="pencil"></i>
                            </button>

                            <button
                                class="icon-btn danger"
                                onclick="deleteProduct('${product.id}')"
                                title="Supprimer"
                            >
                                <i data-lucide="trash-2"></i>
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");

    refreshIcons();
}

/* =========================================================
   PRODUCT SEARCH / FILTER
   ========================================================= */

function filterProducts() {

    const search =
        document
            .getElementById("productSearch")
            ?.value
            .toLowerCase()
            .trim() || "";

    const category =
        document
            .getElementById("productCategoryFilter")
            ?.value || "all";

    const status =
        document
            .getElementById("productStatusFilter")
            ?.value || "all";

    filteredProducts =
        products.filter(product => {

            const text =
                `${product.name || ""}
                 ${product.description || ""}
                 ${product.category || ""}`
                    .toLowerCase();

            const matchesSearch =
                !search ||
                text.includes(search);

            const matchesCategory =
                category === "all" ||
                product.category === category;

            const available =
                product.available !== false;

            const matchesStatus =
                status === "all" ||
                (status === "available" && available) ||
                (status === "unavailable" && !available);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });

    renderProducts();
}

/* =========================================================
   ADD PRODUCT
   ========================================================= */

function openProductModal(product = null) {

    currentProductId =
        product?.id || null;

    const modal =
        document.getElementById("productModal");

    if (!modal) return;

    const title =
        modal.querySelector(".modal-title");

    if (title) {

        title.textContent =
            product
                ? "Modifier le produit"
                : "Ajouter un produit";
    }

    setInputValue(
        "productName",
        product?.name || ""
    );

    setInputValue(
        "productCategory",
        product?.category || ""
    );

    setInputValue(
        "productPrice",
        product?.price ?? ""
    );

    setInputValue(
        "productImage",
        product?.image || ""
    );

    setInputValue(
        "productDescription",
        product?.description || ""
    );

    setCheckboxValue(
        "productFeatured",
        product?.featured || false
    );

    setCheckboxValue(
        "productAvailable",
        product
            ? product.available !== false
            : true
    );

    modal.classList.add("active");

    refreshIcons();
}

function closeProductModal() {

    const modal =
        document.getElementById("productModal");

    if (modal) {
        modal.classList.remove("active");
    }

    currentProductId = null;
}

function setupProductForm() {

    const form =
        document.getElementById("productForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                getInputValue("productName");

            const category =
                getInputValue("productCategory");

            const price =
                parseFloat(
                    getInputValue("productPrice")
                );

            const image =
                getInputValue("productImage");

            const description =
                getInputValue(
                    "productDescription"
                );

            const featured =
                getCheckboxValue(
                    "productFeatured"
                );

            const available =
                getCheckboxValue(
                    "productAvailable"
                );

            if (!name) {

                showToast(
                    "Le nom du produit est obligatoire.",
                    "error"
                );

                return;
            }

            if (!category) {

                showToast(
                    "Choisissez une catégorie.",
                    "error"
                );

                return;
            }

            if (Number.isNaN(price)) {

                showToast(
                    "Entrez un prix valide.",
                    "error"
                );

                return;
            }

            if (currentProductId) {

                const product =
                    products.find(
                        p => p.id === currentProductId
                    );

                if (product) {

                    product.name = name;
                    product.category = category;
                    product.price = price;
                    product.image = image;
                    product.description = description;
                    product.featured = featured;
                    product.available = available;
                }

                showToast(
                    "Produit modifié avec succès.",
                    "success"
                );

            } else {

                const newProduct = {

                    id: generateId(
                        "product"
                    ),

                    name,

                    category,

                    section:
                        findSectionByCategory(
                            category
                        ),

                    price,

                    currency: "DH",

                    description,

                    image,

                    featured,

                    available
                };

                products.unshift(
                    newProduct
                );

                showToast(
                    "Produit ajouté avec succès.",
                    "success"
                );
            }

            saveProducts();

            filteredProducts =
                [...products];

            closeProductModal();

            renderAll();
        }
    );
}

/* =========================================================
   EDIT PRODUCT
   ========================================================= */

function editProduct(id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;

    openProductModal(product);
}

/* =========================================================
   DELETE PRODUCT
   ========================================================= */

function deleteProduct(id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;

    openConfirmModal(
        "Supprimer ce produit ?",
        `Le produit "${product.name}" sera supprimé définitivement.`,
        () => {

            products =
                products.filter(
                    item => item.id !== id
                );

            saveProducts();

            filteredProducts =
                [...products];

            renderAll();

            showToast(
                "Produit supprimé.",
                "success"
            );
        }
    );
}

/* =========================================================
   PRODUCT STATUS
   ========================================================= */

function toggleProductAvailability(id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;

    product.available =
        product.available === false;

    saveProducts();

    filteredProducts =
        [...products];

    renderAll();

    showToast(
        product.available
            ? "Produit disponible."
            : "Produit masqué.",
        "success"
    );
}

/* =========================================================
   FEATURED
   ========================================================= */

function toggleFeatured(id) {

    const product =
        products.find(
            item => item.id === id
        );

    if (!product) return;

    product.featured =
        !product.featured;

    saveProducts();

    renderAll();

    showToast(
        product.featured
            ? "Produit ajouté aux vedettes."
            : "Produit retiré des vedettes.",
        "success"
    );
}

/* =========================================================
   CATEGORIES
   ========================================================= */

function renderCategories() {

    const container =
        document.getElementById(
            "categoriesGrid"
        );

    if (!container) return;

    if (!categories.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="folder-open"></i>
                <p>Aucune catégorie</p>
            </div>
        `;

        refreshIcons();
        return;
    }

    container.innerHTML =
        categories.map(category => {

            const count =
                products.filter(
                    product =>
                        product.category === category.id
                ).length;

            return `
                <div class="category-card">

                    <div class="category-image">

                        <img
                            src="../${escapeHTML(category.image || "")}"
                            alt="${escapeHTML(category.name)}"
                            onerror="this.style.opacity='0.2'"
                        >

                        <span class="category-status ${
                            category.active !== false
                                ? "active"
                                : ""
                        }">
                            ${
                                category.active !== false
                                    ? "Active"
                                    : "Inactive"
                            }
                        </span>

                    </div>

                    <div class="category-content">

                        <h3>
                            ${escapeHTML(category.name)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                category.description || ""
                            )}
                        </p>

                        <div class="category-meta">

                            <span>
                                ${count} produit${
                                    count > 1
                                        ? "s"
                                        : ""
                                }
                            </span>

                            <div>

                                <button
                                    class="icon-btn"
                                    onclick="editCategory('${category.id}')"
                                >
                                    <i data-lucide="pencil"></i>
                                </button>

                                <button
                                    class="icon-btn danger"
                                    onclick="deleteCategory('${category.id}')"
                                >
                                    <i data-lucide="trash-2"></i>
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            `;

        }).join("");

    refreshIcons();
}

/* =========================================================
   CATEGORY MODAL
   ========================================================= */

function openCategoryModal(category = null) {

    currentCategoryId =
        category?.id || null;

    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (!modal) return;

    const title =
        modal.querySelector(".modal-title");

    if (title) {

        title.textContent =
            category
                ? "Modifier la catégorie"
                : "Ajouter une catégorie";
    }

    setInputValue(
        "categoryName",
        category?.name || ""
    );

    setInputValue(
        "categoryDescription",
        category?.description || ""
    );

    setInputValue(
        "categoryImage",
        category?.image || ""
    );

    setInputValue(
        "categorySection",
        category?.section || ""
    );

    setCheckboxValue(
        "categoryActive",
        category
            ? category.active !== false
            : true
    );

    modal.classList.add("active");

    refreshIcons();
}

function closeCategoryModal() {

    const modal =
        document.getElementById(
            "categoryModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }

    currentCategoryId = null;
}

function setupCategoryForm() {

    const form =
        document.getElementById(
            "categoryForm"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                getInputValue(
                    "categoryName"
                );

            const description =
                getInputValue(
                    "categoryDescription"
                );

            const image =
                getInputValue(
                    "categoryImage"
                );

            const section =
                getInputValue(
                    "categorySection"
                );

            const active =
                getCheckboxValue(
                    "categoryActive"
                );

            if (!name) {

                showToast(
                    "Le nom est obligatoire.",
                    "error"
                );

                return;
            }

            if (currentCategoryId) {

                const category =
                    categories.find(
                        item =>
                            item.id ===
                            currentCategoryId
                    );

                if (category) {

                    category.name = name;
                    category.description =
                        description;
                    category.image = image;
                    category.section = section;
                    category.active = active;
                }

                showToast(
                    "Catégorie modifiée.",
                    "success"
                );

            } else {

                const newCategory = {

                    id: slugify(name),

                    name,

                    description,

                    section,

                    image,

                    icon: "folder",

                    active,

                    order:
                        categories.length + 1,

                    subcategories: []
                };

                categories.push(
                    newCategory
                );

                showToast(
                    "Catégorie ajoutée.",
                    "success"
                );
            }

            saveCategories();

            closeCategoryModal();

            renderAll();
        }
    );
}

/* =========================================================
   EDIT CATEGORY
   ========================================================= */

function editCategory(id) {

    const category =
        categories.find(
            item => item.id === id
        );

    if (!category) return;

    openCategoryModal(category);
}

/* =========================================================
   DELETE CATEGORY
   ========================================================= */

function deleteCategory(id) {

    const category =
        categories.find(
            item => item.id === id
        );

    if (!category) return;

    const productCount =
        products.filter(
            product =>
                product.category === id
        ).length;

    if (productCount > 0) {

        showToast(
            `Impossible : ${productCount} produit(s) utilisent cette catégorie.`,
            "error"
        );

        return;
    }

    openConfirmModal(
        "Supprimer cette catégorie ?",
        `La catégorie "${category.name}" sera supprimée.`,
        () => {

            categories =
                categories.filter(
                    item => item.id !== id
                );

            saveCategories();

            renderAll();

            showToast(
                "Catégorie supprimée.",
                "success"
            );
        }
    );
}

/* =========================================================
   IMAGES LIBRARY
   ========================================================= */

function renderImages() {

    const container =
        document.getElementById(
            "imagesGrid"
        );

    if (!container) return;

    const images = [];

    products.forEach(product => {

        if (product.image) {

            images.push({
                path: product.image,
                name: product.name,
                type: "Produit"
            });
        }
    });

    categories.forEach(category => {

        if (category.image) {

            images.push({
                path: category.image,
                name: category.name,
                type: "Catégorie"
            });
        }
    });

    if (settings.restaurant?.logo) {

        images.push({
            path: settings.restaurant.logo,
            name: "Logo restaurant",
            type: "Restaurant"
        });
    }

    if (settings.restaurant?.coverImage) {

        images.push({
            path:
                settings.restaurant.coverImage,
            name: "Cover restaurant",
            type: "Restaurant"
        });
    }

    const uniqueImages =
        [...new Map(
            images.map(
                image => [
                    image.path,
                    image
                ]
            )
        ).values()];

    if (!uniqueImages.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="image-off"></i>
                <p>Aucune image</p>
            </div>
        `;

        refreshIcons();
        return;
    }

    container.innerHTML =
        uniqueImages.map(image => {

            return `
                <div class="image-card">

                    <div class="image-preview">

                        <img
                            src="../${escapeHTML(image.path)}"
                            alt="${escapeHTML(image.name)}"
                            onerror="this.style.opacity='0.2'"
                        >

                    </div>

                    <div class="image-card-content">

                        <strong>
                            ${escapeHTML(image.name)}
                        </strong>

                        <span>
                            ${escapeHTML(image.type)}
                        </span>

                        <small>
                            ${escapeHTML(image.path)}
                        </small>

                    </div>

                </div>
            `;

        }).join("");

    refreshIcons();
}

/* =========================================================
   ORDERS
   ========================================================= */

function renderOrders() {

    const container =
        document.getElementById(
            "ordersContainer"
        );

    if (!container) return;

    if (!filteredOrders.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="shopping-bag"></i>
                <h3>Aucune commande</h3>
                <p>Les nouvelles commandes apparaîtront ici.</p>
            </div>
        `;

        refreshIcons();
        return;
    }

    container.innerHTML =
        filteredOrders.map(order => {

            const items =
                order.items || [];

            return `
                <div class="order-card">

                    <div class="order-header">

                        <div>

                            <strong>
                                #${escapeHTML(
                                    order.id || "----"
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    order.date ||
                                    order.createdAt
                                )}
                            </span>

                        </div>

                        <select
                            onchange="updateOrderStatus(
                                '${order.id}',
                                this.value
                            )"
                        >

                            ${getOrderStatusOptions(
                                order.status
                            )}

                        </select>

                    </div>

                    <div class="order-body">

                        <div class="order-customer">

                            <strong>
                                ${escapeHTML(
                                    order.customerName ||
                                    "Client"
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    order.phone || ""
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    order.orderType || ""
                                )}
                            </span>

                        </div>

                        <div class="order-items">

                            ${items.map(item => {

                                return `
                                    <div class="order-item">

                                        <span>
                                            ${
                                                item.quantity || 1
                                            } ×
                                            ${escapeHTML(
                                                item.name || ""
                                            )}
                                        </span>

                                        <strong>
                                            ${formatPrice(
                                                (item.price || 0) *
                                                (item.quantity || 1)
                                            )}
                                        </strong>

                                    </div>
                                `;

                            }).join("")}

                        </div>

                    </div>

                    <div class="order-footer">

                        <span>
                            Total
                        </span>

                        <strong>
                            ${formatPrice(
                                order.total || 0
                            )}
                        </strong>

                    </div>

                </div>
            `;

        }).join("");

    refreshIcons();
}

/* =========================================================
   ORDER STATUS
   ========================================================= */

function updateOrderStatus(
    orderId,
    status
) {

    const order =
        orders.find(
            item => item.id === orderId
        );

    if (!order) return;

    order.status = status;

    saveOrders();

    filteredOrders =
        [...orders];

    renderOrders();

    renderDashboard();

    showToast(
        "Statut de la commande mis à jour.",
        "success"
    );
}

/* =========================================================
   ORDER FILTERS
   ========================================================= */

function setupOrderFilters() {

    document
        .querySelectorAll(
            "[data-order-status]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            "[data-order-status]"
                        )
                        .forEach(
                            btn =>
                                btn.classList.remove(
                                    "active"
                                )
                        );

                    button.classList.add(
                        "active"
                    );

                    const status =
                        button.dataset.orderStatus;

                    if (
                        !status ||
                        status === "all"
                    ) {

                        filteredOrders =
                            [...orders];

                    } else {

                        filteredOrders =
                            orders.filter(
                                order =>
                                    order.status ===
                                    status
                            );
                    }

                    renderOrders();
                }
            );
        });
}

/* =========================================================
   SETTINGS
   ========================================================= */

function renderSettings() {

    const restaurant =
        settings.restaurant || {};

    const contact =
        settings.contact || {};

    const location =
        settings.location || {};

    const order =
        settings.order || {};

    setInputValue(
        "settingRestaurantName",
        restaurant.name || ""
    );

    setInputValue(
        "settingTagline",
        restaurant.tagline || ""
    );

    setInputValue(
        "settingPhone",
        contact.phoneDisplay ||
        contact.phone ||
        ""
    );

    setInputValue(
        "settingWhatsapp",
        contact.whatsapp || ""
    );

    setInputValue(
        "settingInstagram",
        contact.instagram || ""
    );

    setInputValue(
        "settingAddress",
        location.address || ""
    );

    setInputValue(
        "settingMaps",
        location.googleMapsUrl || ""
    );

    setInputValue(
        "settingDeliveryFee",
        order.deliveryFee ?? 0
    );

    setInputValue(
        "settingCurrency",
        order.currencySymbol ||
        order.currency ||
        "DH"
    );
}

/* =========================================================
   SETTINGS FORM
   ========================================================= */

function setupSettingsForm() {

    const form =
        document.getElementById(
            "settingsForm"
        );

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            if (!settings.restaurant) {
                settings.restaurant = {};
            }

            if (!settings.contact) {
                settings.contact = {};
            }

            if (!settings.location) {
                settings.location = {};
            }

            if (!settings.order) {
                settings.order = {};
            }

            settings.restaurant.name =
                getInputValue(
                    "settingRestaurantName"
                );

            settings.restaurant.tagline =
                getInputValue(
                    "settingTagline"
                );

            settings.contact.phoneDisplay =
                getInputValue(
                    "settingPhone"
                );

            settings.contact.phone =
                normalizePhone(
                    getInputValue(
                        "settingPhone"
                    )
                );

            settings.contact.whatsapp =
                getInputValue(
                    "settingWhatsapp"
                );

            settings.contact.instagram =
                getInputValue(
                    "settingInstagram"
                );

            settings.location.address =
                getInputValue(
                    "settingAddress"
                );

            settings.location.googleMapsUrl =
                getInputValue(
                    "settingMaps"
                );

            settings.order.deliveryFee =
                Number(
                    getInputValue(
                        "settingDeliveryFee"
                    )
                ) || 0;

            settings.order.currencySymbol =
                getInputValue(
                    "settingCurrency"
                ) || "DH";

            saveSettings();

            showToast(
                "Paramètres enregistrés.",
                "success"
            );

            renderAll();
        }
    );
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            "[data-page]"
        );

    const pages =
        document.querySelectorAll(
            ".admin-page"
        );

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            event => {

                event.preventDefault();

                const page =
                    item.dataset.page;

                if (!page) return;

                navItems.forEach(
                    nav =>
                        nav.classList.remove(
                            "active"
                        )
                );

                item.classList.add(
                    "active"
                );

                pages.forEach(
                    section =>
                        section.classList.remove(
                            "active"
                        )
                );

                const target =
                    document.getElementById(
                        page
                    );

                if (target) {

                    target.classList.add(
                        "active"
                    );
                }

                closeMobileSidebar();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    });
}

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function setupMobileSidebar() {

    const toggle =
        document.getElementById(
            "sidebarToggle"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );

    if (!toggle || !sidebar) return;

    toggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            overlay?.classList.toggle(
                "active"
            );
        }
    );

    overlay?.addEventListener(
        "click",
        closeMobileSidebar
    );
}

function closeMobileSidebar() {

    document
        .querySelector(
            ".sidebar"
        )
        ?.classList.remove(
            "open"
        );

    document
        .querySelector(
            ".sidebar-overlay"
        )
        ?.classList.remove(
            "active"
        );
}

/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const search =
        document.getElementById(
            "productSearch"
        );

    search?.addEventListener(
        "input",
        filterProducts
    );

    const globalSearch =
        document.getElementById(
            "globalSearch"
        );

    globalSearch?.addEventListener(
        "input",
        () => {

            const value =
                globalSearch.value
                    .toLowerCase()
                    .trim();

            if (!value) return;

            const productPage =
                document.getElementById(
                    "products"
                );

            const nav =
                document.querySelector(
                    '[data-page="products"]'
                );

            document
                .querySelectorAll(
                    ".admin-page"
                )
                .forEach(
                    page =>
                        page.classList.remove(
                            "active"
                        )
                );

            productPage?.classList.add(
                "active"
            );

            document
                .querySelectorAll(
                    "[data-page]"
                )
                .forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

            nav?.classList.add(
                "active"
            );

            if (search) {

                search.value = value;

                filterProducts();
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {

                event.preventDefault();

                globalSearch?.focus();
            }

            if (
                event.key === "Escape"
            ) {

                closeAllModals();
            }
        }
    );
}

/* =========================================================
   BUTTONS
   ========================================================= */

function setupButtons() {

    document
        .querySelectorAll(
            "[data-action='add-product']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => openProductModal()
            );
        });

    document
        .querySelectorAll(
            "[data-action='add-category']"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => openCategoryModal()
            );
        });

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeAllModals
            );
        });

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "active"
                        );
                    }
                }
            );
        });
}

/* =========================================================
   CONFIRM MODAL
   ========================================================= */

function openConfirmModal(
    title,
    message,
    callback
) {

    const modal =
        document.getElementById(
            "confirmModal"
        );

    if (!modal) {

        if (
            confirm(
                `${title}\n\n${message}`
            )
        ) {
            callback();
        }

        return;
    }

    const titleElement =
        modal.querySelector(
            ".confirm-title"
        );

    const messageElement =
        modal.querySelector(
            ".confirm-message"
        );

    const confirmButton =
        modal.querySelector(
            "[data-confirm]"
        );

    if (titleElement) {
        titleElement.textContent =
            title;
    }

    if (messageElement) {
        messageElement.textContent =
            message;
    }

    modal.classList.add(
        "active"
    );

    if (confirmButton) {

        confirmButton.onclick =
            () => {

                modal.classList.remove(
                    "active"
                );

                callback();
            };
    }
}

/* =========================================================
   CLOSE MODALS
   ========================================================= */

function closeAllModals() {

    document
        .querySelectorAll(
            ".modal.active"
        )
        .forEach(
            modal =>
                modal.classList.remove(
                    "active"
                )
        );

    currentProductId = null;
    currentCategoryId = null;
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    if (!toast) {

        console.log(
            `[${type}]`,
            message
        );

        return;
    }

    const text =
        toast.querySelector(
            ".toast-message"
        );

    const icon =
        toast.querySelector(
            "[data-toast-icon]"
        );

    if (text) {
        text.textContent =
            message;
    }

    toast.className =
        `toast ${type} active`;

    if (icon) {

        icon.setAttribute(
            "data-lucide",
            type === "error"
                ? "circle-x"
                : "circle-check"
        );
    }

    refreshIcons();

    clearTimeout(
        window.toastTimer
    );

    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "active"
                );

            },
            3000
        );
}

/* =========================================================
   HELPERS
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value;
    }
}

function getInputValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.value.trim()
        : "";
}

function setCheckboxValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.checked =
            Boolean(value);
    }
}

function getCheckboxValue(id) {

    const element =
        document.getElementById(id);

    return element
        ? element.checked
        : false;
}

function formatPrice(price) {

    const number =
        Number(price) || 0;

    return `${number.toFixed(2)} DH`;
}

function formatDate(date) {

    if (!date) {
        return "Date inconnue";
    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return "Date inconnue";
    }

    return parsed.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function getCategoryName(id) {

    const category =
        categories.find(
            item => item.id === id
        );

    if (category) {
        return category.name;
    }

    for (
        const mainCategory
        of categories
    ) {

        const sub =
            mainCategory.subcategories
                ?.find(
                    item =>
                        item.id === id
                );

        if (sub) {
            return sub.name;
        }
    }

    return id || "Sans catégorie";
}

function findSectionByCategory(
    categoryId
) {

    for (
        const category
        of categories
    ) {

        if (
            category.id ===
            categoryId
        ) {

            return category.section;
        }

        if (
            category.subcategories
        ) {

            const exists =
                category.subcategories.some(
                    sub =>
                        sub.id ===
                        categoryId
                );

            if (exists) {
                return category.section;
            }
        }
    }

    return "";
}

function generateId(prefix) {

    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}

function slugify(text) {

    return text
        .toString()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );
}

function normalizePhone(phone) {

    return phone
        .replace(
            /[^0-9+]/g,
            ""
        )
        .replace(
            /^\+/,
            ""
        );
}

function getStatusClass(status) {

    const map = {

        "Nouvelle":
            "status-new",

        "Confirmée":
            "status-confirmed",

        "En préparation":
            "status-preparing",

        "Prête":
            "status-ready",

        "Livrée":
            "status-delivered",

        "Annulée":
            "status-cancelled"
    };

    return map[status] ||
        "status-new";
}

function getOrderStatusOptions(
    current
) {

    const statuses = [
        "Nouvelle",
        "Confirmée",
        "En préparation",
        "Prête",
        "Livrée",
        "Annulée"
    ];

    return statuses.map(
        status => `
            <option
                value="${escapeHTML(status)}"
                ${
                    status === current
                        ? "selected"
                        : ""
                }
            >
                ${escapeHTML(status)}
            </option>
        `
    ).join("");
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

/* =========================================================
   LUCIDE
   ========================================================= */

function refreshIcons() {

    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();
    }
}

/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.openProductModal =
    openProductModal;

window.closeProductModal =
    closeProductModal;

window.editProduct =
    editProduct;

window.deleteProduct =
    deleteProduct;

window.toggleFeatured =
    toggleFeatured;

window.toggleProductAvailability =
    toggleProductAvailability;

window.openCategoryModal =
    openCategoryModal;

window.closeCategoryModal =
    closeCategoryModal;

window.editCategory =
    editCategory;

window.deleteCategory =
    deleteCategory;

window.updateOrderStatus =
    updateOrderStatus;

window.closeAllModals =
    closeAllModals;