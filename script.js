/* =============================================
   BRUNO.ELECTRO — script.js
   Navbar · Burger · Categorías · Carrito
   Scroll reveal · Contadores · Form handler
============================================= */

(function () {
    'use strict';

    /* ================================================
       NAVBAR SCROLL
    ================================================ */
    const navbar = document.getElementById('navbar');

    function handleScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        updateActiveNav();
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    /* ================================================
       BURGER MENU
    ================================================ */
    const burger   = document.getElementById('burger');
    const navLinks = document.getElementById('navLinks');

    burger.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('open');
        burger.classList.toggle('open', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('open');
            burger.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    /* ================================================
       SMOOTH SCROLL
    ================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = navbar.offsetHeight + 10;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    /* ================================================
       ACTIVE NAV LINK
    ================================================ */
    const sections   = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.navbar__links a[href^="#"]');

    function updateActiveNav() {
        const scrollY = window.scrollY + 130;
        sections.forEach(function (section) {
            const top    = section.offsetTop;
            const height = section.offsetHeight;
            const id     = section.getAttribute('id');
            const link   = document.querySelector('.navbar__links a[href="#' + id + '"]');
            if (link) {
                if (scrollY >= top && scrollY < top + height) {
                    navAnchors.forEach(function (l) { l.style.color = ''; });
                    link.style.color = '#ffffff';
                }
            }
        });
    }

    /* ================================================
       SCROLL REVEAL
    ================================================ */
    const revealEls = document.querySelectorAll('.reveal, .reveal-up, .reveal-right');

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });

    /* ================================================
       CATEGORY FILTER
    ================================================ */
    const catChips   = document.querySelectorAll('.cat-chip');
    const productCards = document.querySelectorAll('.product-card[data-cat]');

    catChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            catChips.forEach(function (c) { c.classList.remove('cat-chip--active'); });
            this.classList.add('cat-chip--active');

            const cat = this.dataset.cat;
            productCards.forEach(function (card) {
                if (cat === 'todos' || card.dataset.cat === cat) {
                    card.style.display = '';
                    // re-trigger reveal if needed
                    if (!card.classList.contains('visible')) {
                        card.classList.add('visible');
                    }
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    /* ================================================
       CARRITO DE COMPRAS
    ================================================ */
    let cart = {}; // { id: { name, price, emoji, image, qty } }

    const cartBtn      = document.getElementById('cartBtn');
    const cartCount    = document.getElementById('cartCount');
    const cartOverlay  = document.getElementById('cartOverlay');
    const cartSidebar  = document.getElementById('cartSidebar');
    const cartClose    = document.getElementById('cartClose');
    const cartBody     = document.getElementById('cartBody');
    const cartEmpty    = document.getElementById('cartEmpty');
    const cartFooter   = document.getElementById('cartFooter');
    const cartTotal    = document.getElementById('cartTotal');
    const productQtyById = {};

    function getProductVisualById(id) {
        const addBtn = document.querySelector('.btn-add[data-product-id="' + id + '"]');
        if (!addBtn) return { image: null, emoji: null };
        const card = addBtn.closest('.product-card');
        if (!card) return { image: null, emoji: null };

        const imageEl = card.querySelector('.product-card__img img');
        const emojiEl = card.querySelector('.product-card__emoji');
        return {
            image: imageEl ? imageEl.getAttribute('src') : null,
            emoji: emojiEl ? emojiEl.textContent.trim() : null
        };
    }

    // Exponer addToCart globalmente (llamado desde onclick en el HTML)
    window.addToCart = function (id, name, price, emoji, qtyOverride) {
        const qtyToAdd = Math.max(1, qtyOverride || productQtyById[id] || 1);
        const visual = getProductVisualById(id);
        const imageSrc = visual.image;
        const fallbackEmoji = visual.emoji || emoji;

        if (cart[id]) {
            cart[id].qty += qtyToAdd;
            if (!cart[id].image && imageSrc) {
                cart[id].image = imageSrc;
            }
        } else {
            cart[id] = {
                name: name,
                price: price,
                emoji: fallbackEmoji,
                image: imageSrc,
                qty: qtyToAdd
            };
        }
        updateCartUI();
        openCart();
        // Feedback visual en el botón
        const btns = document.querySelectorAll('[onclick*="' + id + '"]');
        btns.forEach(function (btn) {
            if (btn.classList.contains('btn-add')) {
                const original = btn.innerHTML;
                btn.classList.add('added');
                btn.innerHTML = '✓ Agregado x' + qtyToAdd;
                setTimeout(function () {
                    btn.classList.remove('added');
                    btn.innerHTML = original;
                }, 1600);
            }
        });
    };

    // Inicializa control de cantidad + / - en cada card de producto
    (function initProductQtyControls() {
        const addButtons = document.querySelectorAll('.product-card .btn-add[onclick]');
        addButtons.forEach(function (btn) {
            const onclick = btn.getAttribute('onclick') || '';
            const match = onclick.match(/addToCart\('([^']+)'/);
            if (!match) return;
            const productId = match[1];
            productQtyById[productId] = 1;
            btn.dataset.productId = productId;

            const actions = btn.closest('.product-card__actions');
            if (!actions || actions.querySelector('.product-qty')) return;

            const qty = document.createElement('div');
            qty.className = 'product-qty';
            qty.innerHTML =
                '<button class="product-qty__btn" data-action="dec" data-id="' + productId + '" aria-label="Restar unidad">−</button>' +
                '<span class="product-qty__value" data-id="' + productId + '">1</span>' +
                '<button class="product-qty__btn" data-action="inc" data-id="' + productId + '" aria-label="Sumar unidad">+</button>';
            actions.insertBefore(qty, btn);
        });

        document.addEventListener('click', function (e) {
            const qtyBtn = e.target.closest('.product-qty__btn');
            if (!qtyBtn) return;
            e.preventDefault();
            e.stopPropagation();

            const productId = qtyBtn.dataset.id;
            if (!productId) return;

            const action = qtyBtn.dataset.action;
            const current = productQtyById[productId] || 1;
            const next = action === 'inc' ? current + 1 : current - 1;
            productQtyById[productId] = Math.min(99, Math.max(1, next));

            document.querySelectorAll('.product-qty__value[data-id="' + productId + '"]').forEach(function (el) {
                el.textContent = String(productQtyById[productId]);
            });
        });
    })();

    function updateCartUI() {
        const items  = Object.values(cart);
        const count  = items.reduce(function (sum, i) { return sum + i.qty; }, 0);
        const total  = items.reduce(function (sum, i) { return sum + i.price * i.qty; }, 0);

        // Badge
        cartCount.textContent = count;
        cartCount.classList.remove('bounce');
        void cartCount.offsetWidth; // reflow
        cartCount.classList.add('bounce');

        // Empty state
        cartEmpty.style.display = count === 0 ? '' : 'none';
        cartFooter.style.display = count === 0 ? 'none' : '';

        // Total
        cartTotal.textContent = formatPrice(total);

        // Items
        const existingItems = cartBody.querySelectorAll('.cart-item');
        existingItems.forEach(function (el) { el.remove(); });

        items.forEach(function (item) {
            const id  = Object.keys(cart).find(function (k) { return cart[k] === item; });
            const div = document.createElement('div');
            div.className = 'cart-item';
            const media = item.image
                ? '<img src="' + item.image + '" alt="' + item.name + '">'
                : item.emoji;
            div.innerHTML =
                '<div class="cart-item__emoji">' + media + '</div>' +
                '<div class="cart-item__info">' +
                    '<h4>' + item.name + '</h4>' +
                    '<span>' + formatPrice(item.price) + '</span>' +
                '</div>' +
                '<div class="cart-item__controls">' +
                    '<button class="cart-qty-btn" data-id="' + id + '" data-action="dec">−</button>' +
                    '<span class="cart-qty">' + item.qty + '</span>' +
                    '<button class="cart-qty-btn" data-id="' + id + '" data-action="inc">+</button>' +
                '</div>';
            cartBody.insertBefore(div, cartEmpty);
        });
    }

    // Delegación de eventos para botones +/-
    cartBody.addEventListener('click', function (e) {
        const btn = e.target.closest('.cart-qty-btn');
        if (!btn) return;
        const id     = btn.dataset.id;
        const action = btn.dataset.action;
        if (!cart[id]) return;
        if (action === 'inc') {
            cart[id].qty += 1;
        } else {
            cart[id].qty -= 1;
            if (cart[id].qty <= 0) delete cart[id];
        }
        updateCartUI();
    });

    function openCart() {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeCart() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function formatPrice(n) {
        return '$' + n.toLocaleString('es-AR');
    }

    /* ================================================
       MODAL DETALLE DE PRODUCTO
    ================================================ */
    const productModal = document.getElementById('productModal');
    const productModalClose = document.getElementById('productModalClose');
    const productModalMedia = document.getElementById('productModalMedia');
    const productModalCat = document.getElementById('productModalCat');
    const productModalTitle = document.getElementById('productModalTitle');
    const productModalDesc = document.getElementById('productModalDesc');
    const productModalPrice = document.getElementById('productModalPrice');
    const productModalCuotas = document.getElementById('productModalCuotas');
    const modalQtyDec = document.getElementById('modalQtyDec');
    const modalQtyInc = document.getElementById('modalQtyInc');
    const modalQtyValue = document.getElementById('modalQtyValue');
    const modalAddToCart = document.getElementById('modalAddToCart');

    const productDetails = {
        'aa-split-3000': 'Equipo split inverter frío/calor ideal para ambientes medianos. Incluye modo sueño, temporizador y conectividad WiFi para control remoto desde el celular.',
        'cocina-multigas': 'Cocina multigas de 56 cm con horno de gran capacidad, rejillas reforzadas y encendido eléctrico en hornallas para un uso diario cómodo y seguro.',
        'heladera-nofrost': 'Heladera No Frost de 320 litros con freezer superior independiente, estantes regulables y eficiencia energética A+ para ahorro real en consumo.',
        'lavarropas-8kg': 'Lavarropas automático de carga frontal con 15 programas, centrifugado de 1200 rpm y display digital para elegir ciclos rápidos o delicados según tu necesidad.',
        'microondas-20l': 'Microondas digital de 20 litros con función grill, descongelado por peso y menús automáticos para cocinar o recalentar en pocos minutos.',
        'lavavajillas-12': 'Lavavajillas para 12 cubiertos con múltiples programas, secado eficiente y bajo consumo. Perfecto para optimizar tiempo y mantener tu vajilla impecable.'
    };

    let modalProduct = null;
    let modalQty = 1;

    function parseProductFromCard(card) {
        const addBtn = card.querySelector('.btn-add[onclick]');
        if (!addBtn) return null;
        const onclick = addBtn.getAttribute('onclick') || '';
        const match = onclick.match(/addToCart\('([^']*)','([^']*)',(\d+),'([^']*)'/);
        if (!match) return null;
        return {
            id: match[1],
            name: match[2],
            price: Number(match[3]),
            emoji: match[4]
        };
    }

    function syncQtyBadges(productId) {
        document.querySelectorAll('.product-qty__value[data-id="' + productId + '"]').forEach(function (el) {
            el.textContent = String(productQtyById[productId] || 1);
        });
    }

    function openProductModal(card) {
        const product = parseProductFromCard(card);
        if (!product) return;

        const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : 'Producto';
        const shortDesc = card.querySelector('.product-card__body p') ? card.querySelector('.product-card__body p').textContent.trim() : '';
        const cat = card.querySelector('.product-card__tag') ? card.querySelector('.product-card__tag').textContent.trim() : 'Catálogo';
        const price = card.querySelector('.price-main') ? card.querySelector('.price-main').textContent.trim() : '';
        const cuotas = card.querySelector('.product-card__cuotas') ? card.querySelector('.product-card__cuotas').textContent.trim() : '';

        const imageEl = card.querySelector('.product-card__img img');
        const emojiEl = card.querySelector('.product-card__emoji');

        productModalMedia.innerHTML = '';
        if (imageEl) {
            const clone = imageEl.cloneNode();
            clone.removeAttribute('style');
            clone.loading = 'eager';
            productModalMedia.appendChild(clone);
        } else if (emojiEl) {
            const emoji = document.createElement('div');
            emoji.className = 'product-modal__emoji';
            emoji.textContent = emojiEl.textContent.trim();
            productModalMedia.appendChild(emoji);
        }

        productModalCat.textContent = cat;
        productModalTitle.textContent = title;
        productModalDesc.textContent = productDetails[product.id] || shortDesc;
        productModalPrice.textContent = price;
        productModalCuotas.textContent = cuotas;

        modalProduct = product;
        modalQty = Math.max(1, productQtyById[product.id] || 1);
        modalQtyValue.textContent = String(modalQty);

        productModal.classList.add('open');
        productModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeProductModal() {
        productModal.classList.remove('open');
        productModal.setAttribute('aria-hidden', 'true');
        if (!cartSidebar.classList.contains('open')) {
            document.body.style.overflow = '';
        }
    }

    productCards.forEach(function (card) {
        card.addEventListener('click', function (e) {
            if (e.target.closest('button, a, .product-qty')) return;
            openProductModal(card);
        });
    });

    if (productModalClose) {
        productModalClose.addEventListener('click', closeProductModal);
    }
    if (productModal) {
        productModal.addEventListener('click', function (e) {
            if (e.target === productModal) closeProductModal();
        });
    }
    if (modalQtyDec) {
        modalQtyDec.addEventListener('click', function () {
            modalQty = Math.max(1, modalQty - 1);
            modalQtyValue.textContent = String(modalQty);
        });
    }
    if (modalQtyInc) {
        modalQtyInc.addEventListener('click', function () {
            modalQty = Math.min(99, modalQty + 1);
            modalQtyValue.textContent = String(modalQty);
        });
    }
    if (modalAddToCart) {
        modalAddToCart.addEventListener('click', function () {
            if (!modalProduct) return;
            productQtyById[modalProduct.id] = modalQty;
            syncQtyBadges(modalProduct.id);
            window.addToCart(modalProduct.id, modalProduct.name, modalProduct.price, modalProduct.emoji, modalQty);
            closeProductModal();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && productModal && productModal.classList.contains('open')) {
            closeProductModal();
        }
    });

    /* ================================================
       CONTADORES DE ESTADÍSTICAS
    ================================================ */
    let statsAnimated = false;

    function animateStats() {
        if (statsAnimated) return;
        const bSection = document.getElementById('beneficios');
        if (!bSection) return;
        const rect = bSection.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
            statsAnimated = true;
            animateCount(document.getElementById('statClientes'), 2400, '', '+', 1400);
            animateCount(document.getElementById('statProductos'), 300, '', '+', 1400);
        }
    }

    function animateCount(el, target, prefix, suffix, duration) {
        if (!el) return;
        const startTime = performance.now();
        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3);
            el.innerHTML   = prefix + Math.floor(eased * target).toLocaleString('es-AR') + '<span>' + suffix + '</span>';
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', animateStats, { passive: true });
    animateStats();

    /* ================================================
       FORMULARIO DE CONTACTO
    ================================================ */
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateForm(contactForm)) return;

            const btn = contactForm.querySelector('button[type="submit"]');
            btn.disabled  = true;
            btn.textContent = 'Enviando…';

            setTimeout(function () {
                showFormSuccess(contactForm);
            }, 1200);
        });

        contactForm.querySelectorAll('input, select, textarea').forEach(function (field) {
            field.addEventListener('input', function () { clearFieldError(field); });
        });
    }

    function validateForm(form) {
        let valid = true;
        form.querySelectorAll('[required]').forEach(function (field) {
            clearFieldError(field);
            const value = field.value.trim();
            if (!value) {
                showFieldError(field, 'Este campo es obligatorio.');
                valid = false;
            } else if (field.type === 'email' && !isValidEmail(value)) {
                showFieldError(field, 'Ingresá un correo válido.');
                valid = false;
            } else if (field.type === 'tel' && value.replace(/\D/g, '').length < 8) {
                showFieldError(field, 'Ingresá un teléfono válido.');
                valid = false;
            }
        });
        return valid;
    }

    function showFieldError(field, msg) {
        field.style.borderColor = '#E03A3A';
        field.style.boxShadow = '0 0 0 3px rgba(224,58,58,0.1)';
        const err = document.createElement('span');
        err.className = 'field-error';
        err.textContent = msg;
        err.style.cssText = 'display:block;font-size:11px;color:#E03A3A;margin-top:4px;';
        field.parentNode.appendChild(err);
    }

    function clearFieldError(field) {
        field.style.borderColor = '';
        field.style.boxShadow   = '';
        const err = field.parentNode.querySelector('.field-error');
        if (err) err.remove();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showFormSuccess(form) {
        const wrap = form.closest('.contact-form-wrap');
        form.style.display = 'none';
        let success = wrap.querySelector('.form-success');
        if (!success) {
            success = document.createElement('div');
            success.className = 'form-success';
            success.style.cssText = 'text-align:center;padding:40px 24px;';
            success.innerHTML =
                '<div style="font-size:52px;margin-bottom:16px;">✅</div>' +
                '<h3 style="font-family:Montserrat,sans-serif;font-size:1.3rem;color:#0A2540;margin-bottom:10px;">¡Mensaje enviado!</h3>' +
                '<p style="color:#4A6A80;font-size:14px;line-height:1.7;margin-bottom:24px;">Recibimos tu consulta. Te contactamos a la brevedad por teléfono o WhatsApp.</p>' +
                '<a href="https://wa.me/5491100000000" target="_blank" rel="noopener noreferrer"' +
                '   style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:12px 24px;border-radius:6px;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px;text-decoration:none;">' +
                '   💬 Escribinos por WhatsApp' +
                '</a>';
            wrap.appendChild(success);
        }
        success.style.display = 'block';
    }

    /* ================================================
       INIT
    ================================================ */
    handleScroll();
    updateCartUI();

})();
