const CONFIG = {
    storeId: "dd420eef-c2db-4ee6-8a5d-2b865129cc83", 
    apiUrl: "https://split.notissimus.com/api/order/create", 
};

document.addEventListener("DOMContentLoaded", () => {
    const payButton = document.querySelector(".pay-btn");
    if (!payButton) return;

    payButton.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const data = collectOrderData();
            if (!data) return;

            console.log("Собранные данные для отправки:");
            console.log(JSON.stringify(data, null, 2));

            payButton.disabled = true;
            payButton.textContent = "Обработка...";

            const response = await fetch(CONFIG.apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.paymentUrl) {
                console.log("Переход на оплату:", result.paymentUrl);
                window.location.href = result.paymentUrl;
            } else {
                console.error("Ошибка от сервера:", result);
                alert("Ошибка: " + (result.detail || result.title || "Неизвестная ошибка"));
                payButton.disabled = false;
                payButton.textContent = "Оплатить " + data.cart.total.amount.toLocaleString() + " ₽";
            }
        } catch (err) {
            console.error("Ошибка при отправке:", err);
            alert("Не удалось связаться с сервером");
            payButton.disabled = false;
            payButton.textContent = "Оплатить";
        }
    });
});

function collectOrderData() {
    const fio = document.getElementById("fullname")?.value.trim();
    const phone = document.getElementById("phone")?.value.trim();
    const comment = document.getElementById("comment")?.value.trim() || null;

    if (!fio || !phone) {
        alert("Заполните ФИО и телефон!");
        return null;
    }

    const items = [];
    document.querySelectorAll(".cart-item").forEach(item => {
        const title = item.querySelector(".item-name")?.innerText.trim() || "Без названия";
        const qty = parseInt(item.querySelector(".quantity-input")?.value) || 0;
        const priceText = item.querySelector(".item-price")?.innerText || "0";
        const price = parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

        if (qty > 0 && price > 0) {
            items.push({
                productId: null,
                quantity: { count: qty },
                title: title,
                total: qty * price
            });
        }
    });

    if (items.length === 0) {
        alert("Корзина пуста!");
        return null;
    }

    const totalText = document.querySelector(".summary-total span:last-child")?.innerText || "0";
    const totalAmount = parseFloat(totalText.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

    if (totalAmount <= 0) {
        alert("Ошибка: итоговая сумма не определена");
        return null;
    }

    const payload = {
        cart: {
            items: items,
            total: { amount: totalAmount }
        },
        currencyCode: "RUB",
        storeId: CONFIG.storeId,
        orderId: null,
        redirectUrls: null
    };

    //console.log("Готовый JSON для отправки:");
    //console.log(JSON.stringify(payload, null, 2));

    return payload;
}
