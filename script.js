/* =========================================================
   EAT & MEET — KÉNITRA
   MAIN JAVASCRIPT
========================================================= */


/* =========================================================
   01 — GLOBAL STATE
========================================================= */

let cart = JSON.parse(
    localStorage.getItem("eatMeetCart")
) || [];


/* =========================================================
   02 — DOM ELEMENTS
========================================================= */

const loader = document.getElementById("loader");

const header = document.querySelector(".header");

const cartButton = document.getElementById("cartButton");

const cartDrawer = document.getElementById("cartDrawer");

const cartOverlay = document.getElementById("cartOverlay");

const closeCart = document.getElementById("closeCart");

const cartItems = document.getElementById("cartItems");

const cartCount = document.getElementById("cartCount");

const cartTotal = document.getElementById("cartTotal");

const checkoutButton =
    document.getElementById("checkoutButton");

const continueShopping =
    document.getElementById("continueShopping");


/* =========================================================
   03 — PAGE LOADER
========================================================= */

window.addEventListener("load", () => {

    setTimeout(() => {

        if (loader) {
            loader.classList.add("hide");
        }

    }, 700);

});


/* =========================================================
   04 — LUCIDE ICONS
========================================================= */

function refreshIcons() {

    if (
        typeof lucide !== "undefined"
    ) {

        lucide.createIcons();

    }

}

refreshIcons();


/* =========================================================
   05 — HEADER SCROLL EFFECT
========================================================= */

function handleHeaderScroll() {

    if (!header) {
        return;
    }

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

}

window.addEventListener(
    "scroll",
    handleHeaderScroll
);

handleHeaderScroll();


/* =========================================================
   06 — CART OPEN
========================================================= */

function openCart() {

    if (!cartDrawer || !cartOverlay) {
        return;
    }

    cartDrawer.classList.add("active");

    cartOverlay.classList.add("active");

    document.body.style.overflow = "hidden";

}


/* =========================================================
   07 — CART CLOSE
========================================================= */

function closeCartDrawer() {

    if (!cartDrawer || !cartOverlay) {
        return;
    }

    cartDrawer.classList.remove("active");

    cartOverlay.classList.remove("active");

    document.body.style.overflow = "";

}


/* =========================================================
   08 — CART EVENTS
========================================================= */

if (cartButton) {

    cartButton.addEventListener(
        "click",
        openCart
    );

}


if (closeCart) {

    closeCart.addEventListener(
        "click",
        closeCartDrawer
    );

}


if (cartOverlay) {

    cartOverlay.addEventListener(
        "click",
        closeCartDrawer
    );

}


if (continueShopping) {

    continueShopping.addEventListener(
        "click",
        closeCartDrawer
    );

}


/* =========================================================
   09 — ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeCartDrawer();

        }

    }
);


/* =========================================================
   10 — SAVE CART
========================================================= */

function saveCart() {

    localStorage.setItem(
        "eatMeetCart",
        JSON.stringify(cart)
    );

}


/* =========================================================
   11 — FORMAT PRICE
========================================================= */

function formatPrice(price) {

    return `${Number(price).toFixed(0)} DH`;

}


/* =========================================================
   12 — CART TOTAL QUANTITY
========================================================= */

function getCartQuantity() {

    return cart.reduce(
        (total, item) => {

            return total + item.quantity;

        },
        0
    );

}


/* =========================================================
   13 — CART TOTAL PRICE
========================================================= */

function getCartTotal() {

    return cart.reduce(
        (total, item) => {

            return total +
                (
                    Number(item.price) *
                    Number(item.quantity)
                );

        },
        0
    );

}


/* =========================================================
   14 — UPDATE CART COUNT
========================================================= */

function updateCartCount() {

    if (!cartCount) {
        return;
    }

    const quantity =
        getCartQuantity();

    cartCount.textContent =
        quantity;


    cartCount.style.transform =
        "scale(1.35)";


    setTimeout(() => {

        cartCount.style.transform =
            "scale(1)";

    }, 180);

}


/* =========================================================
   15 — UPDATE CART TOTAL
========================================================= */

function updateCartTotal() {

    if (!cartTotal) {
        return;
    }

    cartTotal.textContent =
        formatPrice(
            getCartTotal()
        );

}


/* =========================================================
   16 — ADD PRODUCT TO CART
========================================================= */

function addToCart(product) {

    if (!product) {
        return;
    }


    const existingProduct =
        cart.find(
            item =>
                item.id === product.id
        );


    if (existingProduct) {

        existingProduct.quantity += 1;

    } else {

        cart.push({

            id: product.id,

            name: product.name,

            price: Number(product.price),

            image: product.image || "",

            quantity: 1

        });

    }


    saveCart();

    renderCart();

    updateCartCount();

    updateCartTotal();


    openCart();

}


/* =========================================================
   17 — REMOVE PRODUCT
========================================================= */

function removeFromCart(productId) {

    cart = cart.filter(
        item =>
            item.id !== productId
    );


    saveCart();

    renderCart();

    updateCartCount();

    updateCartTotal();

}


/* =========================================================
   18 — INCREASE QUANTITY
========================================================= */

function increaseQuantity(productId) {

    const product =
        cart.find(
            item =>
                item.id === productId
        );


    if (!product) {
        return;
    }


    product.quantity += 1;


    saveCart();

    renderCart();

    updateCartCount();

    updateCartTotal();

}


/* =========================================================
   19 — DECREASE QUANTITY
========================================================= */

function decreaseQuantity(productId) {

    const product =
        cart.find(
            item =>
                item.id === productId
        );


    if (!product) {
        return;
    }


    product.quantity -= 1;


    if (product.quantity <= 0) {

        removeFromCart(productId);

        return;

    }


    saveCart();

    renderCart();

    updateCartCount();

    updateCartTotal();

}


/* =========================================================
   20 — RENDER EMPTY CART
========================================================= */

function renderEmptyCart() {

    if (!cartItems) {
        return;
    }


    cartItems.innerHTML = `

        <div class="empty-cart">

            <i data-lucide="shopping-bag"></i>

            <h3>
                Votre panier est vide
            </h3>

            <p>
                Ajoutez vos plats préférés
                pour commencer votre commande.
            </p>

            <button
                class="primary-btn"
                id="continueShoppingDynamic"
            >
                Découvrir le menu
            </button>

        </div>

    `;


    const button =
        document.getElementById(
            "continueShoppingDynamic"
        );


    if (button) {

        button.addEventListener(
            "click",
            closeCartDrawer
        );

    }


    refreshIcons();

}


/* =========================================================
   21 — RENDER CART
========================================================= */

function renderCart() {

    if (!cartItems) {
        return;
    }


    if (cart.length === 0) {

        renderEmptyCart();

        return;

    }


    cartItems.innerHTML = "";


    cart.forEach(
        (product) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "cart-product";


            item.innerHTML = `

                <div class="cart-product-image">

                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                        onerror="
                            this.src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'
                        "
                    >

                </div>


                <div class="cart-product-info">

                    <h4>
                        ${escapeHTML(product.name)}
                    </h4>

                    <p>
                        ${formatPrice(product.price)}
                    </p>


                    <div class="quantity-control">

                        <button
                            type="button"
                            class="decrease-item"
                            data-id="${product.id}"
                        >
                            −
                        </button>


                        <span>
                            ${product.quantity}
                        </span>


                        <button
                            type="button"
                            class="increase-item"
                            data-id="${product.id}"
                        >
                            +
                        </button>

                    </div>

                </div>


                <button
                    type="button"
                    class="remove-item"
                    data-id="${product.id}"
                    aria-label="Supprimer ${escapeHTML(product.name)}"
                >
                    <i data-lucide="trash-2"></i>
                </button>

            `;


            cartItems.appendChild(item);

        }
    );


    addCartItemEvents();

    refreshIcons();

}


/* =========================================================
   22 — CART ITEM EVENTS
========================================================= */

function addCartItemEvents() {

    document
        .querySelectorAll(".increase-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        increaseQuantity(id);

                    }
                );

            }
        );


    document
        .querySelectorAll(".decrease-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        decreaseQuantity(id);

                    }
                );

            }
        );


    document
        .querySelectorAll(".remove-item")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        removeFromCart(id);

                    }
                );

            }
        );

}


/* =========================================================
   23 — ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   24 — CHECKOUT
========================================================= */

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        () => {

            if (cart.length === 0) {

                alert(
                    "Votre panier est vide."
                );

                return;

            }


            window.location.href =
                "checkout.html";

        }
    );

}


/* =========================================================
   25 — SCROLL REVEAL
========================================================= */

function initializeRevealAnimations() {

    const elements =
        document.querySelectorAll(
            ".section-heading, .gateway-card, .restaurant-info"
        );


    elements.forEach(
        element => {

            element.classList.add(
                "reveal"
            );

        }
    );


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    elements.forEach(
        element => {

            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   26 — SMOOTH ANCHOR LINKS
========================================================= */

document
    .querySelectorAll(
        'a[href^="#"]'
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    const targetId =
                        link.getAttribute(
                            "href"
                        );


                    if (
                        !targetId ||
                        targetId === "#"
                    ) {

                        return;

                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) {

                        return;

                    }


                    event.preventDefault();


                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

        }
    );


/* =========================================================
   27 — CARD TILT EFFECT
========================================================= */

document
    .querySelectorAll(
        ".gateway-card"
    )
    .forEach(
        card => {

            card.addEventListener(
                "mousemove",
                event => {

                    if (
                        window.innerWidth < 900
                    ) {
                        return;
                    }


                    const rect =
                        card.getBoundingClientRect();


                    const x =
                        event.clientX -
                        rect.left;


                    const y =
                        event.clientY -
                        rect.top;


                    const centerX =
                        rect.width / 2;


                    const centerY =
                        rect.height / 2;


                    const rotateX =
                        (
                            y - centerY
                        ) / 35;


                    const rotateY =
                        (
                            centerX - x
                        ) / 35;


                    card.style.transform =
                        `
                        translateY(-10px)
                        perspective(1000px)
                        rotateX(${rotateX}deg)
                        rotateY(${rotateY}deg)
                        scale(1.01)
                        `;

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "";

                }
            );

        }
    );


/* =========================================================
   28 — INITIALIZE
========================================================= */

function initializeApp() {

    renderCart();

    updateCartCount();

    updateCartTotal();

    initializeRevealAnimations();

    refreshIcons();

}


initializeApp();


/* =========================================================
   29 — GLOBAL ACCESS
========================================================= */

window.EatMeet = {

    cart,

    addToCart,

    removeFromCart,

    increaseQuantity,

    decreaseQuantity,

    openCart,

    closeCartDrawer,

    getCartTotal,

    getCartQuantity

};